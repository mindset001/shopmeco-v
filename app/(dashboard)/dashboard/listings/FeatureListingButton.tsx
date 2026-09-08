'use client'

import { useState } from 'react'
import { Sparkles } from 'lucide-react'
import { toast } from '@/components/ui/Toaster'

interface Props {
  productId: string
  price: number
  durationDays: number
}

export default function FeatureListingButton({ productId, price, durationDays }: Props) {
  const [loading, setLoading] = useState(false)

  async function handleBoost() {
    setLoading(true)
    const res = await fetch('/api/payments/initiate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'featured_listing', id: productId }),
    })
    const data = await res.json()

    if (!res.ok || !data.authorization_url) {
      toast(data.error ?? 'Could not start checkout.', 'error')
      setLoading(false)
      return
    }

    window.location.href = data.authorization_url
  }

  return (
    <button
      className="btn btn--ghost btn--sm"
      onClick={handleBoost}
      disabled={loading}
      title={`Boost for ₦${price.toLocaleString()} — featured for ${durationDays} day${durationDays !== 1 ? 's' : ''}`}
      style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--color-accent)' }}
    >
      <Sparkles size={14} />
      {loading ? 'Starting…' : 'Boost'}
    </button>
  )
}
