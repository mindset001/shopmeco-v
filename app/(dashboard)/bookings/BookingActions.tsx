'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from '@/components/ui/Toaster'
import type { BookingStatus } from '@/types'

const nextStatus: Record<string, BookingStatus> = {
  pending: 'confirmed',
  confirmed: 'completed',
}

const nextLabel: Record<string, string> = {
  pending: 'Confirm Booking',
  confirmed: 'Mark as Completed',
}

interface Props {
  bookingId: string
  currentStatus: string
  isRepairer: boolean
}

export default function BookingActions({ bookingId, currentStatus, isRepairer }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState<'advance' | 'cancel' | null>(null)

  const canCancel = currentStatus === 'pending' || (isRepairer && currentStatus === 'confirmed')
  const canAdvance = isRepairer && !!nextStatus[currentStatus]

  if (!canAdvance && !canCancel) return null

  async function update(status: BookingStatus, actionKey: 'advance' | 'cancel') {
    setLoading(actionKey)
    const supabase = createClient()
    const { error } = await supabase
      .from('bookings')
      .update({ status })
      .eq('id', bookingId)
    if (error) { toast(error.message, 'error') }
    else { toast('Booking updated.', 'success'); router.refresh() }
    setLoading(null)
  }

  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
      {canAdvance && (
        <button
          className="btn btn--primary btn--sm"
          onClick={() => update(nextStatus[currentStatus], 'advance')}
          disabled={!!loading}
        >
          {loading === 'advance' ? '…' : nextLabel[currentStatus]}
        </button>
      )}
      {canCancel && (
        <button
          className="btn btn--danger btn--sm"
          onClick={() => update('cancelled', 'cancel')}
          disabled={!!loading}
        >
          {loading === 'cancel' ? '…' : 'Cancel'}
        </button>
      )}
    </div>
  )
}
