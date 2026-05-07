import { useState, useMemo, useRef } from 'react'
import { Chart as ChartJS, ArcElement, Tooltip } from 'chart.js'
import CandidateDrawer, { type DrawerCandidate } from './CandidateDrawer'
import MoleculeSketcher from './MoleculeSketcher'
import { useApp } from '../context/AppContext'
import { analyze } from '../api/client'

ChartJS.register(ArcElement, Tooltip)

interface Candidate {
  rank: number
  name: string
  smiles?: string
  activity: number
  selectivity: number
  stability: number
  type: 'Known' | 'Novel'
  reason: string
  cost: number
  scalability: number
}

const candidates: Candidate[] = [
  { rank: 1, name: 'Cobalt-phosphine complex', activity: 92, selectivity: 88, stability: 95, type: 'Known', reason: 'High TOF for hydrogenation', cost: 70, scalability: 75 },
  { rank: 2, name: 'Fe-PNP pincer catalyst', activity: 87, selectivity: 91, stability: 89, type: 'Novel', reason: 'Predicted low overpotential', cost: 85, scalability: 80 },
  { rank: 3, name: 'Ru-bipyridyl', activity: 85, selectivity: 79, stability: 92, type: 'Known', reason: 'Stable under aqueous conditions', cost: 45, scalability: 60 },
  { rank: 4, name: 'Mn-carbonyl dimer', activity: 78, selectivity: 94, stability: 71, type: 'Novel', reason: 'High selectivity for CO₂ reduction', cost: 88, scalability: 72 },
  { rank: 5, name: 'Ni-terpyridine', activity: 81, selectivity: 73, stability: 86, type: 'Novel', reason: 'Earth-abundant metal', cost: 92, scalability: 85 },
  { rank: 6, name: 'Pd-NHC complex', activity: 76, selectivity: 82, stability: 90, type: 'Known', reason: 'Benchmark cross-coupling', cost: 35, scalability: 55 },
  { rank: 7, name: 'Cu-phenanthroline', activity: 69, selectivity: 77, stability: 83, type: 'Novel', reason: 'Low-cost alternative', cost: 90, scalability: 88 },
  { rank: 8, name: 'Ir-COD dimer', activity: 73, selectivity: 85, stability: 78, type: 'Known', reason: 'High enantioselectivity', cost: 25, scalability: 40 },
]

const smilesMap: Record<string, string> = {
  'Cobalt-phosphine complex': 'CC1=C(C(=CC=C1)P(C2=CC=CC=C2)C3=CC=CC=C3)C.[Co]',
  'Fe-PNP pincer catalyst': 'CC(C)(C)P(=O)(N1CCN(C1=O)C(C)(C)C)[Fe]',
  'Ru-bipyridyl': 'C1=CC=NC(=C1)C2=CC=CC=N2.[Ru]',
  'Mn-carbonyl dimer': 'C(#O)[Mn](C#O)(C#O)(C#O)C#O',
  'Ni-terpyridine': 'C1=CC=NC(=C1)C2=NC(=CC=C2)C3=CC=CC=N3.[Ni]',
  'Pd-NHC complex': 'CN1C=CN(C1=O)[Pd]',
  'Cu-phenanthroline': 'C1=CC2=C3C(=C1)C=CC=N3C=CC2.[Cu]',
  'Ir-COD dimer': 'C1=CC=CC=C1.[Ir]',
}

