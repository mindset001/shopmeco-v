'use client'

import { useState, useMemo, useEffect } from 'react'
import { ChevronDown, ChevronRight, Search, X, Plus } from 'lucide-react'

interface ServiceItem {
  name: string
  description?: string
}

interface CatalogCategory {
  category: string
  items: ServiceItem[]
}

const CATALOG: CatalogCategory[] = [
  {
    category: 'Engine & Performance',
    items: [
      { name: 'Engine Diagnosis', description: 'Complete engine diagnostic check' },
      { name: 'Engine Repair', description: 'Engine repair and restoration' },
      { name: 'Engine Overhaul', description: 'Full engine overhaul service' },
      { name: 'Overheating Fix', description: 'Fix engine overheating issues' },
      { name: 'Oil Leak Repair', description: 'Repair oil leaks' },
      { name: 'Timing Belt Replacement', description: 'Replace timing belt' },
      { name: 'Head Gasket Repair', description: 'Head gasket replacement' },
    ],
  },
  {
    category: 'Electrical & Diagnostics',
    items: [
      { name: 'ECU Diagnostics', description: 'Computer diagnostics' },
      { name: 'ECU Programming', description: 'Engine control unit programming' },
      { name: 'Check Engine Light Fix', description: 'Diagnose and fix warning lights' },
      { name: 'Battery Replacement', description: 'Replace car battery' },
      { name: 'Alternator Repair', description: 'Alternator repair and replacement' },
      { name: 'Starter Repair', description: 'Starter motor repair' },
      { name: 'Wiring Repair', description: 'Electrical wiring repair' },
    ],
  },
  {
    category: 'Transmission',
    items: [
      { name: 'Transmission Repair', description: 'Transmission repair and service' },
      { name: 'Gearbox Service', description: 'Gearbox servicing and maintenance' },
      { name: 'Gear Shifting Issues', description: 'Fix gear shifting problems' },
      { name: 'Clutch Repair', description: 'Clutch replacement and repair' },
      { name: 'Automatic Transmission Service', description: 'Automatic transmission servicing' },
    ],
  },
  {
    category: 'Brakes',
    items: [
      { name: 'Brake Pad Replacement', description: 'Replace brake pads' },
      { name: 'Brake Disc Replacement', description: 'Replace brake discs' },
      { name: 'Brake Repair', description: 'General brake system repair' },
      { name: 'ABS Repair', description: 'Anti-lock braking system repair' },
    ],
  },
  {
    category: 'Suspension & Steering',
    items: [
      { name: 'Wheel Alignment', description: 'Wheel alignment service' },
      { name: 'Wheel Balancing', description: 'Wheel balancing service' },
      { name: 'Shock Absorber Replacement', description: 'Replace shock absorbers' },
      { name: 'Suspension Repair', description: 'Suspension system repair' },
      { name: 'Steering Rack Repair', description: 'Steering rack repair' },
    ],
  },
  {
    category: 'AC & Cooling',
    items: [
      { name: 'AC Repair', description: 'Air conditioning repair' },
      { name: 'AC Gas Refill', description: 'AC refrigerant refill' },
      { name: 'Compressor Repair', description: 'AC compressor repair' },
      { name: 'Radiator Repair', description: 'Radiator repair and replacement' },
      { name: 'Cooling Fan Repair', description: 'Cooling system fan repair' },
    ],
  },
  {
    category: 'Fuel System',
    items: [
      { name: 'Fuel Pump Repair', description: 'Fuel pump repair' },
      { name: 'Injector Cleaning', description: 'Fuel injector cleaning' },
      { name: 'Injector Replacement', description: 'Replace fuel injectors' },
      { name: 'Fuel Tank Cleaning', description: 'Clean fuel tank' },
      { name: 'Fuel Line Repair', description: 'Repair fuel lines' },
    ],
  },
  {
    category: 'Exhaust System',
    items: [
      { name: 'Exhaust Repair', description: 'Exhaust system repair' },
      { name: 'Silencer Replacement', description: 'Replace exhaust silencer' },
      { name: 'Smoke Diagnosis', description: 'Diagnose smoke issues' },
    ],
  },
  {
    category: 'General Maintenance',
    items: [
      { name: 'Oil Change', description: 'Oil and filter change' },
      { name: 'Full Service / Tune-up', description: 'Complete vehicle service' },
      { name: 'Spark Plug Replacement', description: 'Replace spark plugs' },
      { name: 'Filter Replacement', description: 'Replace engine filters' },
      { name: 'Vehicle Inspection', description: 'Vehicle inspection and check' },
    ],
  },
  {
    category: 'Tyres & Wheels',
    items: [
      { name: 'Tyre Replacement', description: 'Replace tires' },
      { name: 'Tyre Repair (Puncture)', description: 'Puncture repair' },
      { name: 'Rim Repair', description: 'Wheel rim repair' },
    ],
  },
  {
    category: 'Body Work',
    items: [
      { name: 'Panel Beating', description: 'Panel beating and dent repair' },
      { name: 'Painting', description: 'Vehicle painting service' },
      { name: 'Dent Removal', description: 'Remove dents and dings' },
      { name: 'Bumper Repair', description: 'Bumper repair and replacement' },
    ],
  },
  {
    category: 'Accessories & Installations',
    items: [
      { name: 'Tracker Installation', description: 'Install GPS tracker' },
      { name: 'Car Alarm Installation', description: 'Install car alarm' },
      { name: 'Stereo Installation', description: 'Install car stereo' },
      { name: 'Lighting Upgrade', description: 'Upgrade lighting system' },
    ],
  },
  {
    category: 'Emergency Services',
    items: [
      { name: 'Breakdown Assistance', description: 'Roadside assistance' },
      { name: 'Car Not Starting', description: 'Fix car starting issues' },
      { name: 'On-site Repair', description: 'Repair at customer location' },
      { name: 'Towing', description: 'Towing service' },
    ],
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
  const [customService, setCustomService] = useState('')
  const [showCustomInput, setShowCustomInput] = useState(false)

  // Load expanded state from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('services-expanded')
    if (stored) {
      try {
        setExpanded(JSON.parse(stored))
      } catch {
        // ignore parse errors
      }
    }
  }, [])

  // Save expanded state to localStorage
  const updateExpanded = (updater: (prev: Record<string, boolean>) => Record<string, boolean>) => {
    setExpanded((prev) => {
      const newExpanded = updater(prev)
      localStorage.setItem('services-expanded', JSON.stringify(newExpanded))
      return newExpanded
    })
  }

  function toggle(item: string) {
    if (selected.includes(item)) {
      onChange(selected.filter((x) => x !== item))
    } else if (selected.length < MAX_ITEMS) {
      onChange([...selected, item])
    }
  }

  function toggleCategory(cat: string): void {
    updateExpanded((prev) => ({ ...prev, [cat]: !prev[cat] }))
  }

  function addCustomService() {
    const trimmed = customService.trim()
    if (trimmed && !selected.includes(trimmed) && selected.length < MAX_ITEMS) {
      onChange([...selected, trimmed])
      setCustomService('')
      setShowCustomInput(false)
    }
  }

  const filtered = useMemo(() => {
    if (!query.trim()) return CATALOG
    const q = query.toLowerCase()
    return CATALOG.map((c) => ({
      ...c,
      items: c.items.filter((i) => i.name.toLowerCase().includes(q) || i.description?.toLowerCase().includes(q)),
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
      <div style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', marginBottom: 'var(--space-3)' }}>
        {displayCatalog.map((cat, ci) => {
          const allInCat = cat.items.filter((i) => selected.includes(i.name)).length
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
                    const checked = selected.includes(item.name)
                    const disabled = !checked && atMax
                    return (
                      <button
                        key={item.name}
                        type="button"
                        disabled={disabled}
                        onClick={() => toggle(item.name)}
                        title={item.description}
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
                        {item.name}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Custom Service Input */}
      {!atMax && (
        <>
          {!showCustomInput ? (
            <button
              type="button"
              onClick={() => setShowCustomInput(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '0.5rem 0.75rem',
                background: 'transparent',
                border: '1.5px dashed var(--color-border)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--color-text-300)',
                cursor: 'pointer',
                fontSize: '0.85rem',
                fontWeight: 500,
              }}
            >
              <Plus size={14} />
              Add Custom Service
            </button>
          ) : (
            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
              <input
                type="text"
                className="input"
                placeholder="e.g. Custom Modification"
                value={customService}
                onChange={(e) => setCustomService(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') addCustomService()
                  if (e.key === 'Escape') { setShowCustomInput(false); setCustomService('') }
                }}
                autoFocus
              />
              <button
                type="button"
                onClick={addCustomService}
                disabled={!customService.trim()}
                className="btn btn--secondary btn--sm"
              >
                Add
              </button>
              <button
                type="button"
                onClick={() => { setShowCustomInput(false); setCustomService('') }}
                className="btn btn--ghost btn--sm"
              >
                Cancel
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
