'use client'

import { useState } from 'react'
import { toast } from '@/components/ui/Toaster'

interface Props {
  label: string
}

export default function SubscribeButton({ label }: Props) {
  const [loading, setLoading] = useState(false)

  async function handleSubscribe() {
    setLoading(true)
    const res = await fetch('/api/payments/initiate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'subscription' }),
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
    <button className="btn btn--primary btn--md" onClick={handleSubscribe} disabled={loading}>
      {loading ? 'Starting…' : label}
    </button>
  )
}
