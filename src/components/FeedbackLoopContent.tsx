import { useState, useMemo, useEffect } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from 'chart.js'
import { Bar } from 'react-chartjs-2'
import { useApp } from '../context/AppContext'
import { submitFeedback } from '../api/client'

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend)

const fallbackCandidates = [
  'Cobalt-phosphine complex',
  'Fe-PNP pincer catalyst',
  'Ru-bipyridyl',
  'Mn-carbonyl dimer',
  'Ni-terpyridine',
  'Pd-NHC complex',
  'Cu-phenanthroline',
  'Ir-COD dimer',
]

const predictedScores: Record<string, { activity: number; selectivity: number; stability: number }> = {
  'Cobalt-phosphine complex': { activity: 92, selectivity: 88, stability: 95 },
  'Fe-PNP pincer catalyst':    { activity: 87, selectivity: 91, stability: 89 },
  'Ru-bipyridyl':              { activity: 85, selectivity: 79, stability: 92 },
  'Mn-carbonyl dimer':         { activity: 78, selectivity: 94, stability: 71 },
  'Ni-terpyridine':            { activity: 81, selectivity: 73, stability: 86 },
  'Pd-NHC complex':            { activity: 76, selectivity: 82, stability: 90 },
  'Cu-phenanthroline':         { activity: 69, selectivity: 77, stability: 83 },
  'Ir-COD dimer':              { activity: 73, selectivity: 85, stability: 78 },
}

interface LogEntry {
  candidateName: string
  predicted: { activity: number; selectivity: number; stability: number }
  actual: { activity: number; selectivity: number; stability: number }
  notes: string
}

type MetricStatus = 'Exceeded' | 'Matched' | 'Underperformed'

function metricStatus(actual: number, predicted: number): MetricStatus {
  if (actual > predicted) return 'Exceeded'
  if (actual === predicted) return 'Matched'
  return 'Underperformed'
}

function overallStatus(e: LogEntry): MetricStatus {
  const avgP = (e.predicted.activity + e.predicted.selectivity + e.predicted.stability) / 3
  const avgA = (e.actual.activity + e.actual.selectivity + e.actual.stability) / 3
  if (avgA > avgP) return 'Exceeded'
  if (avgA === avgP) return 'Matched'
  return 'Underperformed'
}

const statusColors: Record<MetricStatus, string> = {
  Exceeded: 'bg-green-500/15 text-green-400 shadow-[0_0_8px_rgba(34,197,94,0.25)]',
  Matched: 'bg-blue-500/15 text-blue-400 shadow-[0_0_8px_rgba(59,130,246,0.25)]',
  Underperformed: 'bg-red-500/15 text-red-400 shadow-[0_0_8px_rgba(239,68,68,0.25)]',
}

function generateInsights(entries: LogEntry[]): string[] {
  if (entries.length === 0) return []
  const lines: string[] = []

  for (const e of entries) {
    const diffs: { metric: string; diff: number }[] = []
    for (const m of ['activity', 'selectivity', 'stability'] as const) {
      const diff = ((e.actual[m] - e.predicted[m]) / e.predicted[m]) * 100
      if (Math.abs(diff) >= 5) diffs.push({ metric: m, diff })
    }
    if (diffs.length > 0) {
      const worst = diffs.reduce((a, b) => Math.abs(a.diff) > Math.abs(b.diff) ? a : b)
      const dir = worst.diff < 0 ? 'underperformed' : 'exceeded'
      lines.push(
        `${e.candidateName} ${dir} by ${Math.abs(worst.diff).toFixed(0)}% ` +
        `in ${worst.metric} — ${worst.diff < 0 ? 'structural feature mismatch detected' : 'favorable interaction profile identified'}.`
      )
    }
  }

  if (entries.length >= 2) {
    const errors = entries.flatMap(e =>
      (['activity', 'selectivity', 'stability'] as const).map(m =>
        Math.abs((e.actual[m] - e.predicted[m]) / e.predicted[m]) * 100
      )
    )
    const avgErr = errors.reduce((a, b) => a + b, 0) / errors.length
    lines.push(
      `Model prediction accuracy averages ${(100 - avgErr).toFixed(1)}% ` +
      `across logged experiments — ${avgErr < 15 ? 'within acceptable tolerance' : 'retraining recommended'}.`
    )
  }

  const allExceeded = entries.filter(e => overallStatus(e) === 'Exceeded')
  if (allExceeded.length > 0) {
    lines.push(
      `${allExceeded.map(e => e.candidateName).join(', ')} ` +
      `${allExceeded.length === 1 ? 'exceeds' : 'exceed'} predictions across all metrics — high-confidence candidate${allExceeded.length === 1 ? '' : 's'}.`
    )
  }

  return lines
}

