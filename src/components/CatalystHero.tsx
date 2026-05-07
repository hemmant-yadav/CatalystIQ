import { useNavigate } from 'react-router-dom'

const labs = ['Materials Project', 'Open Catalyst', 'BRENDA', 'UniProt', 'MetaCyc', 'GPS Renewables']

function CatalystHero() {
  const navigate = useNavigate()

  return (
    <section className="min-h-screen flex flex-col overflow-visible relative">


      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[984px] h-[527px] opacity-90 bg-gray-950 blur-[82px] pointer-events-none" />

      <div className="relative z-10 flex-1 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-[80px] font-normal leading-tight tracking-tight font-headline">
            Catalyst{' '}
            <span className="bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(to left, #6366f1, #a855f7, #fcd34d)' }}>
              IQ
            </span>
          </h1>
          <p className="text-hero-sub text-lg opacity-80 max-w-lg mt-4 mx-auto">
            AI-powered discovery for sustainable fuel and chemical production
          </p>
          <button 
            onClick={() => navigate('/dashboard')}
            className="heroSecondary px-8 py-4 mt-8 text-base"
          >
            Start Discovery
          </button>
        </div>
      </div>

      <div className="pb-10 relative z-10">
        <div className="max-w-5xl mx-auto flex items-center gap-12 px-8">
          <div className="text-foreground/50 text-sm shrink-0 leading-tight">
            Trusted by research labs across the globe
          </div>
          <div className="overflow-hidden flex-1">
            <div className="flex gap-16 animate-marquee" style={{ width: 'max-content' }}>
              {[...labs, ...labs].map((lab, i) => (
                <div key={i} className="flex items-center gap-3 shrink-0">
                  <div className="liquid-glass w-7 h-7 rounded-lg flex items-center justify-center text-xs font-semibold text-foreground">
                    {lab[0]}
                  </div>
                  <span className="text-base font-semibold text-foreground">{lab}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default CatalystHero