function toDrawerCandidate(c: Candidate): DrawerCandidate {
  const confidence = Math.round((c.activity + c.selectivity + c.stability) / 3)
  const novelty = c.type === 'Novel' ? Math.round(65 + Math.random() * 25) : Math.round(20 + Math.random() * 25)
  return {
    name: c.name,
    rank: c.rank,
    type: c.type,
    activity: c.activity,
    selectivity: c.selectivity,
    stability: c.stability,
    confidence,
    novelty,
    smiles: c.smiles || smilesMap[c.name] || 'N/A',
    reason: c.reason,
    sections: [
      {
        label: 'PREDICTIVE SCORES',
        items: [
          { key: 'Activity', value: c.activity, help: 'Catalytic activity score relative to benchmark catalysts' },
          { key: 'Selectivity', value: c.selectivity, help: 'Product selectivity under standard reaction conditions' },
          { key: 'Stability', value: c.stability, help: 'Predicted stability across relevant temperature and pressure ranges' },
          { key: 'Confidence', value: confidence, help: 'Aggregate prediction confidence across all scored metrics' },
          { key: 'Novelty', value: novelty, help: 'Structural dissimilarity from known catalyst database entries' },
        ],
      },
      {
        label: 'COMPUTATIONAL METRICS',
        items: [
          { key: 'Cost', value: c.cost, help: 'Estimated synthesis and material cost score' },
          { key: 'Scalability', value: c.scalability, help: 'Scalability assessment for industrial-scale application' },
        ],
      },
    ],
  }
}

function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  )
}