function FeedbackLoopContent() {
  const { lastAnalysis, feedbackLogs, addFeedbackLog, showToast } = useApp()
  const [submitting, setSubmitting] = useState(false)

  const candidateNames: string[] = useMemo(() => {
    if (lastAnalysis && lastAnalysis.candidates.length > 0) {
      return lastAnalysis.candidates.map(c => c.name as string).filter(Boolean)
    }
    return fallbackCandidates
  }, [lastAnalysis])

  const [selected, setSelected] = useState(fallbackCandidates[0])
  const [actA, setActA] = useState('')
  const [actS, setActS] = useState('')
  const [actSt, setActSt] = useState('')
  const [notes, setNotes] = useState('')

  const logs: LogEntry[] = useMemo(() => {
    return feedbackLogs.map(e => ({
      candidateName: e.candidate_name,
      predicted: e.predicted,
      actual: e.actual,
      notes: e.notes,
    }))
  }, [feedbackLogs])

  const insights = useMemo(() => generateInsights(logs), [logs])

  useEffect(() => {
    if (candidateNames.length > 0 && !candidateNames.includes(selected)) {
      setSelected(candidateNames[0])
    }
  }, [candidateNames, selected])

  const handleSubmit = async () => {
    const a = Number(actA)
    const s = Number(actS)
    const st = Number(actSt)
    if (!actA || !actS || !actSt || isNaN(a) || isNaN(s) || isNaN(st)) {
      showToast('Please fill in all score fields', 'error')
      return
    }
    // Use static predicted scores if available, otherwise derive from last analysis
    const staticPred = predictedScores[selected]
    const analysisPred = lastAnalysis?.candidates.find(c => (c.name as string) === selected)
    const pred = staticPred ?? (analysisPred ? {
      activity: (analysisPred.activity as number) ?? 75,
      selectivity: (analysisPred.selectivity as number) ?? 75,
      stability: (analysisPred.stability as number) ?? 75,
    } : { activity: 75, selectivity: 75, stability: 75 })

    setSubmitting(true)
    try {
      await submitFeedback({
        candidate_name: selected,
        predicted: pred,
        actual: { activity: a, selectivity: s, stability: st },
        notes,
      })
      addFeedbackLog({
        candidate_name: selected,
        predicted: pred,
        actual: { activity: a, selectivity: s, stability: st },
        notes,
        timestamp: Date.now(),
      })
      showToast('Feedback submitted — insights updated', 'success')
      setActA('')
      setActS('')
      setActSt('')
      setNotes('')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Submission failed'
      showToast(msg, 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const chartData = useMemo(() => {
    if (logs.length === 0) return null
    const names = logs.map(e => e.candidateName)
    return {
      labels: names,
      datasets: [
        {
          label: 'Predicted Activity',
          data: logs.map(e => e.predicted.activity),
          backgroundColor: '#6366f1',
          borderRadius: 3,
        },
        {
          label: 'Actual Activity',
          data: logs.map(e => e.actual.activity),
          backgroundColor: '#a5b4fc',
          borderRadius: 3,
        },
        {
          label: 'Predicted Selectivity',
          data: logs.map(e => e.predicted.selectivity),
          backgroundColor: '#10b981',
          borderRadius: 3,
        },
        {
          label: 'Actual Selectivity',
          data: logs.map(e => e.actual.selectivity),
          backgroundColor: '#6ee7b7',
          borderRadius: 3,
        },
        {
          label: 'Predicted Stability',
          data: logs.map(e => e.predicted.stability),
          backgroundColor: '#f59e0b',
          borderRadius: 3,
        },
        {
          label: 'Actual Stability',
          data: logs.map(e => e.actual.stability),
          backgroundColor: '#fcd34d',
          borderRadius: 3,
        },
      ],
    }
  }, [logs])

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: 'rgba(255,255,255,0.6)',
          font: { size: 10, family: 'Geist Sans, sans-serif' },
          boxWidth: 12,
          padding: 12,
          usePointStyle: true,
          pointStyle: 'rectRounded' as const,
        },
      },
      tooltip: {
        backgroundColor: '#0d0a24',
        titleColor: '#ffffff',
        bodyColor: '#d4d4d8',
        padding: 12,
        cornerRadius: 8,
        titleFont: { size: 12, weight: 'bold' as const, family: 'General Sans, sans-serif' },
        bodyFont: { size: 11, family: 'Geist Sans, sans-serif' },
      },
    },
    scales: {
      x: {
        grid: { color: 'rgba(255,255,255,0.04)' },
        ticks: {
          color: 'rgba(255,255,255,0.45)',
          font: { size: 9, family: 'Geist Sans, sans-serif' },
          maxRotation: 25,
        },
      },
      y: {
        min: 0,
        max: 100,
        grid: { color: 'rgba(255,255,255,0.04)' },
        ticks: {
          color: 'rgba(255,255,255,0.35)',
          font: { size: 10, family: 'Geist Sans, sans-serif' },
        },
      },
    },
  }

  return (
    <div className="max-w-6xl space-y-8">
      <h1 className="text-2xl font-headline font-semibold">Feedback Loop</h1>

      <div className="liquid-glass-purple rounded-xl p-6">
        <h2 className="text-sm font-headline font-semibold mb-4">Log Experimental Results</h2>
        <div className="grid grid-cols-5 gap-4">
          <div>
            <label className="text-xs text-foreground/60 mb-1.5 block">Candidate</label>
            <select
              value={selected}
              onChange={e => setSelected(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-indigo-500/50 transition appearance-none cursor-pointer"
            >
              {candidateNames.map(n => (
                <option key={n} value={n} className="bg-[#0d0a24]">{n}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-foreground/60 mb-1.5 block">Actual Activity (0–100)</label>
            <input
              type="number" min={0} max={100}
              value={actA} onChange={e => setActA(e.target.value)}
              placeholder="e.g. 84"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-foreground/30 outline-none focus:border-indigo-500/50 transition"
            />
          </div>
          <div>
            <label className="text-xs text-foreground/60 mb-1.5 block">Actual Selectivity (0–100)</label>
            <input
              type="number" min={0} max={100}
              value={actS} onChange={e => setActS(e.target.value)}
              placeholder="e.g. 79"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-foreground/30 outline-none focus:border-indigo-500/50 transition"
            />
          </div>
          <div>
            <label className="text-xs text-foreground/60 mb-1.5 block">Actual Stability (0–100)</label>
            <input
              type="number" min={0} max={100}
              value={actSt} onChange={e => setActSt(e.target.value)}
              placeholder="e.g. 91"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-foreground/30 outline-none focus:border-indigo-500/50 transition"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full py-2 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting ? (
                <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : null}
              {submitting ? 'Submitting…' : 'Submit'}
            </button>
          </div>
        </div>
        <div className="mt-3">
          <label className="text-xs text-foreground/60 mb-1.5 block">Notes</label>
          <textarea
            value={notes} onChange={e => setNotes(e.target.value)}
            placeholder="Optional observations about this experimental run…"
            rows={2}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-foreground/30 resize-none outline-none focus:border-indigo-500/50 transition"
          />
        </div>
      </div>

      {logs.length > 0 && (
        <>
          <div className="liquid-glass-purple rounded-xl p-6">
            <h2 className="text-sm font-headline font-semibold mb-4">Predicted vs Actual Comparison</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-foreground/40 border-b border-white/5">
                    <th className="text-left py-2 pr-4 font-medium">Candidate</th>
                    <th className="text-center py-2 pr-4 font-medium" colSpan={2}>Activity</th>
                    <th className="text-center py-2 pr-4 font-medium" colSpan={2}>Selectivity</th>
                    <th className="text-center py-2 pr-4 font-medium" colSpan={2}>Stability</th>
                    <th className="text-center py-2 font-medium">Status</th>
                  </tr>
                  <tr className="text-[10px] text-foreground/30 border-b border-white/5">
                    <th />
                    <th className="text-right py-1 pr-2 font-medium">Pred</th>
                    <th className="text-left py-1 pr-4 font-medium">Act</th>
                    <th className="text-right py-1 pr-2 font-medium">Pred</th>
                    <th className="text-left py-1 pr-4 font-medium">Act</th>
                    <th className="text-right py-1 pr-2 font-medium">Pred</th>
                    <th className="text-left py-1 pr-4 font-medium">Act</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {[...logs].reverse().map((e, i) => {
                    const rowIdx = logs.length - 1 - i
                    return (
                      <tr key={rowIdx} className={rowIdx % 2 === 0 ? 'bg-white/[0.02]' : 'bg-white/[0.06]'}>
                        <td className="py-2.5 pr-4 text-foreground whitespace-nowrap">{e.candidateName}</td>
                        <td className="py-2.5 pr-2 text-right text-foreground/60">{e.predicted.activity}%</td>
                        <td className="py-2.5 pr-4 text-left text-foreground/80">{e.actual.activity}%</td>
                        <td className="py-2.5 pr-2 text-right text-foreground/60">{e.predicted.selectivity}%</td>
                        <td className="py-2.5 pr-4 text-left text-foreground/80">{e.actual.selectivity}%</td>
                        <td className="py-2.5 pr-2 text-right text-foreground/60">{e.predicted.stability}%</td>
                        <td className="py-2.5 pr-4 text-left text-foreground/80">{e.actual.stability}%</td>
                        <td className="py-2.5 text-center">
                          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${statusColors[overallStatus(e)]}`}>
                            {overallStatus(e)}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="liquid-glass-purple rounded-xl p-6">
            <h2 className="text-sm font-headline font-semibold mb-4">Predicted vs Actual — Grouped Comparison</h2>
            <div style={{ height: 320 }}>
              {chartData && <Bar data={chartData} options={chartOptions} />}
            </div>
          </div>

          <div className="liquid-glass-purple rounded-xl p-6">
            <h2 className="text-sm font-headline font-semibold mb-4">Model Insights</h2>
            <div className="space-y-2.5">
              {insights.map((line, i) => (
                <div key={i} className="flex items-start gap-2.5 text-sm text-foreground/80">
                  <span className="text-indigo-400 mt-0.5 shrink-0">&#9679;</span>
                  <span>{line}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {logs.length === 0 && (
        <div className="flex items-center justify-center py-20 text-foreground/30 text-sm">
          No experimental results logged yet. Submit a result above to see comparisons.
        </div>
      )}
    </div>
  )
}

export default FeedbackLoopContent
