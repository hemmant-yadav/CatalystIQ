import { useState } from 'react'
import { Chart as ChartJS, ArcElement, Tooltip } from 'chart.js'
import { Doughnut } from 'react-chartjs-2'
import Sidebar from '../components/Sidebar'
import DiscoveryContent from '../components/DiscoveryContent'
import SynBioContent from '../components/SynBioContent'
import PerformancePlotContent from '../components/PerformancePlotContent'
import FeedbackLoopContent from '../components/FeedbackLoopContent'
import CollaborationContent from '../components/CollaborationContent'
import SettingsContent from '../components/SettingsContent'
import Toast from '../components/Toast'
import { AppProvider } from '../context/AppContext'

ChartJS.register(ArcElement, Tooltip)

const metrics = [
  { label: 'Total Analyses Run', value: '142', trend: '+12%', up: true },
  { label: 'Novel Candidates Generated', value: '38', trend: '+8%', up: true },
  { label: 'Avg Prediction Accuracy', value: '84%', trend: '+3%', up: true },
  { label: 'Experiments Logged', value: '21', trend: '-2%', up: false },
]

const activities = [
  { reaction: 'Hydroformylation of propylene', time: '2 min ago', candidates: 12 },
  { reaction: 'Cross-coupling optimization', time: '15 min ago', candidates: 8 },
  { reaction: 'Enzymatic ester hydrolysis', time: '1 hr ago', candidates: 24 },
  { reaction: 'Photocatalytic CO₂ reduction', time: '3 hr ago', candidates: 6 },
  { reaction: 'Asymmetric hydrogenation', time: '5 hr ago', candidates: 18 },
]

const chartData = {
  labels: ['Chemical Catalysis', 'Synthetic Biology'],
  datasets: [
    {
      data: [65, 35],
      backgroundColor: ['#2563eb', '#0ea5e9'],
      borderWidth: 0,
      hoverOffset: 4,
    },
  ],
}

const chartOptions = {
  cutout: '70%',
  plugins: {
    tooltip: {
      callbacks: {
        label: (ctx: { label: string; parsed: number }) => `${ctx.label}: ${ctx.parsed}%`,
      },
    },
  },
  maintainAspectRatio: false,
}

function OverviewContent() {
  return (
    <div className="max-w-6xl">
      <h1 className="text-2xl font-headline font-semibold mb-1">Overview</h1>
      <p className="text-foreground/60 text-sm mb-8">Welcome back, Jane. Here's your discovery dashboard.</p>

      <div className="grid grid-cols-4 gap-4">
        {metrics.map((m) => (
          <div key={m.label} className="liquid-glass-purple rounded-xl p-5">
            <div className="text-foreground/50 text-xs mb-2">{m.label}</div>
            <div className="flex items-end justify-between">
              <div className="text-3xl font-headline font-semibold">{m.value}</div>
              <div className={`text-xs font-medium px-1.5 py-0.5 rounded ${
                m.up ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
              }`}>
                {m.trend}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-5 gap-6 mt-6">
        <div className="col-span-3 liquid-glass-purple rounded-xl p-5">
          <h2 className="text-sm font-semibold mb-4">Recent Analyses</h2>
          <div className="space-y-3">
            {activities.map((a, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                <div>
                  <div className="text-sm text-foreground">{a.reaction}</div>
                  <div className="text-xs text-foreground/40 mt-0.5">{a.time}</div>
                </div>
                <div className="text-xs text-foreground/50">{a.candidates} candidates</div>
              </div>
            ))}
          </div>
        </div>

        <div className="col-span-2 liquid-glass-purple rounded-xl p-5 flex flex-col items-center">
          <h2 className="text-sm font-semibold mb-4 self-start">Analysis Split</h2>
          <div className="flex-1 flex items-center justify-center w-full" style={{ minHeight: 200 }}>
            <div style={{ width: 180, height: 180 }}>
              <Doughnut data={chartData} options={chartOptions} />
            </div>
          </div>
          <div className="flex gap-6 mt-3">
            <div className="flex items-center gap-2 text-xs text-foreground/60">
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#6366f1' }} />
              Chemical Catalysis
            </div>
            <div className="flex items-center gap-2 text-xs text-foreground/60">
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#a855f7' }} />
              Synthetic Biology
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function DashboardPage() {
  const [activeTab, setActiveTab] = useState('Overview')
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)

  return (
    <AppProvider>
      <div className="flex min-h-screen bg-slate-900/60 backdrop-blur-xl relative overflow-hidden">

        <div className={`shrink-0 transition-all duration-300 ease-in-out ${isSidebarOpen ? 'w-[220px]' : 'w-0'}`}>
          <div className={`absolute top-0 left-0 h-full w-[220px] transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
            <Sidebar active={activeTab} onTabChange={setActiveTab} />
          </div>
        </div>


        <main className="flex-1 flex flex-col h-screen overflow-hidden">

          <div className="h-16 shrink-0 flex items-center px-6 border-b border-white/5">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 -ml-2 rounded-lg text-foreground/70 hover:text-foreground hover:bg-white/5 transition"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
            </button>
            {!isSidebarOpen && (
              <div className="ml-4 font-headline font-semibold bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(to left, #6366f1, #a855f7, #fcd34d)' }}>
                CatalystIQ
              </div>
            )}
          </div>


          <div className="flex-1 overflow-auto p-8">
            {activeTab === 'Overview' && <OverviewContent />}
            {activeTab === 'Discovery' && <DiscoveryContent />}
            {activeTab === 'Synthetic Biology' && <SynBioContent />}
            {activeTab === 'Performance Plot' && <PerformancePlotContent />}
            {activeTab === 'Feedback Loop' && <FeedbackLoopContent />}
            {activeTab === 'Collaboration' && <CollaborationContent />}
            {activeTab === 'Settings' && <SettingsContent />}
            {activeTab !== 'Overview' && activeTab !== 'Discovery' && activeTab !== 'Synthetic Biology' && activeTab !== 'Performance Plot' && activeTab !== 'Feedback Loop' && activeTab !== 'Collaboration' && activeTab !== 'Settings' && (
              <div className="flex items-center justify-center h-full text-foreground/30 text-sm">
                {activeTab} tab content coming soon
              </div>
            )}
          </div>
        </main>
      </div>
      <Toast />
    </AppProvider>
  )
}

export default DashboardPage
