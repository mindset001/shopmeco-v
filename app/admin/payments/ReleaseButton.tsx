'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from '@/components/ui/Toaster'
import type { EscrowStatus } from '@/types'

interface Props {
  escrowId: string
  status: EscrowStatus
}

export default function ReleaseButton({ escrowId, status }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  if (status !== 'held') return null

  async function handleRelease() {
    setLoading(true)
    const res = await fetch('/api/admin/payments/release', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ escrow_id: escrowId }),
    })
    const data = await res.json()
    if (!res.ok) {
      toast(data.error ?? 'Failed to release payment', 'error')
    } else {
      toast('Payment released to wallet.', 'success')
      router.refresh()
    }
    setLoading(false)
  }

  return (
    <button
      className="btn btn--primary btn--sm"
      onClick={handleRelease}
      disabled={loading}
    >
      {loading ? 'Releasing…' : 'Release Payment'}
    </button>
  )
}
