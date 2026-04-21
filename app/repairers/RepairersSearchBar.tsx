'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useState } from 'react'
import { Search } from 'lucide-react'

const CATEGORIES = [
  { label: 'Engine', spec: 'Engine' },
  { label: 'Electrical', spec: 'Electrical' },
  { label: 'Transmission', spec: 'Transmission' },
  { label: 'Suspension', spec: 'Suspension' },
  { label: 'Brakes', spec: 'Brakes' },
  { label: 'AC & Cooling', spec: 'AC' },
  { label: 'Fuel System', spec: 'Fuel' },
  { label: 'Maintenance', spec: 'Maintenance' },
]

interface Props {
  current: { city?: string; available?: string; specialization?: string }
}

export default function RepairersSearchBar({ current }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const [city, setCity] = useState(current.city ?? '')
  const [available, setAvailable] = useState(current.available === '1')
  const [specialization, setSpecialization] = useState(current.specialization ?? '')

  function buildParams(overrides: Record<string, string> = {}) {
    const sp = new URLSearchParams()
    const c = overrides.city ?? city
    const a = overrides.available ?? (available ? '1' : '')
    const s = overrides.specialization ?? specialization
    if (c) sp.set('city', c)
    if (a) sp.set('available', a)
    if (s) sp.set('specialization', s)
    return sp
  }

  function search() {
    router.push(`${pathname}?${buildParams().toString()}`)
  }

  function pickCategory(spec: string) {
    const next = specialization === spec ? '' : spec
    setSpecialization(next)
    const sp = buildParams({ specialization: next })
    router.push(`${pathname}?${sp.toString()}`)
  }

  const hasFilters = current.city || current.available || current.specialization

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      {/* Search row */}
      <div className="filter-bar">
        <div className="input-wrapper" style={{ flex: 1, maxWidth: 360 }}>
          <span className="input-icon"><Search size={16} /></span>
          <input
            className="input input--with-icon"
            placeholder="Search by city..."
            value={city}
            onChange={(e) => setCity(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') search() }}
          />
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', color: 'var(--color-text-200)', fontSize: '0.9rem' }}>
          <input
            type="checkbox"
            checked={available}
            onChange={(e) => setAvailable(e.target.checked)}
            style={{ width: 16, height: 16, accentColor: 'var(--color-accent)' }}
          />
          Available now
        </label>
        <button className="btn btn--primary btn--md" onClick={search}>Search</button>
        {hasFilters && (
          <button className="btn btn--ghost btn--sm" onClick={() => router.push(pathname)}>Clear</button>
        )}
      </div>

      {/* Category chips */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
        {CATEGORIES.map((cat) => {
          const active = specialization === cat.spec
          return (
            <button
              key={cat.spec}
              type="button"
              onClick={() => pickCategory(cat.spec)}
              className={`btn btn--sm ${active ? 'btn--secondary' : 'btn--ghost'}`}
            >
              {cat.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
