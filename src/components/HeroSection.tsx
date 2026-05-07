import { useRef, useEffect } from 'react'
import Navbar from './Navbar'

const brands = ['Vortex', 'Nimbus', 'Prysma', 'Cirrus', 'Kynder', 'Halcyn']

function HeroSection() {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    let animationId: number
    let timeoutId: ReturnType<typeof setTimeout>
    let mounted = true

    const fadeIn = () => {
      const startTime = performance.now()
      const duration = 500

      const animate = (currentTime: number) => {
        if (!mounted) return
        const elapsed = currentTime - startTime
        const progress = Math.min(elapsed / duration, 1)
        video.style.opacity = String(progress)
        if (progress < 1) {
          animationId = requestAnimationFrame(animate)
        }
      }

      animationId = requestAnimationFrame(animate)
    }

    const handleEnded = () => {
      const startTime = performance.now()
      const duration = 500

      const fadeOut = (currentTime: number) => {
        if (!mounted) return
        const elapsed = currentTime - startTime
        const progress = Math.min(elapsed / duration, 1)
        video.style.opacity = String(1 - progress)
        if (progress < 1) {
          animationId = requestAnimationFrame(fadeOut)
        } else {
          video.style.opacity = '0'
          timeoutId = setTimeout(() => {
            if (!mounted) return
            video.currentTime = 0
            video.play()
            fadeIn()
          }, 100)
        }
      }

      animationId = requestAnimationFrame(fadeOut)
    }

    video.addEventListener('ended', handleEnded)
    video.style.opacity = '0'
    fadeIn()

    return () => {
      mounted = false
      cancelAnimationFrame(animationId)
      clearTimeout(timeoutId)
      video.removeEventListener('ended', handleEnded)
    }
  }, [])

  return (
    <section className="min-h-screen flex flex-col overflow-visible relative" style={{ background: 'hsl(260, 87%, 3%)' }}>
      <div className="absolute inset-0 w-full h-full overflow-hidden">
        <video
          ref={videoRef}
          src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260328_065045_c44942da-53c6-4804-b734-f9e07fc22e08.mp4"
          className="absolute inset-0 w-full h-full object-cover"
          style={{ opacity: 0 }}
          muted
          playsInline
          autoPlay
        />
      </div>

      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[984px] h-[527px] opacity-90 bg-gray-950 blur-[82px] pointer-events-none" />

      <div className="relative z-10 flex-1 flex flex-col">
        <div className="relative z-10">
          <Navbar />
        </div>

        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-[220px] font-normal leading-[1.02] tracking-[-0.024em] font-headline">
              Power{' '}
              <span className="bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(to left, #6366f1, #a855f7, #fcd34d)' }}>
                AI
              </span>
            </h1>
            <p className="text-hero-sub text-lg leading-8 max-w-md mt-[9px] opacity-80 mx-auto">
              The most powerful AI ever deployed / in talent acquisition
            </p>
            <button className="heroSecondary px-[29px] py-[24px] mt-[25px]">
              Schedule a Consult
            </button>
          </div>
        </div>
      </div>

      <div className="pb-10 relative z-10">
        <div className="max-w-5xl mx-auto flex items-center gap-12 px-8">
          <div className="text-foreground/50 text-sm shrink-0 leading-tight">
            Relied on by brands / across the globe
          </div>
          <div className="overflow-hidden flex-1">
            <div className="flex gap-16 animate-marquee" style={{ width: 'max-content' }}>
              {[...brands, ...brands].map((brand, i) => (
                <div key={i} className="flex items-center gap-3 shrink-0">
                  <div className="liquid-glass w-6 h-6 rounded-lg flex items-center justify-center text-xs font-semibold text-foreground">
                    {brand[0]}
                  </div>
                  <span className="text-base font-semibold text-foreground">{brand}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default HeroSection
