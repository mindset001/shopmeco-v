'use client'

import { useEffect, useRef, useState } from 'react'

/* ─── Typing Effect ──────────────────────────────────────── */
const WORDS = ['best hands.', 'right workshop.', 'real mechanics.', 'trusted sellers.']

export function HeroTyping() {
  const [wordIndex, setWordIndex] = useState(0)
  const [displayed, setDisplayed] = useState('')
  const [deleting, setDeleting] = useState(false)
  const timeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const word = WORDS[wordIndex]

    if (!deleting && displayed.length < word.length) {
      timeout.current = setTimeout(() => setDisplayed(word.slice(0, displayed.length + 1)), 60)
    } else if (!deleting && displayed.length === word.length) {
      timeout.current = setTimeout(() => setDeleting(true), 2000)
    } else if (deleting && displayed.length > 0) {
      timeout.current = setTimeout(() => setDisplayed(displayed.slice(0, -1)), 35)
    } else if (deleting && displayed.length === 0) {
      setDeleting(false)
      setWordIndex((i) => (i + 1) % WORDS.length)
    }

    return () => { if (timeout.current) clearTimeout(timeout.current) }
  }, [displayed, deleting, wordIndex])

  return (
    <span className="hero__typing">
      {displayed}
      <span className="hero__cursor" aria-hidden="true">|</span>
    </span>
  )
}

/* ─── Counter Animation ──────────────────────────────────── */
function useCountUp(target: number, duration = 1800, start = false) {
  const [value, setValue] = useState(0)

  useEffect(() => {
    if (!start) return
    const startTime = performance.now()
    function tick(now: number) {
      const progress = Math.min((now - startTime) / duration, 1)
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(Math.floor(eased * target))
      if (progress < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [start, target, duration])

  return value
}

export function ProofStats() {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect() } },
      { threshold: 0.4 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const repairers = useCountUp(2400, 1600, visible)
  const listings  = useCountUp(14000, 1800, visible)

  return (
    <div className="proof-banner__stats" ref={ref}>
      <div>
        <div className="proof-banner__stat-value">{repairers.toLocaleString()}+</div>
        <div className="proof-banner__stat-label">Repairers on ShopMeco</div>
      </div>
      <div>
        <div className="proof-banner__stat-value">{(listings / 1000).toFixed(0)}k+</div>
        <div className="proof-banner__stat-label">Parts listings</div>
      </div>
      <div>
        <div className="proof-banner__stat-value">4.8★</div>
        <div className="proof-banner__stat-label">Average repairer rating</div>
      </div>
    </div>
  )
}

/* ─── Scroll-triggered reveal ────────────────────────────── */
export function RevealOnScroll({ children, delay = 0, className = '' }: {
  children: React.ReactNode
  delay?: number
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect() } },
      { threshold: 0.12 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(28px)',
        transition: `opacity 0.55s ease ${delay}ms, transform 0.55s cubic-bezier(0.16,1,0.3,1) ${delay}ms`,
      }}
    >
      {children}
    </div>
  )
}
