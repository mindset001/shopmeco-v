'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface Props {
  symptoms?: string[]
  city: string
}

// Default symptoms if not provided
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

const SYMPTOM_CATEGORY_MAP: Record<string, string> = {
  'Car not starting': 'Electrical',
  'Car shaking / vibrating': 'Suspension',
  'Warning light on dashboard': 'Electrical',
  'Strange noise': 'Engine',
  'Burning smell': 'Engine',
  'Poor fuel consumption': 'Fuel',
  'Overheating': 'Engine',
  'Gear problems': 'Transmission',
}

export default function SymptomPicker({ symptoms: propSymptoms, city }: Props) {
  const router = useRouter()
  const [selected, setSelected] = useState<string[]>([])
  const [text, setText] = useState('')
  const [symptoms, setSymptoms] = useState<string[]>(propSymptoms || DEFAULT_SYMPTOMS)
  const [loading, setLoading] = useState(!propSymptoms)

  // Fetch symptoms from database if not provided via props
  useEffect(() => {
    if (propSymptoms) return

    async function loadSymptoms() {
      try {
        const supabase = createClient()
        const { data } = await supabase
          .from('symptoms')
          .select('name')
          .limit(15)

        if (data && data.length > 0) {
          setSymptoms(data.map((s: any) => s.name))
        } else {
          setSymptoms(DEFAULT_SYMPTOMS)
        }
      } catch {
        setSymptoms(DEFAULT_SYMPTOMS)
      } finally {
        setLoading(false)
      }
    }

    loadSymptoms()
  }, [propSymptoms])

  function toggle(s: string) {
    setSelected((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s])
  }

  function findMechanics() {
    const params = new URLSearchParams()
    if (city) params.set('city', city)
    
    // Include multiple categories if multiple symptoms map to different specializations
    const categories = [...new Set(selected.map((s) => SYMPTOM_CATEGORY_MAP[s]).filter(Boolean))]
    if (categories.length > 0) params.set('specialization', categories.join(','))
    
    if (selected.length) params.set('symptoms', selected.join(','))
    if (text.trim()) params.set('q', text.trim())
    
    router.push(`/repairers?${params.toString()}`)
  }

  if (loading) {
    return (
      <div className="card" style={{ padding: 'var(--space-6)', marginBottom: 'var(--space-6)' }}>
        <div style={{ color: 'var(--color-text-400)' }}>Loading symptoms…</div>
      </div>
    )
  }

  return (
    <div className="card" style={{ padding: 'var(--space-6)', marginBottom: 'var(--space-6)' }}>
      <h2 style={{ fontWeight: 700, fontSize: '1.05rem', marginBottom: 'var(--space-4)' }}>
        What exactly is the problem?
      </h2>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
        {symptoms.map((s) => {
          const active = selected.includes(s)
          return (
            <button
              key={s}
              type="button"
              onClick={() => toggle(s)}
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
              title={SYMPTOM_CATEGORY_MAP[s] || undefined}
            >
              {s}
            </button>
          )
        })}
      </div>

      <textarea
        className="input"
        rows={3}
        placeholder="Describe your problem in more detail (optional)…"
        value={text}
        onChange={(e) => setText(e.target.value)}
        style={{ resize: 'vertical', marginBottom: 'var(--space-4)', width: '100%' }}
      />

      <button
        className="btn btn--primary btn--md"
        onClick={findMechanics}
        disabled={selected.length === 0 && !text.trim()}
        style={{
          opacity: selected.length === 0 && !text.trim() ? 0.5 : 1,
          cursor: selected.length === 0 && !text.trim() ? 'not-allowed' : 'pointer',
        }}
      >
        Find Mechanics for My Problem
      </button>
    </div>
  )
}
