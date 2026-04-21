'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from '@/components/ui/Toaster'
import type { BookingStatus } from '@/types'

interface Props {
  bookingId: string
  currentStatus: string
  isRepairer: boolean
  agreedPrice?: number | null
  paymentStatus?: string
  customerId?: string
  repairerId?: string
}

export default function BookingActions({ bookingId, currentStatus, isRepairer, agreedPrice, paymentStatus, customerId, repairerId }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [showPriceForm, setShowPriceForm] = useState(false)
  const [price, setPrice] = useState('')

  async function createNotification(action: string) {
    await fetch('/api/notifications/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookingId, action }),
    }).catch(() => {})
  }

  // Repairer: advance from confirmed → completed, or cancel
  const canMarkComplete = isRepairer && currentStatus === 'confirmed'
  const canCancel = currentStatus === 'pending' || (isRepairer && currentStatus === 'confirmed')
  // Car owner: pay when confirmed + unpaid + price agreed
  const canPay = !isRepairer && currentStatus === 'confirmed' && (paymentStatus === 'unpaid' || !paymentStatus) && !!agreedPrice

  async function update(status: BookingStatus, actionKey: string) {
    setLoading(actionKey)
    const supabase = createClient()
    const { error } = await supabase.from('bookings').update({ status }).eq('id', bookingId)
    if (error) { toast(error.message, 'error') }
    else { 
      toast('Booking updated.', 'success')
      if (actionKey === 'complete') await createNotification('completed')
      if (actionKey === 'confirm') await createNotification('confirmed')
      router.refresh() 
    }
    setLoading(null)
  }

  async function confirmWithPrice() {
    const numPrice = parseFloat(price)
    if (!numPrice || numPrice <= 0) { toast('Enter a valid price.', 'warning'); return }
    setLoading('confirm')
    const supabase = createClient()
    const { error } = await supabase
      .from('bookings')
      .update({ status: 'confirmed', agreed_price: numPrice })
      .eq('id', bookingId)
    if (error) { toast(error.message, 'error') }
    else { 
      toast('Booking confirmed.', 'success')
      await createNotification('confirmed')
      setShowPriceForm(false)
      router.refresh() 
    }
    setLoading(null)
  }

  async function handlePayNow() {
    setLoading('pay')
    const res = await fetch('/api/payments/initiate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'booking', id: bookingId }),
    })
    const data = await res.json()
    if (!res.ok || !data.authorization_url) {
      toast(data.error ?? 'Could not initiate payment.', 'error')
      setLoading(null)
      return
    }
    window.location.href = data.authorization_url
  }

  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
      {/* Repairer: confirm pending booking with a price */}
      {isRepairer && currentStatus === 'pending' && !showPriceForm && (
        <button className="btn btn--primary btn--sm" onClick={() => setShowPriceForm(true)}>
          Confirm Booking
        </button>
      )}
      {isRepairer && currentStatus === 'pending' && showPriceForm && (
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            className="input"
            style={{ width: 140 }}
            type="number"
            min="1"
            placeholder="Agreed price (₦)"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
          <button className="btn btn--primary btn--sm" onClick={confirmWithPrice} disabled={loading === 'confirm'}>
            {loading === 'confirm' ? '…' : 'Set & Confirm'}
          </button>
          <button className="btn btn--ghost btn--sm" onClick={() => setShowPriceForm(false)}>
            Back
          </button>
        </div>
      )}

      {/* Repairer: mark complete */}
      {canMarkComplete && (
        <button
          className="btn btn--primary btn--sm"
          onClick={() => update('completed', 'complete')}
          disabled={!!loading}
        >
          {loading === 'complete' ? '…' : 'Mark as Completed'}
        </button>
      )}

      {/* Car owner: Pay Now */}
      {canPay && (
        <button
          className="btn btn--primary btn--sm"
          onClick={handlePayNow}
          disabled={loading === 'pay'}
          style={{ background: 'var(--color-success)', borderColor: 'var(--color-success)' }}
        >
          {loading === 'pay' ? 'Redirecting…' : `Pay ₦${Number(agreedPrice).toLocaleString()}`}
        </button>
      )}

      {/* Awaiting payment label for car owner */}
      {!isRepairer && currentStatus === 'confirmed' && paymentStatus === 'in_escrow' && (
        <span style={{ fontSize: '0.8rem', color: 'var(--color-text-300)', fontStyle: 'italic' }}>
          ✅ Payment in escrow
        </span>
      )}

      {/* Cancel */}
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
