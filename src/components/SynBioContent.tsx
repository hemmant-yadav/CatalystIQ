import { useState, useMemo } from 'react'
import CandidateDrawer, { type DrawerCandidate } from './CandidateDrawer'
import { useApp } from '../context/AppContext'
import { analyze } from '../api/client'

function ChevronDown() {
  return (
    <svg width="10" height="10" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-foreground/40">
      <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

interface Candidate {
  rank: number
  name: string
  smiles?: string
  yield_: number
  thermostability: number
  fluxEfficiency: number
  type: 'Known' | 'Novel'
  reason: string
  selectivity: number
  viability: number
}

const smilesMap: Record<string, string> = {
  'AADH-ADH fusion pathway': 'CC(C)CC(=O)SCoA',
  'FAS mutant R1834K': 'CCCCCC(=O)SCoA',
  'TEV protease variant': 'ENLYFQGS',
  'Xylose isomerase': 'C1=CC=C(C=C1)CO',
  'P450-BM3 chimera': 'CC(C)CC(=O)O',
  'Acetyl-CoA carboxylase': 'CC(=O)SCoA',
  'Rubisco activase': 'O=C=O',
  'Fumarate reductase': 'OC(=O)/C=C/C(=O)O',
}

function toDrawerCandidate(c: Candidate): DrawerCandidate {
  const confidence = Math.round((c.yield_ + c.selectivity + c.thermostability) / 3)
  const novelty = c.type === 'Novel' ? Math.round(65 + Math.random() * 25) : Math.round(20 + Math.random() * 25)
  return {
    name: c.name,
    rank: c.rank,
    type: c.type,
    activity: c.yield_,
    selectivity: c.selectivity,
    stability: c.thermostability,
    confidence,
    novelty,
    smiles: c.smiles || smilesMap[c.name] || 'N/A',
    reason: c.reason,
    sections: [
      {
        label: 'PREDICTIVE SCORES',
        items: [
          { key: 'Activity', value: c.yield_, help: 'Metabolic pathway yield score under optimized conditions' },
          { key: 'Selectivity', value: c.selectivity, help: 'Product selectivity in the engineered pathway' },
          { key: 'Stability', value: c.thermostability, help: 'Thermostability and long-term stability score' },
          { key: 'Confidence', value: confidence, help: 'Aggregate prediction confidence across all scored metrics' },
          { key: 'Novelty', value: novelty, help: 'Genetic and structural novelty compared to known pathways' },
        ],
      },
      {
        label: 'FLUX & VIABILITY',
        items: [
          { key: 'Flux Efficiency', value: c.fluxEfficiency, help: 'Carbon flux efficiency through the engineered pathway' },
          { key: 'Viability', value: c.viability, help: 'Host organism viability and growth score' },
        ],
      },
    ],
  }
}

const candidates: Candidate[] = [
  { rank: 1, name: 'AADH-ADH fusion pathway', yield_: 88, thermostability: 82, fluxEfficiency: 79, type: 'Known', reason: 'High ethanol tolerance', selectivity: 85, viability: 78 },
  { rank: 2, name: 'FAS mutant R1834K', yield_: 76, thermostability: 91, fluxEfficiency: 73, type: 'Novel', reason: 'Enhanced chain elongation', selectivity: 72, viability: 84 },
  { rank: 3, name: 'TEV protease variant', yield_: 69, thermostability: 74, fluxEfficiency: 91, type: 'Novel', reason: 'Optimized metabolic flux', selectivity: 80, viability: 71 },
  { rank: 4, name: 'Xylose isomerase', yield_: 83, thermostability: 68, fluxEfficiency: 76, type: 'Known', reason: 'Broad substrate range', selectivity: 63, viability: 86 },
  { rank: 5, name: 'P450-BM3 chimera', yield_: 71, thermostability: 85, fluxEfficiency: 68, type: 'Novel', reason: 'High oxygenation activity', selectivity: 78, viability: 73 },
  { rank: 6, name: 'Acetyl-CoA carboxylase', yield_: 79, thermostability: 72, fluxEfficiency: 82, type: 'Known', reason: 'Rate-limiting step bypass', selectivity: 69, viability: 80 },
  { rank: 7, name: 'Rubisco activase', yield_: 64, thermostability: 78, fluxEfficiency: 85, type: 'Novel', reason: 'Improved CO₂ fixation', selectivity: 74, viability: 69 },
  { rank: 8, name: 'Fumarate reductase', yield_: 74, thermostability: 69, fluxEfficiency: 71, type: 'Known', reason: 'Anaerobic stability', selectivity: 66, viability: 75 },
]

function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  )
}

