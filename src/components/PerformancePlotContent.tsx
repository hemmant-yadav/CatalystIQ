import React, { useState, useCallback, useMemo, useEffect } from 'react'
import {
  Chart as ChartJS,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from 'chart.js'
import { Scatter } from 'react-chartjs-2'
import { useApp } from '../context/AppContext'

ChartJS.register(LinearScale, PointElement, LineElement, Tooltip, Legend)

interface PlotPoint {
  x: number
  y: number
  name: string
  stability: number
  type: 'Known' | 'Novel'
}

const fallbackKnown: PlotPoint[] = [
  { x: 8.8, y: 9.2, name: 'Cobalt-phosphine complex', stability: 9.5, type: 'Known' },
  { x: 7.9, y: 8.5, name: 'Ru-bipyridyl', stability: 9.2, type: 'Known' },
  { x: 8.2, y: 7.6, name: 'Pd-NHC complex', stability: 9.0, type: 'Known' },
  { x: 8.5, y: 7.3, name: 'Ir-COD dimer', stability: 7.8, type: 'Known' },
  { x: 7.0, y: 9.5, name: 'Platinum-oxide catalyst', stability: 8.8, type: 'Known' },
  { x: 9.2, y: 6.5, name: 'Zeolite-Y framework', stability: 9.6, type: 'Known' },
  { x: 6.0, y: 8.0, name: 'Gold-nanoparticle', stability: 8.2, type: 'Known' },
  { x: 7.5, y: 8.8, name: 'Rh-PPh3 complex', stability: 8.5, type: 'Known' },
]

const fallbackNovel: PlotPoint[] = [
  { x: 9.1, y: 8.7, name: 'Fe-PNP pincer catalyst', stability: 8.9, type: 'Novel' },
  { x: 9.4, y: 7.8, name: 'Mn-carbonyl dimer', stability: 7.1, type: 'Novel' },
  { x: 7.3, y: 8.1, name: 'Ni-terpyridine', stability: 8.6, type: 'Novel' },
  { x: 7.7, y: 6.9, name: 'Cu-phenanthroline', stability: 8.3, type: 'Novel' },
  { x: 8.8, y: 7.2, name: 'Co-MOF-74', stability: 6.5, type: 'Novel' },
  { x: 9.5, y: 5.8, name: 'Covalent-organic framework', stability: 7.9, type: 'Novel' },
  { x: 6.8, y: 9.0, name: 'Single-atom Fe-N-C', stability: 7.4, type: 'Novel' },
  { x: 8.5, y: 7.5, name: 'Bio-hybrid enzyme', stability: 6.0, type: 'Novel' },
]

function isInOptimalZone(p: PlotPoint) {
  return ((p.x - 6.5) / 1.5) ** 2 + ((p.y - 7) / 1.5) ** 2 <= 1
}

function candidatesToPoints(candidates: Record<string, unknown>[]): { known: PlotPoint[]; novel: PlotPoint[] } {
  const known: PlotPoint[] = []
  const novel: PlotPoint[] = []
  for (const c of candidates) {
    const x = ((c.selectivity as number) ?? (c.thermostability as number) ?? 0) / 10
    const y = ((c.activity as number) ?? (c.yield_score as number) ?? 0) / 10
    const stability = ((c.stability as number) ?? (c.flux_efficiency as number) ?? 0) / 10
    const pt: PlotPoint = { x, y, name: c.name as string, stability, type: c.type as 'Known' | 'Novel' }
    if (pt.type === 'Known') known.push(pt)
    else novel.push(pt)
  }
  return { known, novel }
}

// showNamesRef is set externally by the component before each render
let _showNames = true
function setShowNamesFlag(v: boolean) { _showNames = v }

const perfPlotPlugin = {
  id: 'perfPlotPlugin',
  afterDraw(chart: ChartJS) {
    try {
      const { ctx, scales, chartArea } = chart
      if (!chartArea) return

      const xScale = scales.x
      const yScale = scales.y
      if (!xScale || !yScale) return

      function drawEllipse(
        cx: number, cy: number, rx: number, ry: number,
        fill: string, stroke: string, label: string, labelColor: string,
      ) {
        const cxPx = xScale.getPixelForValue(cx)
        const cyPx = yScale.getPixelForValue(cy)
        const rxPx = Math.abs(xScale.getPixelForValue(cx + rx) - cxPx)
        const ryPx = Math.abs(yScale.getPixelForValue(cy) - yScale.getPixelForValue(cy + ry))
        if (!rxPx || !ryPx) return

        ctx.save()
        ctx.beginPath()
        ctx.ellipse(cxPx, cyPx, rxPx, ryPx, 0, 0, Math.PI * 2)
        ctx.fillStyle = fill
        ctx.fill()
        ctx.strokeStyle = stroke
        ctx.lineWidth = 1
        ctx.setLineDash([5, 4])
        ctx.stroke()
        ctx.setLineDash([])
        ctx.fillStyle = labelColor
        ctx.font = '12px General Sans, sans-serif'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'bottom'
        ctx.fillText(label, cxPx, cyPx - ryPx - 6)
        ctx.restore()
      }

      drawEllipse(
        5, 5, 3.5, 3,
        'rgba(160, 160, 160, 0.10)',
        'rgba(160, 160, 160, 0.25)',
        'Acceptable Zone',
        'rgba(160, 160, 160, 0.7)',
      )

      drawEllipse(
        6.5, 7, 1.5, 1.5,
        'rgba(255, 200, 0, 0.12)',
        'rgba(255, 200, 0, 0.35)',
        'Optimal Zone',
        'rgba(255, 200, 0, 0.8)',
      )

      chart.data.datasets.forEach((dataset, di) => {
        const meta = chart.getDatasetMeta(di)
        if (!meta || !meta.data) return

        meta.data.forEach((el: any, i) => {
          try {
            const px: number = typeof el.x === 'number' ? el.x : 0
            const py: number = typeof el.y === 'number' ? el.y : 0
            if (!px && !py) return

            if (dataset.label === 'Novel') {
              const grad = ctx.createRadialGradient(px, py, 0, px, py, 14)
              grad.addColorStop(0, 'rgba(34, 197, 94, 0.25)')
              grad.addColorStop(1, 'rgba(34, 197, 94, 0)')
              ctx.save()
              ctx.beginPath()
              ctx.arc(px, py, 14, 0, Math.PI * 2)
              ctx.fillStyle = grad
              ctx.fill()
              ctx.restore()
            }

            if (_showNames && dataset.data && dataset.data[i]) {
              const pt = dataset.data[i] as PlotPoint
              if (pt?.name) {
                ctx.save()
                ctx.fillStyle = 'rgba(255, 255, 255, 0.75)'
                ctx.font = '10px "Geist Sans", sans-serif'
                ctx.textAlign = 'center'
                ctx.textBaseline = 'bottom'
                ctx.fillText(pt.name, px, py - 8)
                ctx.restore()
              }
            }
          } catch {

          }
        })
      })
    } catch {

    }
  },

}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`relative w-9 h-5 rounded-full transition-colors ${
        checked ? 'bg-indigo-600' : 'bg-white/15'
      }`}
    >
      <div
        className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
          checked ? 'translate-x-4' : 'translate-x-0'
        }`}
      />
    </button>
  )
}

function PerformancePlotContent() {
  const [showNames, setShowNames] = useState(true)
  const { lastAnalysis } = useApp()


  useEffect(() => { setShowNamesFlag(showNames) }, [showNames])

  const { known: knownData, novel: novelData } = useMemo(() => {
    if (lastAnalysis && lastAnalysis.candidates.length > 0) {
      return candidatesToPoints(lastAnalysis.candidates)
    }
    return { known: fallbackKnown, novel: fallbackNovel }
  }, [lastAnalysis])

  const allPoints = useMemo(() => [...knownData, ...novelData], [knownData, novelData])

  const optimalCount = allPoints.filter(isInOptimalZone).length
  const outsideCount = allPoints.length - optimalCount

  const chartData = {
    datasets: [
      {
        label: 'Known',
        data: knownData,
        backgroundColor: '#3b82f6',
        borderColor: '#3b82f6',
        borderWidth: 0,
        pointRadius: 6,
        pointHoverRadius: 9,
        pointHitRadius: 12,
      },
      {
        label: 'Novel',
        data: novelData,
        backgroundColor: '#22c55e',
        borderColor: '#22c55e',
        borderWidth: 0,
        pointRadius: 6,
        pointHoverRadius: 9,
        pointHitRadius: 12,
      },
    ],
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'nearest' as const,
      intersect: true,
    },
    scales: {
      x: {
        type: 'linear' as const,
        min: 0,
        max: 10,
        title: {
          display: true,
          text: 'Selectivity Score 0–10',
          color: 'rgba(255,255,255,0.5)',
          font: { size: 12, family: 'Geist Sans, sans-serif' },
        },
        grid: {
          color: 'rgba(255,255,255,0.04)',
        },
        ticks: {
          stepSize: 1,
          color: 'rgba(255,255,255,0.35)',
          font: { size: 10, family: 'Geist Sans, sans-serif' },
        },
      },
      y: {
        type: 'linear' as const,
        min: 0,
        max: 10,
        title: {
          display: true,
          text: 'Activity Score 0–10',
          color: 'rgba(255,255,255,0.5)',
          font: { size: 12, family: 'Geist Sans, sans-serif' },
        },
        grid: {
          color: 'rgba(255,255,255,0.04)',
        },
        ticks: {
          stepSize: 1,
          color: 'rgba(255,255,255,0.35)',
          font: { size: 10, family: 'Geist Sans, sans-serif' },
        },
      },
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        enabled: true,
        backgroundColor: '#0d0a24',
        titleColor: '#ffffff',
        bodyColor: '#d4d4d8',
        padding: 14,
        cornerRadius: 10,
        titleFont: { size: 13, weight: 'bold' as const, family: 'General Sans, sans-serif' },
        bodyFont: { size: 11.5, family: 'Geist Sans, sans-serif' },
        boxPadding: 6,
        displayColors: false,
        callbacks: {
          title: (items: { raw: PlotPoint }[]) => items[0].raw.name,
          beforeBody: (items: { raw: PlotPoint }[]) => {
            const p = items[0].raw
            return `${p.type === 'Known' ? '●' : '✦'} ${p.type}`
          },
          label: (ctx: { parsed: { x: number; y: number }; raw: PlotPoint }) => {
            return [
              `Activity: ${ctx.parsed.y.toFixed(1)} / 10`,
              `Selectivity: ${ctx.parsed.x.toFixed(1)} / 10`,
              `Stability: ${ctx.raw.stability.toFixed(1)} / 10`,
            ]
          },
        },
      },
    } as Record<string, unknown>,
  }

  const buildCSV = useCallback(() => {
    const headers = ['Name', 'Type', 'Activity (0-10)', 'Selectivity (0-10)', 'Stability (0-10)']
    const rows = allPoints.map((p) => [
      `"${p.name}"`,
      p.type,
      p.y.toFixed(1),
      p.x.toFixed(1),
      p.stability.toFixed(1),
    ])
    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
  }, [allPoints])

  const exportCSV = useCallback(() => {
    const csv = buildCSV()
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'performance_plot.csv'
    a.click()
    URL.revokeObjectURL(url)
  }, [buildCSV])

  const copyCSV = useCallback(() => {
    const csv = buildCSV()
    navigator.clipboard.writeText(csv)
  }, [buildCSV])

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-headline font-semibold">Performance Plot</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={exportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium text-foreground/80 border border-white/10 hover:bg-white/5 transition"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Export CSV
          </button>
          <button
            onClick={copyCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium text-foreground/80 border border-white/10 hover:bg-white/5 transition"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
            </svg>
            Copy to Clipboard
          </button>
        </div>
      </div>

      <div className="flex gap-6 flex-1 min-h-0">
        <div className="flex-1 liquid-glass-purple rounded-xl p-5 min-h-0">
          <div style={{ height: '100%', minHeight: 400 }}>
            <Scatter data={chartData} options={chartOptions} plugins={[perfPlotPlugin]} />
          </div>
        </div>

        <aside className="w-64 shrink-0 space-y-5">
          <div className="liquid-glass-purple rounded-xl p-5">
            <h3 className="text-xs font-semibold text-foreground/50 uppercase tracking-wider mb-3">Actions</h3>
            <div className="flex items-center justify-between">
              <span className="text-sm text-foreground/80">Show Candidate Names</span>
              <Toggle checked={showNames} onChange={setShowNames} />
            </div>
          </div>

          <div className="liquid-glass-purple rounded-xl p-5">
            <h3 className="text-xs font-semibold text-foreground/50 uppercase tracking-wider mb-3">Legend</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-blue-500 shrink-0" />
                <span className="text-sm text-foreground/70">Known Candidates</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="relative shrink-0">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <div className="absolute inset-0 w-3 h-3 rounded-full bg-green-500 blur-sm opacity-60" />
                </div>
                <span className="text-sm text-foreground/70">Novel Candidates</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full shrink-0" style={{ background: 'rgba(255, 200, 0, 0.5)' }} />
                <span className="text-sm text-foreground/70">Optimal Zone</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full shrink-0" style={{ background: 'rgba(160, 160, 160, 0.3)' }} />
                <span className="text-sm text-foreground/70">Acceptable Zone</span>
              </div>
            </div>
          </div>

          <div className="liquid-glass-purple rounded-xl p-5">
            <h3 className="text-xs font-semibold text-foreground/50 uppercase tracking-wider mb-3">Remarks</h3>
            <p className="text-sm text-foreground/70">
              {outsideCount} candidate{outsideCount !== 1 ? 's' : ''} outside
              {outsideCount === 1 ? ' the' : ''} optimal range
            </p>
          </div>
        </aside>
      </div>
    </div>
  )
}

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { error: Error | null }> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { error: null }
  }
  static getDerivedStateFromError(error: Error) { return { error } }
  render() {
    if (this.state.error) {
      return <div className="p-10 text-red-500 font-mono text-sm whitespace-pre-wrap">{this.state.error.stack || this.state.error.message}</div>
    }
    return this.props.children
  }
}

export default function PerformancePlotContentWrapper() {
  return (
    <ErrorBoundary>
      <PerformancePlotContent />
    </ErrorBoundary>
  )
}
