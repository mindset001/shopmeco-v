'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { toast } from '@/components/ui/Toaster'
import Toaster from '@/components/ui/Toaster'
import { Car } from 'lucide-react'
import ImageUploadGrid from '@/components/ui/ImageUploadGrid'

const MAKES = ['Toyota', 'Honda', 'Ford', 'Chevrolet', 'Hyundai', 'Kia', 'Nissan', 'Mazda', 'BMW', 'Mercedes-Benz', 'Volkswagen', 'Peugeot', 'Suzuki', 'Mitsubishi', 'Lexus', 'Other']
const COLORS = ['White', 'Black', 'Silver', 'Grey', 'Blue', 'Red', 'Green', 'Brown', 'Gold', 'Other']
const currentYear = new Date().getFullYear()
const YEARS = Array.from({ length: 40 }, (_, i) => currentYear - i)

export default function NewCarForm({ ownerId }: { ownerId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [imageUrls, setImageUrls] = useState<string[]>([])

  const [form, setForm] = useState({
    make: '', model: '', year: currentYear, color: '', plate_number: '',
    mileage: '', description: '', is_public: true,
  })

  function set(field: string, value: string | number | boolean) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.make || !form.model) { toast('Make and model are required', 'error'); return }
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.from('cars').insert({
      owner_id: ownerId,
      make: form.make,
      model: form.model,
      year: Number(form.year),
      color: form.color || null,
      plate_number: form.plate_number || null,
      mileage: form.mileage ? Number(form.mileage) : null,
      description: form.description || null,
      images: imageUrls,
      is_public: form.is_public,
    })
    if (error) { toast(error.message, 'error'); setLoading(false); return }
    toast('Car added successfully!', 'success')
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
              <option value="">Select make</option>
              {MAKES.map(m => <option key={m}>{m}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Model *</label>
            <Input placeholder="e.g. Corolla, Civic" value={form.model} onChange={e => set('model', e.target.value)} required />
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
            <Input placeholder="e.g. ABC 123 XY" value={form.plate_number} onChange={e => set('plate_number', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Mileage (km)</label>
            <Input type="number" placeholder="e.g. 45000" value={form.mileage} onChange={e => set('mileage', e.target.value)} />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Description / Issues</label>
          <textarea
            className="input"
            rows={4}
            placeholder="Describe your car, any known issues, service history..."
            value={form.description}
            onChange={e => set('description', e.target.value)}
            style={{ resize: 'vertical' }}
          />
        </div>

        <ImageUploadGrid
          bucket="cars"
          userId={ownerId}
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

        <Button type="submit" variant="primary" loading={loading}>
          Save Car
        </Button>
      </form>
    </>
  )
}
