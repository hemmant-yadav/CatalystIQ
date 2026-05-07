

export interface AnalysisRequest {
  reaction: string
  direction: 'catalysis' | 'biology'
  temperature?: number
  pressure?: number
  organism?: string
  goal?: string
}

export interface AnalysisResponse {
  candidates: Record<string, unknown>[]
}

export interface FeedbackRequest {
  candidate_name: string
  predicted: { activity: number; selectivity: number; stability: number }
  actual: { activity: number; selectivity: number; stability: number }
  notes?: string
}

export interface FeedbackResponse {
  comparison: Record<string, { predicted: number; actual: number; delta: number }>
  insights: string[]
}

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function rand(min: number, max: number) {
  return Math.round(min + Math.random() * (max - min))
}

const catalysisCandidates = [
  { name: 'Cobalt-phosphine complex', activity: 92, selectivity: 88, stability: 95, type: 'Known', reason: 'High TOF for hydrogenation', cost: 70, scalability: 75 },
  { name: 'Fe-PNP pincer catalyst', activity: 87, selectivity: 91, stability: 89, type: 'Novel', reason: 'Predicted low overpotential', cost: 85, scalability: 80 },
  { name: 'Ru-bipyridyl', activity: 85, selectivity: 79, stability: 92, type: 'Known', reason: 'Stable under aqueous conditions', cost: 45, scalability: 60 },
  { name: 'Mn-carbonyl dimer', activity: 78, selectivity: 94, stability: 71, type: 'Novel', reason: 'High selectivity for CO₂ reduction', cost: 88, scalability: 72 },
  { name: 'Ni-terpyridine', activity: 81, selectivity: 73, stability: 86, type: 'Novel', reason: 'Earth-abundant metal', cost: 92, scalability: 85 },
  { name: 'Pd-NHC complex', activity: 76, selectivity: 82, stability: 90, type: 'Known', reason: 'Benchmark cross-coupling', cost: 35, scalability: 55 },
  { name: 'Cu-phenanthroline', activity: 69, selectivity: 77, stability: 83, type: 'Novel', reason: 'Low-cost alternative', cost: 90, scalability: 88 },
  { name: 'Ir-COD dimer', activity: 73, selectivity: 85, stability: 78, type: 'Known', reason: 'High enantioselectivity', cost: 25, scalability: 40 },
]

const biologyCandidates = [
  { name: 'AADH-ADH fusion pathway', yield_score: 88, thermostability: 82, flux_efficiency: 79, type: 'Known', reason: 'High ethanol tolerance', selectivity: 85, viability: 78 },
  { name: 'FAS mutant R1834K', yield_score: 76, thermostability: 91, flux_efficiency: 73, type: 'Novel', reason: 'Enhanced chain elongation', selectivity: 72, viability: 84 },
  { name: 'TEV protease variant', yield_score: 69, thermostability: 74, flux_efficiency: 91, type: 'Novel', reason: 'Optimized metabolic flux', selectivity: 80, viability: 71 },
  { name: 'Xylose isomerase', yield_score: 83, thermostability: 68, flux_efficiency: 76, type: 'Known', reason: 'Broad substrate range', selectivity: 63, viability: 86 },
  { name: 'P450-BM3 chimera', yield_score: 71, thermostability: 85, flux_efficiency: 68, type: 'Novel', reason: 'High oxygenation activity', selectivity: 78, viability: 73 },
  { name: 'Acetyl-CoA carboxylase', yield_score: 79, thermostability: 72, flux_efficiency: 82, type: 'Known', reason: 'Rate-limiting step bypass', selectivity: 69, viability: 80 },
  { name: 'Rubisco activase', yield_score: 64, thermostability: 78, flux_efficiency: 85, type: 'Novel', reason: 'Improved CO₂ fixation', selectivity: 74, viability: 69 },
  { name: 'Fumarate reductase', yield_score: 74, thermostability: 69, flux_efficiency: 71, type: 'Known', reason: 'Anaerobic stability', selectivity: 66, viability: 75 },
]

