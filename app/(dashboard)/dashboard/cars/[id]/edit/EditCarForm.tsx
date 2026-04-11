'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { toast } from '@/components/ui/Toaster'
import Toaster from '@/components/ui/Toaster'
import type { Car } from '@/types'
import ImageUploadGrid from '@/components/ui/ImageUploadGrid'

const MAKES = ['Toyota', 'Honda', 'Ford', 'Chevrolet', 'Hyundai', 'Kia', 'Nissan', 'Mazda', 'BMW', 'Mercedes-Benz', 'Volkswagen', 'Peugeot', 'Suzuki', 'Mitsubishi', 'Lexus', 'Other']
const COLORS = ['White', 'Black', 'Silver', 'Grey', 'Blue', 'Red', 'Green', 'Brown', 'Gold', 'Other']
const currentYear = new Date().getFullYear()
const YEARS = Array.from({ length: 40 }, (_, i) => currentYear - i)

export default function EditCarForm({ car }: { car: Car }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [imageUrls, setImageUrls] = useState<string[]>(car.images ?? [])

  const [form, setForm] = useState({
    make: car.make, model: car.model, year: car.year,
    color: car.color ?? '', plate_number: car.plate_number ?? '',
    mileage: car.mileage?.toString() ?? '', description: car.description ?? '',
    is_public: car.is_public,
  })

  function set(field: string, value: string | number | boolean) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.from('cars').update({
      make: form.make, model: form.model, year: Number(form.year),
      color: form.color || null, plate_number: form.plate_number || null,
      mileage: form.mileage ? Number(form.mileage) : null,
      description: form.description || null,
      images: imageUrls, is_public: form.is_public,
    }).eq('id', car.id)
    if (error) { toast(error.message, 'error'); setLoading(false); return }
    toast('Car updated!', 'success')
    router.push('/dashboard/cars')
    router.refresh()
  }

  async function handleDelete() {
    if (!confirm('Delete this car? This cannot be undone.')) return
    setDeleting(true)
    const supabase = createClient()
    const { error } = await supabase.from('cars').delete().eq('id', car.id)
    if (error) { toast(error.message, 'error'); setDeleting(false); return }
    toast('Car deleted.', 'success')
    router.push('/dashboard/cars')
    router.refresh()
  }

  return (
    <>
      <Toaster />
      <form onSubmit={handleSubmit} style={{ maxWidth: 640 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
          <div className="form-group">
            <label className="form-label">Make *</label>
            <select className="input" value={form.make} onChange={e => set('make', e.target.value)} required>
              {MAKES.map(m => <option key={m}>{m}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Model *</label>
            <Input placeholder="e.g. Corolla" value={form.model} onChange={e => set('model', e.target.value)} required />
          </div>
          <div className="form-group">
            <label className="form-label">Year *</label>
            <select className="input" value={form.year} onChange={e => set('year', Number(e.target.value))} required>
              {YEARS.map(y => <option key={y}>{y}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Color</label>
            <select className="input" value={form.color} onChange={e => set('color', e.target.value)}>
              <option value="">Select color</option>
              {COLORS.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Plate Number</label>
            <Input value={form.plate_number} onChange={e => set('plate_number', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Mileage (km)</label>
            <Input type="number" value={form.mileage} onChange={e => set('mileage', e.target.value)} />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Description / Issues</label>
          <textarea className="input" rows={4} value={form.description} onChange={e => set('description', e.target.value)} style={{ resize: 'vertical' }} />
        </div>
        <ImageUploadGrid
          bucket="cars"
          userId={car.owner_id}
          maxImages={6}
          uploadedUrls={imageUrls}
          onUrlsChange={setImageUrls}
          label="Car Photos"
        />
        <div className="form-group">
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <input type="checkbox" checked={form.is_public} onChange={e => set('is_public', e.target.checked)} />
            <span>Make this car visible to repairers and others</span>
          </label>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <Button type="submit" variant="primary" loading={loading}>Save Changes</Button>
          <Button type="button" variant="danger" loading={deleting} onClick={handleDelete}>Delete Car</Button>
        </div>
      </form>
    </>
  )
}
