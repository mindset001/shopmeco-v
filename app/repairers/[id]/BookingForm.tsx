'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from '@/components/ui/Toaster'
import { ShieldAlert } from 'lucide-react'
import ImageUploadGrid from '@/components/ui/ImageUploadGrid'

const SERVICE_TYPES = [
  'Engine Repair',
  'Electrical / Wiring',
  'Transmission / Gearbox',
  'Brakes',
  'Suspension & Steering',
  'AC & Cooling',
  'Fuel System',
  'Routine Maintenance',
  'Body Work',
  'Other',
]

const SYMPTOM_OPTIONS = [
  'Car not starting',
  'Car shaking / vibrating',
  'Warning light on dashboard',
  'Strange noise',
  'Burning smell',
  'Poor fuel consumption',
  'Overheating',
  'Gear problems',
]

interface Car {
  id: string
  make: string
  model: string
  year: number | null
}

export default function BookingForm({
  repairerId,
  customerId,
  isVerified = true,
}: {
  repairerId: string
  customerId: string
  isVerified?: boolean
}) {
  const searchParams = useSearchParams()

  const [date, setDate] = useState('')
  const [serviceType, setServiceType] = useState(searchParams.get('service') ?? '')
  const [mode, setMode] = useState<'workshop' | 'home'>('workshop')
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>(() => {
    const raw = searchParams.get('symptoms')
    return raw ? raw.split(',').filter(Boolean) : []
  })
  const [description, setDescription] = useState(searchParams.get('q') ?? '')
  const [carId, setCarId] = useState('')
  const [cars, setCars] = useState<Car[]>([])
  const [photoUrls, setPhotoUrls] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const today = new Date().toISOString().split('T')[0]

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('cars')
      .select('id, make, model, year')
      .eq('owner_id', customerId)
      .order('created_at', { ascending: false })
      .then(({ data }) => { if (data) setCars(data as Car[]) })
  }, [customerId])

  function toggleSymptom(s: string) {
    setSelectedSymptoms((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!date || !serviceType) return
    setLoading(true)

    const parts: string[] = []
    if (serviceType) parts.push(`Service: ${serviceType}`)
    if (mode === 'home') parts.push('Mode: Home Service')
    if (selectedSymptoms.length) parts.push(`Symptoms: ${selectedSymptoms.join(', ')}`)
    if (description.trim()) parts.push(description.trim())

    const supabase = createClient()
    const { error } = await supabase.from('bookings').insert({
      repairer_id: repairerId,
      customer_id: customerId,
      scheduled_date: date,
      description: parts.join('\n'),
      ...(carId ? { car_id: carId } : {}),
      ...(photoUrls.length ? { photos: photoUrls } : {}),
    })

    if (error) {
      toast(error.message, 'error')
    } else {
      // Create notification for the repairer
      const { data: booking } = await supabase
        .from('bookings')
        .select('id')
        .eq('repairer_id', repairerId)
        .eq('customer_id', customerId)
        .eq('scheduled_date', date)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (booking) {
        await fetch('/api/notifications/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ bookingId: booking.id, action: 'created' }),
        })
      }

      toast('Booking request sent!', 'success')
      setSent(true)
    }
    setLoading(false)
  }

  if (!isVerified) {
    return (
      <div className="card" style={{ padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-4)', textAlign: 'center' }}>
        <ShieldAlert size={36} style={{ color: '#f59e0b' }} />
        <div style={{ fontWeight: 700, fontSize: '1rem' }}>Booking Unavailable</div>
        <div style={{ color: 'var(--color-text-300)', fontSize: '0.9rem', lineHeight: 1.6 }}>
          This mechanic hasn&apos;t been verified by ShopMecko admin yet. Once verified, you&apos;ll be able to book an appointment. You can still send them a message in the meantime.
        </div>
      </div>
    )
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
    <div id="book" className="card" style={{ padding: 'var(--space-6)' }}>
      <h3 style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: 'var(--space-6)' }}>
        Book an Appointment
      </h3>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>

        {/* Service type */}
        <div className="form-group">
          <label className="form-label">Service Type *</label>
          <select
            className="form-input"
            value={serviceType}
            onChange={(e) => setServiceType(e.target.value)}
            required
          >
            <option value="">Select a service…</option>
            {SERVICE_TYPES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        {/* Service mode */}
        <div className="form-group">
          <label className="form-label">Service Mode *</label>
          <div style={{ display: 'flex', gap: 'var(--space-4)', marginTop: 4 }}>
            {(['workshop', 'home'] as const).map((m) => (
              <label key={m} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: '0.9rem' }}>
                <input
                  type="radio"
                  name="mode"
                  value={m}
                  checked={mode === m}
                  onChange={() => setMode(m)}
                  style={{ accentColor: 'var(--color-accent)' }}
                />
                {m === 'workshop' ? '🔧 Workshop Visit' : '🏠 Home Service'}
              </label>
            ))}
          </div>
        </div>

        {/* Symptoms */}
        <div className="form-group">
          <label className="form-label">Symptoms (select all that apply)</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)', marginTop: 4 }}>
            {SYMPTOM_OPTIONS.map((s) => {
              const active = selectedSymptoms.includes(s)
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => toggleSymptom(s)}
                  style={{
                    padding: '0.3rem 0.8rem',
                    borderRadius: 999,
                    border: `1.5px solid ${active ? 'var(--color-accent)' : 'var(--color-border)'}`,
                    background: active ? 'color-mix(in srgb, var(--color-accent) 12%, transparent)' : 'transparent',
                    color: active ? 'var(--color-accent)' : 'var(--color-text-200)',
                    fontWeight: active ? 700 : 400,
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                  }}
                >
                  {s}
                </button>
              )
            })}
          </div>
        </div>

        {/* Preferred date */}
        <div className="form-group">
          <label className="form-label">Preferred Date *</label>
          <input
            type="date"
            className="form-input"
            value={date}
            min={today}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </div>

        {/* Select car */}
        {cars.length > 0 && (
          <div className="form-group">
            <label className="form-label">Which car needs service?</label>
            <select
              className="form-input"
              value={carId}
              onChange={(e) => setCarId(e.target.value)}
            >
              <option value="">Not specified</option>
              {cars.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.year ? `${c.year} ` : ''}{c.make} {c.model}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Additional description */}
        <div className="form-group">
          <label className="form-label">Additional details</label>
          <textarea
            className="form-input"
            rows={3}
            placeholder="Any extra information for the mechanic…"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            style={{ resize: 'vertical' }}
          />
        </div>

        {/* Photo upload */}
        <div className="form-group">
          <ImageUploadGrid
            bucket="bookings"
            userId={customerId}
            maxImages={5}
            uploadedUrls={photoUrls}
            onUrlsChange={setPhotoUrls}
            label="Photos / Videos (optional)"
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
