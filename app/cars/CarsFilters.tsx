'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Menu, X } from 'lucide-react'

interface CarsFiltersProps {
  makes: string[]
  current: {
    make?: string
    q?: string
  }
}

export default function CarsFilters({ makes, current }: CarsFiltersProps) {
  const [isOpen, setIsOpen] = useState(false)
  const activeFilterCount = Object.values(current).filter(Boolean).length

  return (
    <div className="directory-filters">
      <button
        type="button"
        className="directory-filters__toggle"
        onClick={() => setIsOpen((value) => !value)}
        aria-expanded={isOpen}
        aria-controls="cars-filter-panel"
      >
        {isOpen ? <X size={18} /> : <Menu size={18} />}
        <span>Filters</span>
        {activeFilterCount > 0 && (
          <span className="directory-filters__count">{activeFilterCount}</span>
        )}
      </button>

      <form
        id="cars-filter-panel"
        method="GET"
        className={`directory-filters__panel${isOpen ? ' directory-filters__panel--open' : ''}`}
      >
        <div className="form-group">
          <label className="form-label">Search</label>
          <input className="input" name="q" defaultValue={current.q ?? ''} placeholder="Make, model..." />
        </div>
        <div className="form-group">
          <label className="form-label">Make</label>
          <select className="input" name="make" defaultValue={current.make ?? ''}>
            <option value="">All Makes</option>
            {makes.map((make) => (
              <option key={make}>{make}</option>
            ))}
          </select>
        </div>
        <button type="submit" className="btn btn--primary btn--md">Search</button>
        {activeFilterCount > 0 && (
          <Link href="/cars" className="btn btn--ghost btn--sm directory-filters__clear">
            Clear
          </Link>
        )}
      </form>
    </div>
  )
}
