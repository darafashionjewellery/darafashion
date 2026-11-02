import { useEffect, useRef } from 'react'
import { Link } from 'react-router'
import { useDocumentTitle } from '../hooks/misc'

const SPARKLE_COLOURS = ['#fff4f0', '#ffccbc', '#ee8a5e', '#e2603a']
const PUSH_RADIUS = 140

/** Field of jewel-dust sparkles that twinkle and drift away from the pointer. */
function SparkleField() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const pointer = { x: -9999, y: -9999 }
    let width = 0
    let height = 0
    let frame = 0
    let sparkles: { x: number; y: number; ox: number; oy: number; size: number; colour: string; phase: number }[] = []

    const draw = (time: number) => {
      ctx.clearRect(0, 0, width, height)
      for (const s of sparkles) {
        const dx = s.x - pointer.x
        const dy = s.y - pointer.y
        const distance = Math.hypot(dx, dy) || 1
        if (distance < PUSH_RADIUS) {
          const push = (1 - distance / PUSH_RADIUS) * 2.5
          s.x += (dx / distance) * push
          s.y += (dy / distance) * push
        }
        // Ease back to the resting position
        s.x += (s.ox - s.x) * 0.03
        s.y += (s.oy - s.y) * 0.03

        ctx.globalAlpha = reduceMotion ? 0.7 : 0.35 + 0.55 * Math.abs(Math.sin(time / 1400 + s.phase))
        ctx.fillStyle = s.colour
        ctx.beginPath()
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.globalAlpha = 1
    }

    const resize = () => {
      const dpr = window.devicePixelRatio || 1
      width = canvas.clientWidth
      height = canvas.clientHeight
      canvas.width = width * dpr
      canvas.height = height * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      const count = Math.min(320, Math.round((width * height) / 3500))
      sparkles = Array.from({ length: count }, () => {
        const x = Math.random() * width
        const y = Math.random() * height
        return {
          x,
          y,
          ox: x,
          oy: y,
          size: 0.4 + Math.random() * 1.3,
          colour: SPARKLE_COLOURS[Math.floor(Math.random() * SPARKLE_COLOURS.length)],
          phase: Math.random() * Math.PI * 2,
        }
      })
      if (reduceMotion) draw(0)
    }

    const loop = (time: number) => {
      draw(time)
      frame = requestAnimationFrame(loop)
    }
    const onMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect()
      pointer.x = e.clientX - rect.left
      pointer.y = e.clientY - rect.top
    }

    resize()
    window.addEventListener('resize', resize)
    if (!reduceMotion) {
      window.addEventListener('pointermove', onMove)
      frame = requestAnimationFrame(loop)
    }
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('resize', resize)
      window.removeEventListener('pointermove', onMove)
    }
  }, [])

  return <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" aria-hidden />
}

export default function NotFoundPage() {
  useDocumentTitle('Page not found')
  return (
    <section className="relative flex min-h-[70vh] items-center justify-center overflow-hidden bg-[#0d0a0c] px-4 py-20 text-center">
      <SparkleField />
      <div className="absolute top-1/2 left-1/2 size-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#e2603a]/10 blur-3xl" aria-hidden />
      <div className="relative">
        <h1 className="font-serif text-8xl leading-none font-medium text-[#fff4f0] sm:text-9xl">404</h1>
        <p className="mt-4 text-sm tracking-[0.3em] text-[#ee8a5e] uppercase">Page not found</p>
        <p className="mx-auto mt-4 max-w-sm text-sm text-[#fff4f0]/70">This piece seems to have slipped away. The page may have moved, or the link may be incorrect.</p>
        <Link
          to="/"
          className="mt-8 inline-block border border-[#ee8a5e]/60 px-8 py-3 text-sm font-medium tracking-[0.15em] text-[#fff4f0] uppercase transition-colors hover:bg-[#ee8a5e] hover:text-[#0d0a0c]"
        >
          Back to DARA
        </Link>
        <Link to="/shop" className="mt-5 block text-xs tracking-wider text-[#fff4f0]/60 uppercase transition-colors hover:text-[#ee8a5e]">
          Or continue shopping
        </Link>
      </div>
    </section>
  )
}
