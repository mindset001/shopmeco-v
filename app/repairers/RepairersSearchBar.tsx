'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useState } from 'react'
import { Search } from 'lucide-react'

interface Props {
  current: { city?: string; available?: string }
}

export default function RepairersSearchBar({ current }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const [city, setCity] = useState(current.city ?? '')
  const [available, setAvailable] = useState(current.available === '1')

  function search() {
    const sp = new URLSearchParams()
    if (city) sp.set('city', city)
    if (available) sp.set('available', '1')
    router.push(`${pathname}?${sp.toString()}`)
  }

  return (
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
      {(current.city || current.available) && (
        <button className="btn btn--ghost btn--sm" onClick={() => router.push(pathname)}>Clear</button>
      )}
    </div>
  )
}