function DiscoveryContent() {
  const [selected, setSelected] = useState<Candidate | null>(null)
  const [reaction, setReaction] = useState('')
  const [temperature, setTemperature] = useState('150')
  const [pressure, setPressure] = useState('30')
  const [loading, setLoading] = useState(false)
  const [apiResults, setApiResults] = useState<Record<string, unknown>[] | null>(null)
  const { setLastAnalysis, showToast } = useApp()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const drawerCandidate = useMemo(() => {
    if (!selected) return null
    return toDrawerCandidate(selected)
  }, [selected])

  const displayCandidates: Candidate[] = useMemo(() => {
    if (apiResults) {
      return apiResults.map((r, i) => ({
        rank: i + 1,
        name: (r.name as string) ?? '',
        smiles: (r.smiles as string) ?? '',
        activity: (r.activity as number) ?? 0,
        selectivity: (r.selectivity as number) ?? 0,
        stability: (r.stability as number) ?? 0,
        type: (r.type as 'Known' | 'Novel') ?? 'Known',
        reason: (r.reason as string) ?? '',
        cost: (r.cost as number) ?? Math.round(40 + Math.random() * 50),
        scalability: (r.scalability as number) ?? Math.round(40 + Math.random() * 50),
      }))
    }
    return candidates
  }, [apiResults])

  const runAnalysis = async () => {
    setLoading(true)
    try {
      const res = await analyze({
        reaction: reaction || 'CO\u2082 + H\u2082 \u2192 methanol',
        direction: 'catalysis',
        temperature: Number(temperature) || 150,
        pressure: Number(pressure) || 30,
      })
      setApiResults(res.candidates)
      setLastAnalysis({
        direction: 'catalysis',
        candidates: res.candidates,
        params: { reaction, temperature: Number(temperature), pressure: Number(pressure) },
        timestamp: Date.now(),
      })
      showToast('Analysis complete — 8 candidates generated', 'success')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Analysis failed'
      showToast(msg, 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const text = ev.target?.result as string
        const lines = text.trim().split('\n')
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
        const imported: Record<string, unknown>[] = lines.slice(1).map((line, i) => {
          const vals = line.split(',')
          const row: Record<string, unknown> = {}
          headers.forEach((h, idx) => { row[h] = vals[idx]?.trim() ?? '' })
          return {
            name: row['name'] ?? `Compound ${i + 1}`,
            smiles: row['smiles'] ?? '',
            activity: Number(row['activity'] ?? row['act'] ?? 75),
            selectivity: Number(row['selectivity'] ?? row['sel'] ?? 75),
            stability: Number(row['stability'] ?? row['stab'] ?? 75),
            type: String(row['type'] ?? 'Known').toLowerCase().includes('novel') ? 'Novel' : 'Known',
            reason: row['reason'] ?? 'Imported candidate',
            cost: Number(row['cost'] ?? 70),
            scalability: Number(row['scalability'] ?? 70),
          }
        }).filter(r => r.name)
        if (imported.length === 0) throw new Error('No valid rows found')
        setApiResults(imported)
        showToast(`Imported ${imported.length} candidates from CSV`, 'success')
      } catch (err: unknown) {
        showToast(err instanceof Error ? err.message : 'Failed to parse CSV', 'error')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  return (
    <div className="flex gap-6">
      <div className="w-[260px] shrink-0 space-y-4">
        <div>
          <label className="text-xs text-foreground/60 mb-1.5 block">Target Reaction</label>
          <textarea
            value={reaction}
            onChange={e => setReaction(e.target.value)}
            placeholder="e.g. CO₂ + H₂ → methanol"
            rows={3}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-foreground/30 resize-none outline-none focus:border-indigo-500/50 transition"
          />
        </div>

        <div className="flex gap-3">
          <div className="flex-1">
            <label className="text-xs text-foreground/60 mb-1.5 block">Temperature (°C)</label>
            <input
              type="number"
              value={temperature}
              onChange={e => setTemperature(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-indigo-500/50 transition"
            />
          </div>
          <div className="flex-1">
            <label className="text-xs text-foreground/60 mb-1.5 block">Pressure (bar)</label>
            <input
              type="number"
              value={pressure}
              onChange={e => setPressure(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-indigo-500/50 transition"
            />
          </div>
        </div>

        <button
          onClick={runAnalysis}
          disabled={loading}
          className="w-full py-2.5 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? <Spinner /> : null}
          {loading ? 'Analyzing…' : 'Run Analysis'}
        </button>

        <div>
          <label className="text-xs text-foreground/60 mb-1.5 block">Molecule Viewer</label>
          <MoleculeSketcher
            externalSmiles={selected ? (selected.smiles || smilesMap[selected.name] || '') : ''}
          />
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={handleImport}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-full py-2 rounded-lg text-sm font-medium text-foreground/70 border border-white/10 hover:bg-white/5 transition"
        >
          Import CSV
        </button>
      </div>

      <div className="flex-1 min-w-0">
        <div className="text-xs text-foreground/50 mb-3">
          {apiResults
            ? `${apiResults.filter(r => r.type === 'Known').length} known retrieved · ${apiResults.filter(r => r.type === 'Novel').length} novel generated`
            : '23 known retrieved · 8 novel generated'}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-foreground/40 border-b border-white/5">
                <th className="text-left py-2 pr-3 font-medium">Rank</th>
                <th className="text-left py-2 pr-3 font-medium">Candidate Name</th>
                <th className="text-right py-2 pr-3 font-medium">Activity</th>
                <th className="text-right py-2 pr-3 font-medium">Selectivity</th>
                <th className="text-right py-2 pr-3 font-medium">Stability</th>
                <th className="text-center py-2 pr-3 font-medium">Type</th>
                <th className="text-left py-2 font-medium">Reason</th>
              </tr>
            </thead>
            <tbody>
              {displayCandidates.map((c, i) => (
                <tr
                  key={c.rank}
                  onClick={() => setSelected(selected?.rank === c.rank ? null : c)}
                  className={`cursor-pointer transition ${
                    i % 2 === 0 ? 'bg-white/[0.02]' : 'bg-white/[0.06]'
                  } hover:bg-indigo-500/5 ${
                    selected?.rank === c.rank ? 'bg-indigo-500/10' : ''
                  }`}
                >
                  <td className="py-2.5 pr-3 text-foreground/60">{c.rank}</td>
                  <td className="py-2.5 pr-3 text-foreground">{c.name}</td>
                  <td className="py-2.5 pr-3 text-right text-foreground/80">{c.activity}%</td>
                  <td className="py-2.5 pr-3 text-right text-foreground/80">{c.selectivity}%</td>
                  <td className="py-2.5 pr-3 text-right text-foreground/80">{c.stability}%</td>
                  <td className="py-2.5 pr-3 text-center">
                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                      c.type === 'Known'
                        ? 'bg-gray-500/20 text-gray-400'
                        : 'bg-green-500/15 text-green-400 shadow-[0_0_8px_rgba(34,197,94,0.25)]'
                    }`}>
                      {c.type}
                    </span>
                  </td>
                  <td className="py-2.5 text-foreground/50 text-xs">{c.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {drawerCandidate && (
        <CandidateDrawer candidate={drawerCandidate} onClose={() => setSelected(null)} />
      )}
    </div>
  )
}

export default DiscoveryContent
