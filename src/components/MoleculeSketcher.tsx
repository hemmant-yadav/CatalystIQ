import { useEffect, useRef, useState, useCallback } from 'react'


// eslint-disable-next-line @typescript-eslint/no-explicit-any
let SmilesDrawer: any = null

async function getSmilesDrawer() {
  if (!SmilesDrawer) {
    const mod = await import('smiles-drawer')
    SmilesDrawer = mod.default ?? mod
  }
  return SmilesDrawer
}

interface MoleculeSketcherProps {
  /** SMILES from parent (e.g. when user clicks a candidate row) */
  externalSmiles?: string
  /** called whenever the current SMILES changes */
  onChange?: (smiles: string) => void
}

export default function MoleculeSketcher({ externalSmiles, onChange }: MoleculeSketcherProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const canvasId = `smiles-canvas-${Math.random().toString(36).slice(2, 9)}`
  const [smiles, setSmiles] = useState(externalSmiles ?? '')
  const [error, setError] = useState<string | null>(null)
  const [drawing, setDrawing] = useState(false)


  useEffect(() => {
    if (externalSmiles !== undefined && externalSmiles !== smiles) {
      setSmiles(externalSmiles)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [externalSmiles])

  const draw = useCallback(async (smilesStr: string) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return


    ctx.clearRect(0, 0, canvas.width, canvas.height)

    if (!smilesStr.trim()) {
      setError(null)
      return
    }

    try {
      setDrawing(true)
      setError(null)
      const SD = await getSmilesDrawer()

      const drawer = new SD.SmiDrawer({
        width: canvas.width,
        height: canvas.height,
        bondThickness: 1.2,
        bondLength: 26,
        atomVisualization: 'default',
        explicitHydrogens: false,
        terminalCarbons: true,
        themes: {
          dark: {
            C: '#e2e8f0',
            O: '#f87171',
            N: '#60a5fa',
            F: '#34d399',
            CL: '#34d399',
            BR: '#c084fc',
            I: '#818cf8',
            P: '#fb923c',
            S: '#facc15',
            B: '#f97316',
            SI: '#94a3b8',
            H: '#94a3b8',
            BACKGROUND: 'transparent',
          },
        },
      })

      await new Promise<void>((resolve, reject) => {
        try {

          drawer.draw(smilesStr, `#${canvasId}`, 'dark')
          resolve()
        } catch (e) {
          reject(e)
        }
      })
    } catch {
      setError('Invalid SMILES string')

      const ctx2 = canvas.getContext('2d')
      if (ctx2) ctx2.clearRect(0, 0, canvas.width, canvas.height)
    } finally {
      setDrawing(false)
    }
  }, [canvasId])


  useEffect(() => {
    const id = setTimeout(() => draw(smiles), 300)
    return () => clearTimeout(id)
  }, [smiles, draw])

  const handleChange = (val: string) => {
    setSmiles(val)
    onChange?.(val)
  }

  const clear = () => {
    setSmiles('')
    setError(null)
    onChange?.('')
    const canvas = canvasRef.current
    if (canvas) {
      const ctx = canvas.getContext('2d')
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height)
    }
  }

  const copySmiles = () => {
    if (smiles.trim()) navigator.clipboard.writeText(smiles)
  }

  return (
    <div className="space-y-2">

      <div className="flex items-center gap-1.5">
        <input
          type="text"
          value={smiles}
          onChange={e => handleChange(e.target.value)}
          placeholder="Paste or type a SMILES string…"
          className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs font-mono text-foreground placeholder:text-foreground/25 outline-none focus:border-indigo-500/50 transition"
          spellCheck={false}
        />
        <button
          onClick={copySmiles}
          disabled={!smiles.trim()}
          title="Copy SMILES"
          className="p-1.5 rounded text-foreground/40 hover:text-foreground hover:bg-white/5 transition disabled:opacity-30 disabled:cursor-not-allowed"
        >

          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
          </svg>
        </button>
        <button
          onClick={clear}
          title="Clear"
          className="p-1.5 rounded text-foreground/40 hover:text-red-400 hover:bg-white/5 transition"
        >

          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
          </svg>
        </button>
      </div>


      <div
        className="relative border border-white/10 rounded-lg overflow-hidden"
        style={{ background: 'rgba(255,255,255,0.02)', backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.03) 1px, transparent 1px)', backgroundSize: '16px 16px' }}
      >
        <canvas
          id={canvasId}
          ref={canvasRef}
          width={260}
          height={200}
          className="w-full"
          style={{ display: 'block' }}
        />

        {!smiles.trim() && !drawing && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 pointer-events-none">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-foreground/15">
              <circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
            </svg>
            <span className="text-xs text-foreground/20">Type a SMILES to preview</span>
          </div>
        )}

        {drawing && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <svg className="animate-spin h-5 w-5 text-indigo-400/50" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
          </div>
        )}

        {error && (
          <div className="absolute bottom-2 left-0 right-0 flex justify-center pointer-events-none">
            <span className="text-[10px] text-red-400/80 bg-black/40 rounded px-2 py-0.5">{error}</span>
          </div>
        )}
      </div>


      <div className="flex flex-wrap gap-1">
        {[
          { label: 'Caffeine', smiles: 'CN1C=NC2=C1C(=O)N(C(=O)N2C)C' },
          { label: 'Aspirin', smiles: 'CC(=O)Oc1ccccc1C(=O)O' },
          { label: 'Benzene', smiles: 'c1ccccc1' },
        ].map(ex => (
          <button
            key={ex.label}
            onClick={() => handleChange(ex.smiles)}
            className="text-[10px] px-2 py-0.5 rounded border border-white/10 text-foreground/40 hover:text-foreground/70 hover:border-white/20 transition"
          >
            {ex.label}
          </button>
        ))}
      </div>
    </div>
  )
}
