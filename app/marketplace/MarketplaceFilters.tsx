'use client'

import { useRouter, usePathname } from 'next/navigation'
import Input from '@/components/ui/Input'
import { Search } from 'lucide-react'

interface Props {
  categories: string[]
  brands: string[]
  current: { category?: string; brand?: string; q?: string }
}

export default function MarketplaceFilters({ categories, brands, current }: Props) {
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
          {categories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      <div className="input-group">
        <label className="input-label">Brand</label>
        <select
          className="input"
          value={current.brand ?? ''}
          onChange={(e) => push({ brand: e.target.value || undefined })}
        >
          <option value="">All brands</option>
          {brands.map((b) => (
            <option key={b} value={b}>{b}</option>
          ))}
        </select>
      </div>

      {(current.category || current.brand || current.q) && (
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
