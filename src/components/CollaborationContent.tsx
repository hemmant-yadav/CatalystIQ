import { useState } from 'react'

interface TeamMember {
  name: string
  initials: string
  color: string
  online: boolean
}

interface Annotation {
  id: number
  user: string
  initials: string
  color: string
  timestamp: string
  reaction: string
  note: string
}

interface TimelineEntry {
  id: number
  date: string
  user: string
  initials: string
  color: string
  action: string
  detail: string
  results?: string
}

const team: TeamMember[] = [
  { name: 'Jane Chen', initials: 'JC', color: '#6366f1', online: true },
  { name: 'Marcus Webb', initials: 'MW', color: '#10b981', online: true },
  { name: 'Sofia Reyes', initials: 'SR', color: '#f59e0b', online: true },
  { name: 'Alex Kim', initials: 'AK', color: '#ec4899', online: false },
  { name: 'Priya Patel', initials: 'PP', color: '#8b5cf6', online: true },
]

const initialAnnotations: Annotation[] = [
  { id: 1, user: 'Jane Chen', initials: 'JC', color: '#6366f1', timestamp: '10 min ago', reaction: 'Fe-PNP pincer catalyst', note: 'Predicted stability looks promising. Recommend running at 120°C to validate.' },
  { id: 2, user: 'Marcus Webb', initials: 'MW', color: '#10b981', timestamp: '32 min ago', reaction: 'Mn-carbonyl dimer', note: 'Selectivity of 94% is exceptional. Could be a candidate for CO₂ reduction scale-up.' },
  { id: 3, user: 'Sofia Reyes', initials: 'SR', color: '#f59e0b', timestamp: '1 hr ago', reaction: 'Cobalt-phosphine complex', note: 'TOF data aligns with literature values. No red flags on stability.' },
  { id: 4, user: 'Priya Patel', initials: 'PP', color: '#8b5cf6', timestamp: '2 hr ago', reaction: 'Ni-terpyridine', note: 'Earth-abundant metal优势 — need to verify leaching under acidic conditions.' },
]

const initialTimeline: TimelineEntry[] = [
  { id: 1, date: 'May 7, 2026', user: 'Jane Chen', initials: 'JC', color: '#6366f1', action: 'Ran Analysis', detail: 'Hydroformylation of propylene', results: '12 candidates generated' },
  { id: 2, date: 'May 6, 2026', user: 'Marcus Webb', initials: 'MW', color: '#10b981', action: 'Logged Results', detail: 'Fe-PNP pincer catalyst', results: 'Activity 87% · Selectivity 91% · Stability 89%' },
  { id: 3, date: 'May 6, 2026', user: 'Sofia Reyes', initials: 'SR', color: '#f59e0b', action: 'Logged Results', detail: 'Mn-carbonyl dimer', results: 'Activity 78% · Selectivity 94% · Stability 71%' },
  { id: 4, date: 'May 5, 2026', user: 'Alex Kim', initials: 'AK', color: '#ec4899', action: 'Ran Analysis', detail: 'Cross-coupling optimization', results: '8 candidates generated' },
  { id: 5, date: 'May 4, 2026', user: 'Priya Patel', initials: 'PP', color: '#8b5cf6', action: 'Logged Results', detail: 'Ru-bipyridyl', results: 'Activity 85% · Selectivity 79% · Stability 92%' },
  { id: 6, date: 'May 3, 2026', user: 'Jane Chen', initials: 'JC', color: '#6366f1', action: 'Logged Results', detail: 'Cobalt-phosphine complex', results: 'Activity 92% · Selectivity 88% · Stability 95%' },
]

