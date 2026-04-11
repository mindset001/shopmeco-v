'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from '@/components/ui/Toaster'

export default function BookingForm({
  repairerId,
  customerId,
}: {
  repairerId: string
  customerId: string
}) {
  const [date, setDate] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const today = new Date().toISOString().split('T')[0]

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!date || !description.trim()) return
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.from('bookings').insert({
      repairer_id: repairerId,
      customer_id: customerId,
      scheduled_date: date,
      description: description.trim(),
    })
    if (error) {
      toast(error.message, 'error')
    } else {
      toast('Booking request sent!', 'success')
      setSent(true)
    }
    setLoading(false)
  }

  if (sent) {
    return (
      <div className="card" style={{ padding: 'var(--space-6)', textAlign: 'center' }}>
        <div style={{ fontSize: '2rem', marginBottom: 8 }}>✅</div>
        <div style={{ fontWeight: 700, marginBottom: 4 }}>Booking request sent!</div>
        <div style={{ color: 'var(--color-text-300)', fontSize: '0.9rem' }}>
          The repairer will confirm your appointment shortly.
        </div>
      </div>
    )
  }

  return (
    <div className="card" style={{ padding: 'var(--space-6)' }}>
      <h3 style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: 'var(--space-4)' }}>
        Book an Appointment
      </h3>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        <div className="form-group">
          <label className="form-label">Preferred Date</label>
          <input
            type="date"
            className="form-input"
            value={date}
            min={today}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label className="form-label">Describe the issue</label>
          <textarea
            className="form-input"
            rows={4}
            placeholder="What needs to be repaired? Provide as much detail as possible."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            style={{ resize: 'vertical' }}
          />
        </div>
        <button
          type="submit"
          className="btn btn--primary btn--md"
          disabled={loading}
          style={{ alignSelf: 'flex-start' }}
        >
          {loading ? 'Sending…' : 'Send Booking Request'}
        </button>
      </form>
    </div>
  )
}
