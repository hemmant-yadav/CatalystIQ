import { useRef, useEffect } from 'react'

function VideoBackground() {
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
    <div className="fixed inset-0 w-full h-full overflow-hidden -z-50 pointer-events-none" style={{ background: 'hsl(222, 47%, 11%)' }}>
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
  )
}

export default VideoBackground