export async function analyze(req: AnalysisRequest): Promise<AnalysisResponse> {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY

  if (apiKey) {
    try {
      const systemPrompt = req.direction === 'catalysis' 
        ? `You are an expert computational chemist and AI catalyst designer.
Return a JSON object containing a "candidates" array with exactly 8 candidates.
Each candidate object MUST have these properties:
- name: string (realistic chemical name or complex)
- smiles: string (a valid SMILES string representing the molecule)
- activity: number (0-100)
- selectivity: number (0-100)
- stability: number (0-100)
- type: string (must be exactly "Known" or "Novel")
- reason: string (short, scientific explanation for its performance)
- cost: number (0-100)
- scalability: number (0-100)`
        : `You are an expert computational biologist and synthetic biology engineer.
Return a JSON object containing a "candidates" array with exactly 8 candidates.
Each candidate object MUST have these properties:
- name: string (realistic pathway or enzyme name)
- smiles: string (a valid SMILES string representing the main product or key intermediate)
- yield_score: number (0-100)
- thermostability: number (0-100)
- flux_efficiency: number (0-100)
- selectivity: number (0-100)
- viability: number (0-100)
- type: string (must be exactly "Known" or "Novel")
- reason: string (short, scientific explanation for its performance)`;

      const userPrompt = req.direction === 'catalysis' 
        ? `Generate candidates for the following thermochemical reaction: ${req.reaction}. Conditions: ${req.temperature}°C, ${req.pressure} bar.`
        : `Generate biocatalyst candidates (enzymes/pathways) for the target organism: ${req.organism || 'E. coli'}. Goal: ${req.goal || 'optimize yield'}.`

      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          response_format: { type: 'json_object' },
          temperature: 0.3,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        const parsed = JSON.parse(data.choices[0].message.content)
        if (parsed.candidates && Array.isArray(parsed.candidates)) {
          return { candidates: parsed.candidates }
        }
      } else {
        console.warn('Groq API returned an error:', await res.text())
      }
    } catch (err) {
      console.warn('Failed to call Groq, falling back to mock data:', err)
    }
  } else {
    console.warn('VITE_GROQ_API_KEY not found. Using mock data.')
  }


  await delay(1200 + Math.random() * 1000)
  const base = req.direction === 'catalysis' ? catalysisCandidates : biologyCandidates
  const candidates = base.map(c => ({
    ...c,
    activity: Math.min(100, (c as Record<string, unknown>).activity as number + rand(-4, 4)),
    selectivity: Math.min(100, (c as Record<string, unknown>).selectivity as number + rand(-4, 4)),
  }))
  return { candidates }
}

export async function submitFeedback(req: FeedbackRequest): Promise<FeedbackResponse> {
  const metrics = ['activity', 'selectivity', 'stability'] as const
  const comparison: FeedbackResponse['comparison'] = {}
  for (const m of metrics) {
    const predicted = req.predicted[m]
    const actual = req.actual[m]
    comparison[m] = { predicted, actual, delta: actual - predicted }
  }

  const apiKey = import.meta.env.VITE_GROQ_API_KEY
  if (apiKey) {
    try {
      const systemPrompt = `You are a molecular intelligence system.
Analyze the lab results versus the AI predictions for the catalyst "${req.candidate_name}".
Data:
Predicted: ${JSON.stringify(req.predicted)}
Actual: ${JSON.stringify(req.actual)}
Deltas: ${JSON.stringify(comparison)}
User Notes: ${req.notes || 'None'}

Return a JSON object with an "insights" array of strings (2-3 short sentences total).`

      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'llama3-8b-8192',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: 'Provide the analysis insights.' }
          ],
          response_format: { type: 'json_object' },
          temperature: 0.2,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        const parsed = JSON.parse(data.choices[0].message.content)
        if (parsed.insights && Array.isArray(parsed.insights)) {
          return { comparison, insights: parsed.insights }
        }
      }
    } catch (err) {
      console.warn('Failed to call Groq for feedback insights:', err)
    }
  }


  await delay(700 + Math.random() * 600)
  const insights: string[] = []
  for (const [metric, v] of Object.entries(comparison)) {
    const pct = Math.round((v.delta / v.predicted) * 100)
    if (Math.abs(pct) >= 5) {
      const dir = pct > 0 ? 'exceeded prediction' : 'underperformed prediction'
      insights.push(`${req.candidate_name} ${dir} in ${metric} by ${Math.abs(pct)}%.`)
    }
  }
  if (insights.length === 0) {
    insights.push(`${req.candidate_name} closely matched all predictions — high model confidence.`)
  }

  return { comparison, insights }
}
