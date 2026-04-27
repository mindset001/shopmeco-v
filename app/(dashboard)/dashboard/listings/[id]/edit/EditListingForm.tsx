'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from '@/components/ui/Toaster'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import ImageUploadGrid from '@/components/ui/ImageUploadGrid'
import { CAR_MAKES, CAR_MODELS, CAR_YEARS } from '@/lib/data/cars'
import { STANDARD_CATEGORIES, STANDARD_CONDITIONS } from '@/app/marketplace/new/page'

interface Props {
  product: any
}

export default function EditListingForm({ product }: Props) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [imageUrls, setImageUrls] = useState<string[]>(product.images || [])

  // Parse compatible_cars back into make, model, year (rudimentary)
  const firstCar = product.compatible_cars?.[0] || ''
  const parts = firstCar.split(' ')
  const initialMake = CAR_MAKES.find(m => parts.includes(m)) || ''
  const initialModel = CAR_MODELS[initialMake]?.find(m => parts.includes(m)) || ''
  const initialYear = CAR_YEARS.find(y => parts.includes(y.toString()))?.toString() || ''

  const [form, setForm] = useState({
    name: product.name || '',
    description: product.description || '',
    price: product.price?.toString() || '',
    stock_quantity: product.stock_quantity?.toString() || '1',
    category: product.category || '',
    condition: product.condition || 'New',
    carMake: product.brand || initialMake,
    carModel: initialModel,
    carYear: initialYear,
    street: product.street || '',
    city: product.city || '',
    state: product.state || '',
    is_active: product.is_active,
  })

  function update(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      setForm((prev) => ({ ...prev, [field]: e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value }))
    }
  }

  const availableModels = form.carMake ? (CAR_MODELS[form.carMake as keyof typeof CAR_MODELS] || []) : []

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name || !form.price || !form.stock_quantity || !form.city || !form.state) {
      toast('Please fill all required fields', 'error')
      return
    }

    setSaving(true)
    const supabase = createClient()

    const compatibleCars: string[] = []
    if (form.carMake && form.carModel) {
      const carString = form.carYear 
        ? `${form.carMake} ${form.carModel} ${form.carYear}`
        : `${form.carMake} ${form.carModel}`
      compatibleCars.push(carString)
    }

    const { error } = await supabase
      .from('products')
      .update({
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
        is_active: form.is_active,
      })
      .eq('id', product.id)

    setSaving(false)

    if (error) {
      toast(error.message, 'error')
      return
    }

    toast('Listing updated successfully!', 'success')
    router.push('/dashboard/listings')
    router.refresh()
  }

  async function handleDelete() {
    if (!confirm('Are you sure you want to delete this listing? This action cannot be undone.')) return
    
    setDeleting(true)
    const supabase = createClient()
    const { error } = await supabase.from('products').delete().eq('id', product.id)
    setDeleting(false)

    if (error) {
      toast(error.message, 'error')
      return
    }

    toast('Listing deleted successfully', 'success')
    router.push('/dashboard/listings')
    router.refresh()
  }

  return (
    <div className="card" style={{ padding: 'var(--space-6)' }}>
      <form onSubmit={handleSubmit}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)' }}>
          <h3 style={{ fontSize: '1.1rem', margin: 0 }}>Product Details</h3>
          <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', cursor: 'pointer' }}>
            <input 
              type="checkbox" 
              checked={form.is_active} 
              onChange={(e) => setForm(f => ({ ...f, is_active: e.target.checked }))} 
            />
            <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Listing is Active</span>
          </label>
        </div>

        <div className="form-group">
          <Input label="Product Name *" value={form.name} onChange={update('name')} required placeholder="e.g. Brake Pads for Toyota Camry" />
        </div>
        <div className="form-group">
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
              <option value="">Any Make</option>
              {CAR_MAKES.map((m) => <option key={m} value={m}>{m}</option>)}
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
              <option value="">Any Model</option>
              {availableModels.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div className="input-group">
            <label className="input-label">Year (optional)</label>
            <select
              className="input"
              value={form.carYear}
              onChange={update('carYear')}
            >
              <option value="">All years</option>
              {CAR_YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
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

        <ImageUploadGrid
          bucket="products"
          userId={product.seller_id}
          maxImages={5}
          uploadedUrls={imageUrls}
          onUrlsChange={setImageUrls}
          label="Product Photos"
        />

        <div style={{ display: 'flex', gap: 'var(--space-4)', justifyContent: 'space-between', marginTop: 'var(--space-8)' }}>
          <Button type="button" variant="danger" disabled={saving} loading={deleting} onClick={handleDelete}>
            Delete Listing
          </Button>
          <div style={{ display: 'flex', gap: 'var(--space-4)' }}>
            <Button type="button" variant="ghost" onClick={() => router.back()}>Cancel</Button>
            <Button type="submit" loading={saving} size="lg">Save Changes</Button>
          </div>
        </div>
      </form>
    </div>
  )
}
