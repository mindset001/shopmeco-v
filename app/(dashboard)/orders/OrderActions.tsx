'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from '@/components/ui/Toaster'
import type { OrderStatus } from '@/types'

const nextStatus: Record<string, OrderStatus> = {
  pending: 'confirmed',
  confirmed: 'shipped',
  shipped: 'delivered',
}

const nextLabel: Record<string, string> = {
  pending: 'Confirm Order',
  confirmed: 'Mark as Shipped',
  shipped: 'Mark as Delivered',
}

interface Props {
  orderId: string
  currentStatus: string
  isSeller: boolean
}

export default function OrderActions({ orderId, currentStatus, isSeller }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const next = nextStatus[currentStatus]

  async function advance() {
    if (!next) return
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase
      .from('orders')
      .update({ status: next })
      .eq('id', orderId)
    if (error) { toast(error.message, 'error') }
    else { toast('Order status updated!', 'success'); router.refresh() }
    setLoading(false)
  }

  async function cancel() {
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.from('orders').update({ status: 'cancelled' }).eq('id', orderId)
    if (error) { toast(error.message, 'error') }
    else { toast('Order cancelled.', 'info'); router.refresh() }
    setLoading(false)
  }

  return (
    <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end' }}>
      <button className="btn btn--danger btn--sm" onClick={cancel} disabled={loading}>
        Cancel Order
      </button>
      {isSeller && next && (
        <button className="btn btn--primary btn--sm" onClick={advance} disabled={loading}>
          {loading ? 'Updating…' : nextLabel[currentStatus]}
        </button>
      )}
    </div>
  )
}
