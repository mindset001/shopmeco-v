'use client'

import { useRouter, usePathname } from 'next/navigation'
import Input from '@/components/ui/Input'
import { Search } from 'lucide-react'

import { STANDARD_CATEGORIES, STANDARD_CONDITIONS } from './new/page'

interface Props {
  locations: string[]
  current: { category?: string; brand?: string; q?: string; location?: string; model?: string; condition?: string }
}

const COMMON_MAKES = ['Toyota', 'Honda', 'Mercedes-Benz', 'Lexus', 'BMW', 'Nissan', 'Hyundai', 'Kia', 'Ford']
const COMMON_MODELS = ['Corolla', 'Camry', 'Civic', 'Accord', 'C-Class', 'E-Class', 'RX 350', 'ES 350', 'Highlander', 'CR-V']

export default function MarketplaceFilters({ locations, current }: Props) {
  const router = useRouter()
  const pathname = usePathname()

  function push(params: Record<string, string | undefined>) {
    const sp = new URLSearchParams()
    const merged = { ...current, ...params }
    for (const [k, v] of Object.entries(merged)) {
      if (v) sp.set(k, v)
    }
    router.push(`${pathname}?${sp.toString()}`)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
      <Input
        placeholder="Search products…"
        defaultValue={current.q ?? ''}
        icon={<Search size={16} />}
        onKeyDown={(e) => {
          if (e.key === 'Enter') push({ q: (e.target as HTMLInputElement).value })
        }}
      />

      <div className="input-group">
        <label className="input-label">Category</label>
        <select
          className="input"
          value={current.category ?? ''}
          onChange={(e) => push({ category: e.target.value || undefined })}
        >
          <option value="">All categories</option>
          {STANDARD_CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      <div className="input-group">
        <label className="input-label">Condition</label>
        <select
          className="input"
          value={current.condition ?? ''}
          onChange={(e) => push({ condition: e.target.value || undefined })}
        >
          <option value="">Any condition</option>
          {STANDARD_CONDITIONS.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      <div className="input-group">
        <label className="input-label">Make / Brand</label>
        <select
          className="input"
          value={current.brand ?? ''}
          onChange={(e) => push({ brand: e.target.value || undefined })}
        >
          <option value="">All makes</option>
          {COMMON_MAKES.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
      </div>

      <div className="input-group">
        <label className="input-label">Car Model</label>
        <select
          className="input"
          value={current.model ?? ''}
          onChange={(e) => push({ model: e.target.value || undefined })}
        >
          <option value="">All models</option>
          {COMMON_MODELS.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
      </div>

      <div className="input-group">
        <label className="input-label">Location</label>
        <select
          className="input"
          value={current.location ?? ''}
          onChange={(e) => push({ location: e.target.value || undefined })}
        >
          <option value="">All locations</option>
          {locations.map((l) => (
            <option key={l} value={l}>{l}</option>
          ))}
        </select>
      </div>

      {(current.category || current.condition || current.brand || current.q || current.location || current.model) && (
        <button
          className="btn btn--ghost btn--sm"
          onClick={() => router.push(pathname)}
        >
          Clear filters
        </button>
      )}
    </div>
  )
}
