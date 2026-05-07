import { useEffect, useRef, useState } from 'react'
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
} from 'chart.js'
import { Radar } from 'react-chartjs-2'

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip)

export interface DrawerCandidate {
  name: string
  rank: number
  type: 'Known' | 'Novel'
  activity: number
  selectivity: number
  stability: number
  confidence: number
  novelty: number
  smiles: string
  reason: string
  sections: {
    label: string
    items: { key: string; value: number; help: string }[]
  }[]
}

function HelpTip({ text }: { text: string }) {
  return (
    <span className="relative group inline-flex items-center ml-1">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-foreground/30 hover:text-foreground/60 transition cursor-help">
        <circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>
      </svg>
      <div className="absolute left-full ml-2.5 top-1/2 -translate-y-1/2 px-2.5 py-1.5 bg-gray-900 text-[11px] text-white rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition pointer-events-none z-50 shadow-lg max-w-[200px]">
        {text}
      </div>
    </span>
  )
}

export default function CandidateDrawer({
  candidate,
  onClose,
}: {
  candidate: DrawerCandidate
  onClose: () => void
}) {
  const overlayRef = useRef<HTMLDivElement>(null)
  const [mounted, setMounted] = useState(false)

  const exportToLab = () => {
    const report = {
      generated: new Date().toISOString(),
      candidate: {
        name: candidate.name,
        rank: candidate.rank,
        type: candidate.type,
        smiles: candidate.smiles,
        reason: candidate.reason,
        scores: {
          activity: candidate.activity,
          selectivity: candidate.selectivity,
          stability: candidate.stability,
          confidence: candidate.confidence,
          novelty: candidate.novelty,
        },
        sections: candidate.sections,
      },
    }
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${candidate.name.replace(/\s+/g, '_')}_lab_report.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  useEffect(() => {
    requestAnimationFrame(() => setMounted(true))
  }, [])

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  const radarData = {
    labels: ['Activity', 'Selectivity', 'Stability', 'Confidence', 'Novelty'],
    datasets: [
      {
        data: [candidate.activity, candidate.selectivity, candidate.stability, candidate.confidence, candidate.novelty],
        backgroundColor: 'rgba(99, 102, 241, 0.15)',
        borderColor: '#6366f1',
        borderWidth: 1.5,
        pointBackgroundColor: '#6366f1',
        pointBorderColor: '#6366f1',
        pointRadius: 2.5,
      },
    ],
  }

  const radarOptions = {
    scales: {
      r: {
        min: 0,
        max: 100,
        ticks: { display: false, stepSize: 25 },
        grid: { color: 'rgba(255,255,255,0.06)' },
        angleLines: { color: 'rgba(255,255,255,0.06)' },
        pointLabels: { color: 'rgba(255,255,255,0.45)', font: { size: 9, family: 'Geist Sans, sans-serif' } },
      },
    },
    plugins: { tooltip: { enabled: false }, legend: { display: false } },
    maintainAspectRatio: false,
  }

  return (
    <div
      ref={overlayRef}
      onClick={e => { if (e.target === overlayRef.current) onClose() }}
      className="fixed inset-0 z-50 flex justify-end"
    >
      <div
        className={`absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${
          mounted ? 'opacity-100' : 'opacity-0'
        }`}
      />

      <div
        className={`relative w-[400px] h-full flex flex-col transition-transform duration-300 ease-out ${
          mounted ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{ background: '#0d0a24', borderLeft: '0.5px solid rgba(255,255,255,0.1)' }}
      >
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <div className="flex items-start justify-between mb-5">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[11px] text-foreground/40 font-medium">#{candidate.rank}</span>
                <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                  candidate.type === 'Known'
                    ? 'bg-gray-500/20 text-gray-400'
                    : 'bg-green-500/15 text-green-400 shadow-[0_0_8px_rgba(34,197,94,0.25)]'
                }`}>
                  {candidate.type}
                </span>
              </div>
              <h2 className="text-base font-headline font-semibold text-foreground leading-tight">{candidate.name}</h2>
            </div>
            <button onClick={onClose} className="text-foreground/40 hover:text-foreground transition ml-3 mt-1 shrink-0">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          <div className="mb-5">
            <div className="text-[10px] text-foreground/40 mb-1 font-mono uppercase tracking-wider">SMILES</div>
            <div className="bg-white/[0.03] border border-white/5 rounded-lg px-3 py-2">
              <code className="text-xs font-mono text-foreground/60 break-all select-all leading-relaxed">
                {candidate.smiles}
              </code>
            </div>
          </div>

          <div style={{ height: 210 }} className="mb-5">
            <Radar data={radarData} options={radarOptions} />
          </div>

          {candidate.sections.map(section => (
            <div key={section.label} className="mb-5">
              <div className="text-[10px] text-foreground/40 font-medium uppercase tracking-wider mb-2.5">{section.label}</div>
              <div className="space-y-2">
                {section.items.map(item => (
                  <div key={item.key} className="flex items-center justify-between text-xs">
                    <span className="text-foreground/50 flex items-center">
                      {item.key}
                      <HelpTip text={item.help} />
                    </span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-1.5 rounded-full bg-white/5 overflow-hidden">
                        <div className="h-full rounded-full bg-blue-500" style={{ width: `${item.value}%` }} />
                      </div>
                      <span className="text-foreground/70 w-7 text-right">{item.value}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div className="mb-5">
            <div className="text-[10px] text-foreground/40 font-medium uppercase tracking-wider mb-1.5">Top Reason</div>
            <p className="text-xs text-foreground/70 leading-relaxed">{candidate.reason}</p>
          </div>
        </div>

        <div className="shrink-0 px-6 py-4 border-t border-white/5 flex gap-3">
          <button
            onClick={exportToLab}
            className="flex-1 py-2.5 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition"
          >
            Export for Lab Testing
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-lg text-sm font-medium text-foreground/70 border border-white/10 hover:bg-white/5 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
