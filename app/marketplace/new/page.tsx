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
    brand: '',
    compatible_cars: '',
  })

  function update(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm({ ...form, [field]: e.target.value })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { toast('Not authenticated', 'error'); setSaving(false); return }

    const { error } = await supabase.from('products').insert({
      seller_id: user.id,
      name: form.name,
      description: form.description || null,
      price: parseFloat(form.price),
      stock_quantity: parseInt(form.stock_quantity),
      category: form.category || null,
      brand: form.brand || null,
      compatible_cars: form.compatible_cars.split(',').map((s) => s.trim()).filter(Boolean),
      images: imageUrls,
      is_active: true,
    })

    if (error) { toast(error.message, 'error'); setSaving(false); return }
    toast('Listing created!', 'success')
    router.push('/marketplace')
  }

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
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
            <Input label="Price (₦) *" type="number" min="0" step="0.01" value={form.price} onChange={update('price')} required />
            <Input label="Stock quantity *" type="number" min="1" value={form.stock_quantity} onChange={update('stock_quantity')} required />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
            <Input label="Category" value={form.category} onChange={update('category')} placeholder="e.g. Engine, Brakes" />
            <Input label="Brand" value={form.brand} onChange={update('brand')} placeholder="e.g. Toyota, Bosch" />
          </div>
          <Input label="Compatible cars (comma-separated)" value={form.compatible_cars} onChange={update('compatible_cars')} placeholder="e.g. Toyota Camry 2018-2022, Honda Accord" />

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
