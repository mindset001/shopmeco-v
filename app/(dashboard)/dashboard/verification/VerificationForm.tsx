'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from '@/components/ui/Toaster'
import Toaster from '@/components/ui/Toaster'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import ImageUploadGrid from '@/components/ui/ImageUploadGrid'
import { ShieldCheck, AlertCircle } from 'lucide-react'

interface Props {
  userId: string
  existingVerification?: any
}

export default function VerificationForm({ userId, existingVerification }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [imageUrls, setImageUrls] = useState<string[]>(
    existingVerification?.id_image_url ? [existingVerification.id_image_url] : []
  )
  const [form, setForm] = useState({
    id_type: existingVerification?.id_type || '',
    id_number: existingVerification?.id_number || '',
  })

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  const isPending = existingVerification?.status === 'pending'
  const isApproved = existingVerification?.status === 'approved'
  const isRejected = existingVerification?.status === 'rejected'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.id_type || !form.id_number) {
      toast('Please fill all required fields', 'error')
      return
    }
    if (imageUrls.length === 0) {
      toast('Please upload an image of your ID', 'error')
      return
    }

    setLoading(true)
    const supabase = createClient()

    const dataObj = {
      user_id: userId,
      id_type: form.id_type,
      id_number: form.id_number,
      id_image_url: imageUrls[0],
      status: 'pending',
    }

    let error
    if (existingVerification) {
      const res = await supabase.from('id_verifications').update(dataObj).eq('id', existingVerification.id)
      error = res.error
    } else {
      const res = await supabase.from('id_verifications').insert(dataObj)
      error = res.error
    }

    if (error) {
      toast(error.message, 'error')
      setLoading(false)
      return
    }

    toast('Verification request submitted successfully!', 'success')
    router.refresh()
    setLoading(false)
  }

  if (isApproved) {
    return (
      <div className="card" style={{ padding: 'var(--space-8)', textAlign: 'center' }}>
        <ShieldCheck size={48} style={{ margin: '0 auto var(--space-4)', color: 'var(--color-success)' }} />
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: 'var(--space-2)' }}>Identity Verified</h2>
        <p style={{ color: 'var(--color-text-300)' }}>Your identity has been successfully verified by our team. Your profile now features a verified badge.</p>
      </div>
    )
  }

  return (
    <>
      <Toaster />
      <div className="card" style={{ maxWidth: 640 }}>
        <div style={{ padding: 'var(--space-6)', borderBottom: '1px solid var(--color-border)' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: 4 }}>Identity Verification (KYC)</h2>
          <p style={{ color: 'var(--color-text-300)', fontSize: '0.9rem' }}>
            To build trust in the ShopMecko community, all repairers and sellers must submit a valid government ID.
          </p>
        </div>

        {isPending && (
          <div style={{ padding: 'var(--space-4) var(--space-6)', background: 'color-mix(in srgb, var(--color-warning) 10%, transparent)', borderBottom: '1px solid color-mix(in srgb, var(--color-warning) 20%, transparent)', display: 'flex', gap: 12, alignItems: 'center' }}>
            <AlertCircle style={{ color: 'var(--color-warning)' }} size={20} />
            <div>
              <div style={{ fontWeight: 600, color: 'var(--color-warning)' }}>Review Pending</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--color-text-200)' }}>Your submission is currently being reviewed by our admin team.</div>
            </div>
          </div>
        )}

        {isRejected && (
          <div style={{ padding: 'var(--space-4) var(--space-6)', background: 'color-mix(in srgb, var(--color-danger) 10%, transparent)', borderBottom: '1px solid color-mix(in srgb, var(--color-danger) 20%, transparent)', display: 'flex', gap: 12, alignItems: 'center' }}>
            <AlertCircle style={{ color: 'var(--color-danger)' }} size={20} />
            <div>
              <div style={{ fontWeight: 600, color: 'var(--color-danger)' }}>Verification Rejected</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--color-text-200)' }}>
                Reason: {existingVerification.rejection_reason || 'Invalid or blurry document.'} Please submit again.
              </div>
            </div>
          </div>
        )}

        <div style={{ padding: 'var(--space-6)' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
            <div className="form-group">
              <label className="form-label">ID Type *</label>
              <select
                className="input"
                value={form.id_type}
                onChange={(e) => set('id_type', e.target.value)}
                required
                disabled={isPending}
              >
                <option value="">Select ID Type</option>
                <option value="NIN">National Identity Number (NIN) Slip</option>
                <option value="Driver License">Driver's License</option>
                <option value="Passport">International Passport</option>
                <option value="Voter Card">Voter's Card (INEC)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">ID Number *</label>
              <Input
                placeholder="Enter the document number"
                value={form.id_number}
                onChange={(e) => set('id_number', e.target.value)}
                required
                disabled={isPending}
              />
            </div>

            <ImageUploadGrid
              bucket="verifications"
              userId={userId}
              maxImages={1}
              uploadedUrls={imageUrls}
              onUrlsChange={setImageUrls}
              label="Upload ID Photo"
            />
            {isPending && <p style={{ fontSize: '0.8rem', color: 'var(--color-text-400)', marginTop: '-1rem' }}>You cannot change the image while review is pending.</p>}

            {!isPending && (
              <Button type="submit" loading={loading} size="lg" style={{ marginTop: 'var(--space-4)' }}>
                Submit for Verification
              </Button>
            )}
          </form>
        </div>
      </div>
    </>
  )
}
