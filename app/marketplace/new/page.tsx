'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from '@/components/ui/Toaster'
import Toaster from '@/components/ui/Toaster'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Navbar from '@/components/nav/Navbar'
import ImageUploadGrid from '@/components/ui/ImageUploadGrid'
import { CAR_MAKES, CAR_MODELS, CAR_YEARS } from '@/lib/data/cars'

export const STANDARD_CATEGORIES = [
  'Engine & Drivetrain',
  'Brakes & Suspension',
  'Body & Exterior',
  'Interior & Accessories',
  'Electrical & Lighting',
  'Fluids & Chemicals',
  'Wheels & Tires',
  'Tools & Equipment',
  'Other'
]

export const STANDARD_CONDITIONS = ['New', 'Used', 'Refurbished']

export default function NewListingPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [imageUrls, setImageUrls] = useState<string[]>([])

  useEffect(() => {
    createClient().auth.getUser().then(({ data }) => {
      if (data.user) setUserId(data.user.id)
    })
  }, [])
  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '',
    stock_quantity: '1',
    category: '',
    condition: 'New',
    carMake: '',
    carModel: '',
    carYear: '',
    street: '',
    city: '',
    state: '',
  })

  function update(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm({ ...form, [field]: e.target.value })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { toast('Not authenticated', 'error'); setSaving(false); return }

    // Build compatible_cars string
    const compatibleCars: string[] = []
    if (form.carMake && form.carModel) {
      const carString = form.carYear 
        ? `${form.carMake} ${form.carModel} ${form.carYear}`
        : `${form.carMake} ${form.carModel}`
      compatibleCars.push(carString)
    }

    const { error } = await supabase.from('products').insert({
      seller_id: user.id,
      name: form.name,
      description: form.description || null,
      price: parseFloat(form.price),
      stock_quantity: parseInt(form.stock_quantity),
      category: form.category || null,
      condition: form.condition,
      brand: form.carMake || null,
      compatible_cars: compatibleCars,
      images: imageUrls,
      street: form.street || null,
      city: form.city || null,
      state: form.state || null,
      is_active: true,
    })

    if (error) { toast(error.message, 'error'); setSaving(false); return }
    toast('Listing created!', 'success')
    router.push('/marketplace')
  }

  const availableModels = form.carMake ? (CAR_MODELS[form.carMake] || []) : []

  return (
    <>
      <Toaster />
      <div className="container section" style={{ maxWidth: 680 }}>
        <div className="page-header">
          <h1 className="page-title">New Listing</h1>
          <p className="page-subtitle">Add a spare part for sale</p>
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
          <Input label="Product name *" value={form.name} onChange={update('name')} required />
          <div className="input-group">
            <label className="input-label">Description</label>
            <textarea className="input" rows={4} value={form.description} onChange={update('description')} placeholder="Describe the part, condition, etc." style={{ resize: 'vertical' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--space-4)' }}>
            <Input label="Price (₦) *" type="number" min="0" step="0.01" value={form.price} onChange={update('price')} required />
            <Input label="Stock quantity *" type="number" min="1" value={form.stock_quantity} onChange={update('stock_quantity')} required />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--space-4)' }}>
            <div className="input-group">
              <label className="input-label">Category</label>
              <select className="input" value={form.category} onChange={update('category')}>
                <option value="">Select category...</option>
                {STANDARD_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div className="input-group">
              <label className="input-label">Condition</label>
              <select className="input" value={form.condition} onChange={update('condition')}>
                {STANDARD_CONDITIONS.map((cond) => (
                  <option key={cond} value={cond}>{cond}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Car compatibility dropdowns */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--space-4)' }}>
            <div className="input-group">
              <label className="input-label">Car Make</label>
              <select
                className="input"
                value={form.carMake}
                onChange={update('carMake')}
              >
                <option value="">Select make...</option>
                {CAR_MAKES.map((make) => (
                  <option key={make} value={make}>{make}</option>
                ))}
              </select>
            </div>
            <div className="input-group">
              <label className="input-label">Car Model</label>
              <select
                className="input"
                value={form.carModel}
                onChange={update('carModel')}
                disabled={!form.carMake}
              >
                <option value="">Select model...</option>
                {availableModels.map((model) => (
                  <option key={model} value={model}>{model}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="input-group">
            <label className="input-label">Car Year (optional)</label>
            <select
              className="input"
              value={form.carYear}
              onChange={update('carYear')}
            >
              <option value="">All years</option>
              {CAR_YEARS.map((year) => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>

          <h3 style={{ marginTop: 'var(--space-6)', marginBottom: 'var(--space-4)', fontSize: '1.1rem' }}>
            Location
          </h3>
          <div className="form-group">
            <Input label="Street Address" value={form.street} onChange={update('street')} placeholder="e.g. 123 Main St" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--space-4)' }}>
            <Input label="City *" value={form.city} onChange={update('city')} required placeholder="e.g. Lagos" />
            <Input label="State *" value={form.state} onChange={update('state')} required placeholder="e.g. Lagos State" />
          </div>

          <h3 style={{ marginTop: 'var(--space-6)', marginBottom: 'var(--space-4)', fontSize: '1.1rem' }}>
            Photos
          </h3>

          {userId && (
            <ImageUploadGrid
              bucket="products"
              userId={userId}
              maxImages={5}
              uploadedUrls={imageUrls}
              onUrlsChange={setImageUrls}
              label="Product Photos"
            />
          )}

          <div style={{ display: 'flex', gap: 'var(--space-4)' }}>
            <Button type="button" variant="ghost" onClick={() => router.back()}>Cancel</Button>
            <Button type="submit" loading={saving} size="lg">Publish Listing</Button>
          </div>
        </form>
      </div>
    </>
  )
}