function Avatar({ initials, color, online }: { initials: string; color: string; online?: boolean }) {
  return (
    <div className="relative shrink-0">
      <div
        className="w-9 h-9 rounded-full flex items-center justify-center text-[11px] font-semibold text-white"
        style={{ background: color }}
      >
        {initials}
      </div>
      {online !== undefined && (
        <div
          className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#0d0a24] ${
            online ? 'bg-green-500' : 'bg-gray-500'
          }`}
        />
      )}
    </div>
  )
}

function CollaborationContent() {
  const [annotations, setAnnotations] = useState(initialAnnotations)
  const [comment, setComment] = useState('')

  const postComment = () => {
    const text = comment.trim()
    if (!text) return
    setAnnotations(prev => [
      {
        id: Date.now(),
        user: 'You',
        initials: 'YO',
        color: '#a855f7',
        timestamp: 'just now',
        reaction: 'General',
        note: text,
      },
      ...prev,
    ])
    setComment('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      postComment()
    }
  }

  return (
    <div className="flex flex-col h-full gap-6">
      <h1 className="text-2xl font-headline font-semibold">Collaboration</h1>

      <div className="liquid-glass-purple rounded-xl p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xs text-foreground/50 font-medium uppercase tracking-wider">Active Team</span>
            <div className="flex items-center -space-x-2">
              {team.map(m => (
                <div key={m.name} className="relative" title={m.name}>
                  <Avatar initials={m.initials} color={m.color} online={m.online} />
                </div>
              ))}
            </div>
          </div>
          <span className="text-xs text-foreground/40">{team.filter(m => m.online).length} online</span>
        </div>
      </div>

      <div className="flex gap-6 flex-1 min-h-0">
        <div className="flex-1 flex flex-col liquid-glass-purple rounded-xl min-h-0">
          <div className="p-5 pb-0 shrink-0">
            <h2 className="text-sm font-headline font-semibold">Annotation Feed</h2>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-3 space-y-4">
            {annotations.map(a => (
              <div key={a.id} className="flex gap-3">
                <Avatar initials={a.initials} color={a.color} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-medium text-foreground">{a.user}</span>
                    <span className="text-[10px] text-foreground/40">{a.timestamp}</span>
                  </div>
                  <div className="text-[11px] text-indigo-400/70 mb-1">on: {a.reaction}</div>
                  <p className="text-sm text-foreground/70 leading-relaxed">{a.note}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="shrink-0 border-t border-white/5 px-5 py-3">
            <div className="flex gap-3">
              <Avatar initials="YO" color="#a855f7" />
              <div className="flex-1 flex gap-2">
                <input
                  type="text"
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Add a comment…"
                  className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-foreground/30 outline-none focus:border-indigo-500/50 transition"
                />
                <button
                  onClick={postComment}
                  disabled={!comment.trim()}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Post
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="w-80 shrink-0 liquid-glass-purple rounded-xl p-5 overflow-y-auto">
          <h2 className="text-sm font-headline font-semibold mb-5">Experiment Timeline</h2>
          <div className="relative">
            <div className="absolute left-[11px] top-2 bottom-2 w-px bg-white/10" />
            <div className="space-y-5">
              {initialTimeline.map((entry, i) => {
                const showDate = i === 0 || entry.date !== initialTimeline[i - 1].date
                return (
                  <div key={entry.id}>
                    {showDate && (
                      <div className="text-[10px] text-foreground/40 font-medium mb-3 ml-7">{entry.date}</div>
                    )}
                    <div className="flex gap-3">
                      <div className="relative shrink-0">
                        <div
                          className="w-[23px] h-[23px] rounded-full flex items-center justify-center text-[9px] font-semibold text-white ring-2 ring-[#0d0a24]"
                          style={{ background: entry.color, fontSize: 9 }}
                        >
                          {entry.initials}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0 pb-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-medium text-foreground">{entry.user}</span>
                          <span className="text-[10px] text-foreground/40">{entry.action}</span>
                        </div>
                        <div className="text-xs text-foreground/70 mt-0.5">{entry.detail}</div>
                        {entry.results && (
                          <div className="text-[11px] text-foreground/50 mt-0.5">{entry.results}</div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CollaborationContent