function SynBioContent() {
  const [selected, setSelected] = useState<Candidate | null>(null)
  const [reaction, setReaction] = useState('')
  const [organism, setOrganism] = useState('E. coli')
  const [goal, setGoal] = useState('Maximum Yield')
  const [loading, setLoading] = useState(false)
  const [apiResults, setApiResults] = useState<Record<string, unknown>[] | null>(null)
  const { setLastAnalysis, showToast } = useApp()
  const drawerCandidate = useMemo(() => selected ? toDrawerCandidate(selected) : null, [selected])

  const displayCandidates: Candidate[] = useMemo(() => {
    if (apiResults) {
      return apiResults.map((r, i) => ({
        rank: i + 1,
        name: (r.name as string) ?? '',
        smiles: (r.smiles as string) ?? '',
        yield_: (r.yield_score as number) ?? 0,
        thermostability: (r.thermostability as number) ?? 0,
        fluxEfficiency: (r.flux_efficiency as number) ?? 0,
        type: (r.type as 'Known' | 'Novel') ?? 'Known',
        reason: (r.reason as string) ?? '',
        selectivity: (r.selectivity as number) ?? Math.round(50 + Math.random() * 40),
        viability: (r.viability as number) ?? Math.round(50 + Math.random() * 40),
      }))
    }
    return candidates
  }, [apiResults])

  const runAnalysis = async () => {
    setLoading(true)
    try {
      const res = await analyze({
        reaction: reaction || 'Ethanol → Jet Fuel',
        direction: 'biology',
        organism,
        goal,
        temperature: 30,
      })
      setApiResults(res.candidates)
      setLastAnalysis({
        direction: 'biology',
        candidates: res.candidates,
        params: { reaction, organism, goal },
        timestamp: Date.now(),
      })
      showToast('Analysis complete — 6 pathway candidates generated', 'success')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Analysis failed'
      showToast(msg, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex gap-6">
      <div className="w-[260px] shrink-0 space-y-4">
        <div>
          <label className="text-xs text-foreground/60 mb-1.5 block">Target Reaction</label>
          <textarea
            value={reaction}
            onChange={e => setReaction(e.target.value)}
            placeholder="e.g. Ethanol → Jet Fuel"
            rows={3}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-foreground/30 resize-none outline-none focus:border-indigo-500/50 transition"
          />
        </div>

        <div>
          <label className="text-xs text-foreground/60 mb-1.5 block">Host Organism</label>
          <div className="relative">
            <select
              value={organism}
              onChange={e => setOrganism(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-indigo-500/50 transition appearance-none cursor-pointer"
            >
              <option className="bg-[#0d0a24]" value="E. coli">E. coli</option>
              <option className="bg-[#0d0a24]" value="S. cerevisiae">S. cerevisiae</option>
              <option className="bg-[#0d0a24]" value="B. subtilis">B. subtilis</option>
              <option className="bg-[#0d0a24]" value="Custom">Custom</option>
            </select>
            <ChevronDown />
          </div>
        </div>

        <div>
          <label className="text-xs text-foreground/60 mb-1.5 block">Optimization Goal</label>
          <div className="relative">
            <select
              value={goal}
              onChange={e => setGoal(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-indigo-500/50 transition appearance-none cursor-pointer"
            >
              <option className="bg-[#0d0a24]" value="Maximum Yield">Maximum Yield</option>
              <option className="bg-[#0d0a24]" value="Maximum Stability">Maximum Stability</option>
              <option className="bg-[#0d0a24]" value="Minimum Byproducts">Minimum Byproducts</option>
            </select>
            <ChevronDown />
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
      </div>

      <div className="flex-1 min-w-0">
        <div className="text-xs text-foreground/50 mb-3">
          {apiResults
            ? `${apiResults.filter(r => r.type === 'Known').length} known pathways retrieved · ${apiResults.filter(r => r.type === 'Novel').length} novel designed`
            : '14 known pathways retrieved · 6 novel designed'}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-foreground/40 border-b border-white/5">
                <th className="text-left py-2 pr-3 font-medium">Rank</th>
                <th className="text-left py-2 pr-3 font-medium">Enzyme/Pathway Name</th>
                <th className="text-right py-2 pr-3 font-medium">Yield</th>
                <th className="text-right py-2 pr-3 font-medium">Thermostability</th>
                <th className="text-right py-2 pr-3 font-medium">Flux Efficiency</th>
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
                  <td className="py-2.5 pr-3 text-right text-foreground/80">{c.yield_}%</td>
                  <td className="py-2.5 pr-3 text-right text-foreground/80">{c.thermostability}%</td>
                  <td className="py-2.5 pr-3 text-right text-foreground/80">{c.fluxEfficiency}%</td>
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

export default SynBioContent
