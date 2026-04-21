'use client'

import { useState, useMemo } from 'react'
import { ChevronDown, ChevronRight, Search, X } from 'lucide-react'

const CATALOG: { category: string; items: string[] }[] = [
  {
    category: 'Engine & Performance',
    items: ['Engine Diagnosis', 'Engine Repair', 'Engine Overhaul', 'Overheating Fix', 'Oil Leak Repair', 'Timing Belt Replacement', 'Head Gasket Repair'],
  },
  {
    category: 'Electrical & Diagnostics',
    items: ['ECU Diagnostics', 'ECU Programming', 'Check Engine Light Fix', 'Battery Replacement', 'Alternator Repair', 'Starter Repair', 'Wiring Repair'],
  },
  {
    category: 'Transmission',
    items: ['Transmission Repair', 'Gearbox Service', 'Gear Shifting Issues', 'Clutch Repair', 'Automatic Transmission Service'],
  },
  {
    category: 'Brakes',
    items: ['Brake Pad Replacement', 'Brake Disc Replacement', 'Brake Repair', 'ABS Repair'],
  },
  {
    category: 'Suspension & Steering',
    items: ['Wheel Alignment', 'Wheel Balancing', 'Shock Absorber Replacement', 'Suspension Repair', 'Steering Rack Repair'],
  },
  {
    category: 'AC & Cooling',
    items: ['AC Repair', 'AC Gas Refill', 'Compressor Repair', 'Radiator Repair', 'Cooling Fan Repair'],
  },
  {
    category: 'Fuel System',
    items: ['Fuel Pump Repair', 'Injector Cleaning', 'Injector Replacement', 'Fuel Tank Cleaning', 'Fuel Line Repair'],
  },
  {
    category: 'Exhaust System',
    items: ['Exhaust Repair', 'Silencer Replacement', 'Smoke Diagnosis'],
  },
  {
    category: 'General Maintenance',
    items: ['Oil Change', 'Full Service / Tune-up', 'Spark Plug Replacement', 'Filter Replacement', 'Vehicle Inspection'],
  },
  {
    category: 'Tyres & Wheels',
    items: ['Tyre Replacement', 'Tyre Repair (Puncture)', 'Rim Repair'],
  },
  {
    category: 'Body Work',
    items: ['Panel Beating', 'Painting', 'Dent Removal', 'Bumper Repair'],
  },
  {
    category: 'Accessories & Installations',
    items: ['Tracker Installation', 'Car Alarm Installation', 'Stereo Installation', 'Lighting Upgrade'],
  },
  {
    category: 'Emergency Services',
    items: ['Breakdown Assistance', 'Car Not Starting', 'On-site Repair', 'Towing'],
  },
]

const MAX_ITEMS = 10

interface Props {
  selected: string[]
  onChange: (items: string[]) => void
}

export default function ServicesCatalog({ selected, onChange }: Props) {
  const [query, setQuery] = useState('')
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})

  function toggle(item: string) {
    if (selected.includes(item)) {
      onChange(selected.filter((x) => x !== item))
    } else if (selected.length < MAX_ITEMS) {
      onChange([...selected, item])
    }
  }

  function toggleCategory(cat: string) {
    setExpanded((prev) => ({ ...prev, [cat]: !prev[cat] }))
  }

  const filtered = useMemo(() => {
    if (!query.trim()) return CATALOG
    const q = query.toLowerCase()
    return CATALOG.map((c) => ({
      ...c,
      items: c.items.filter((i) => i.toLowerCase().includes(q)),
    })).filter((c) => c.items.length > 0 || c.category.toLowerCase().includes(q))
  }, [query])

  // Auto-expand categories when searching
  const displayCatalog = query.trim()
    ? filtered.map((c) => ({ ...c, open: true }))
    : filtered.map((c) => ({ ...c, open: !!expanded[c.category] }))

  const atMax = selected.length >= MAX_ITEMS

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-3)' }}>
        <label className="form-label" style={{ margin: 0 }}>Services Offered</label>
        <span style={{ fontSize: '0.8rem', color: atMax ? 'var(--color-error)' : 'var(--color-text-300)' }}>
          {selected.length}/{MAX_ITEMS} selected
        </span>
      </div>

      {/* Selected chips */}
      {selected.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
          {selected.map((s) => (
            <span
              key={s}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                padding: '0.25rem 0.65rem',
                background: 'color-mix(in srgb, var(--color-accent) 14%, transparent)',
                border: '1.5px solid var(--color-accent)',
                borderRadius: 999,
                fontSize: '0.8rem',
                fontWeight: 600,
                color: 'var(--color-accent)',
              }}
            >
              {s}
              <button
                type="button"
                onClick={() => toggle(s)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'inherit', display: 'flex' }}
              >
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: 'var(--space-3)' }}>
        <Search size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-400)', pointerEvents: 'none' }} />
        <input
          className="input"
          placeholder="Search services…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{ paddingLeft: 32 }}
        />
      </div>

      {atMax && (
        <div style={{ fontSize: '0.82rem', color: 'var(--color-error)', marginBottom: 'var(--space-2)' }}>
          Maximum {MAX_ITEMS} services reached. Remove one to add another.
        </div>
      )}

      {/* Catalog */}
      <div style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
        {displayCatalog.map((cat, ci) => {
          const allInCat = cat.items.filter((i) => selected.includes(i)).length
          return (
            <div key={cat.category}>
              {ci > 0 && <hr style={{ margin: 0, borderColor: 'var(--color-border)' }} />}
              <button
                type="button"
                onClick={() => toggleCategory(cat.category)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: 'var(--space-3) var(--space-4)',
                  background: cat.open ? 'color-mix(in srgb, var(--color-accent) 5%, var(--color-surface))' : 'var(--color-surface)',
                  border: 'none', cursor: 'pointer', textAlign: 'left',
                  color: 'var(--color-text-100)',
                }}
              >
                <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                  {cat.category}
                  {allInCat > 0 && (
                    <span style={{ marginLeft: 8, fontSize: '0.75rem', color: 'var(--color-accent)', fontWeight: 700 }}>
                      ({allInCat})
                    </span>
                  )}
                </span>
                {cat.open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </button>
              {cat.open && (
                <div style={{
                  padding: 'var(--space-2) var(--space-4) var(--space-3)',
                  display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)',
                  background: 'var(--color-surface-800)',
                }}>
                  {cat.items.map((item) => {
                    const checked = selected.includes(item)
                    const disabled = !checked && atMax
                    return (
                      <button
                        key={item}
                        type="button"
                        disabled={disabled}
                        onClick={() => toggle(item)}
                        style={{
                          padding: '0.3rem 0.75rem',
                          borderRadius: 999,
                          border: `1.5px solid ${checked ? 'var(--color-accent)' : 'var(--color-border)'}`,
                          background: checked ? 'color-mix(in srgb, var(--color-accent) 12%, transparent)' : 'transparent',
                          color: checked ? 'var(--color-accent)' : disabled ? 'var(--color-text-400)' : 'var(--color-text-200)',
                          fontWeight: checked ? 700 : 400,
                          fontSize: '0.82rem',
                          cursor: disabled ? 'not-allowed' : 'pointer',
                          opacity: disabled ? 0.5 : 1,
                          transition: 'all 0.12s',
                        }}
                      >
                        {item}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
