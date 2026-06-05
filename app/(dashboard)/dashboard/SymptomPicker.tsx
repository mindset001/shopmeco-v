'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Phone } from 'lucide-react'
import {
  SERVICE_ESTIMATES,
  categoriesFromSymptoms,
  formatNaira,
  isEmergencySymptom,
} from '@/lib/car-owner/insights'

const DEFAULT_SYMPTOMS = [
  'Car not starting',
  'Car shaking / vibrating',
  'Warning light on dashboard',
  'Strange noise',
  'Burning smell',
  'Poor fuel consumption',
  'Overheating',
  'Gear problems',
]

interface Props {
  symptoms?: string[]
  city: string
}

export default function SymptomPicker({ symptoms: propSymptoms, city }: Props) {
  const router = useRouter()
  const [selected, setSelected] = useState<string[]>([])
  const [text, setText] = useState('')
  const symptoms = propSymptoms ?? DEFAULT_SYMPTOMS

  function toggle(s: string) {
    setSelected((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s])
  }

  function autoGrow(el: HTMLTextAreaElement) {
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }

  function findMechanics() {
    const params = new URLSearchParams()
    if (city) params.set('city', city)
    const categories = categoriesFromSymptoms(selected)
    if (categories.length > 0) params.set('specialization', categories.join(','))
    if (selected.length) params.set('symptoms', selected.join(','))
    if (text.trim()) params.set('q', text.trim())
    router.push(`/repairers?${params.toString()}`)
  }

  function emergencySearch() {
    const params = new URLSearchParams()
    if (city) params.set('city', city)
    params.set('available', '1')
    params.set('emergency', '1')
    if (selected.length) params.set('symptoms', selected.join(','))
    const categories = categoriesFromSymptoms(selected)
    if (categories.length > 0) params.set('specialization', categories.join(','))
    router.push(`/repairers?${params.toString()}`)
  }

  const suggestedCategories = categoriesFromSymptoms(selected)
  const urgent = isEmergencySymptom(selected)
  const canSearch = selected.length > 0 || text.trim().length > 0

  return (
    <div className="card" style={{ padding: 'var(--space-6)', marginBottom: 'var(--space-6)' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
        <h2 style={{ fontWeight: 700, fontSize: '1.05rem', margin: 0 }}>
          What exactly is the problem?
        </h2>
        {selected.length > 0 && (
          <button
            type="button"
            onClick={() => setSelected([])}
            style={{ fontSize: '0.8rem', color: 'var(--color-text-400)', background: 'none', border: 'none', cursor: 'pointer', padding: '0.2rem 0.4rem' }}
          >
            Clear
          </button>
        )}
      </div>

      {/* Symptom chips */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
        {symptoms.map((s) => {
          const active = selected.includes(s)
          return (
            <button
              key={s}
              type="button"
              onClick={() => toggle(s)}
              title={categoriesFromSymptoms([s])[0] || undefined}
              style={{
                padding: '0.4rem 0.9rem',
                borderRadius: 999,
                border: `1.5px solid ${active ? 'var(--color-accent)' : 'var(--color-border)'}`,
                background: active ? 'color-mix(in srgb, var(--color-accent) 12%, transparent)' : 'transparent',
                color: active ? 'var(--color-accent)' : 'var(--color-text-200)',
                fontWeight: active ? 700 : 400,
                fontSize: '0.85rem',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {s}
            </button>
          )
        })}
      </div>

      {/* Estimates — one card per matched category */}
      {suggestedCategories.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
          {suggestedCategories.map((cat) => {
            const estimate = SERVICE_ESTIMATES[cat]
            if (!estimate) return null
            return (
              <div
                key={cat}
                style={{ padding: 'var(--space-3)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' }}
              >
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-400)', marginBottom: 2 }}>{cat}</div>
                <div style={{ fontWeight: 700, color: 'var(--color-accent)', marginBottom: 4 }}>
                  {formatNaira(estimate.min)} – {formatNaira(estimate.max)}
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--color-text-300)', lineHeight: 1.45 }}>
                  {estimate.note}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Emergency banner */}
      {urgent && (
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 'var(--space-4)',
          flexWrap: 'wrap',
          padding: 'var(--space-4)',
          border: '1px solid var(--color-danger)',
          borderRadius: 'var(--radius-md)',
          background: 'color-mix(in srgb, var(--color-danger) 8%, transparent)',
          marginBottom: 'var(--space-4)',
        }}>
          <div>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-danger)', marginBottom: 4 }}>
              This may need immediate attention
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-300)', lineHeight: 1.5 }}>
              Don&apos;t drive further until a mechanic checks it. Find someone available right now.
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', flexShrink: 0 }}>
            <button type="button" className="btn btn--danger btn--sm" onClick={emergencySearch}>
              Find available help now
            </button>
            <a
              href="tel:+234"
              className="btn btn--ghost btn--sm"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
            >
              <Phone size={13} /> Call a mechanic
            </a>
          </div>
        </div>
      )}

      {/* Free-text description */}
      <textarea
        className="input"
        rows={2}
        placeholder="Describe your problem in more detail (optional)…"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onInput={(e) => autoGrow(e.currentTarget)}
        style={{ resize: 'none', marginBottom: 'var(--space-4)', width: '100%', overflow: 'hidden' }}
      />

      <button
        className="btn btn--primary btn--md"
        onClick={findMechanics}
        disabled={!canSearch}
      >
        Find Mechanics for My Problem
      </button>
    </div>
  )
}
