'use client'

import { useState } from 'react'
import { ShieldAlert } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from '@/components/ui/Toaster'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'

interface Props {
  customerId: string
  serviceProviderId: string
  relatedType: 'order' | 'booking'
  relatedId: string
}

export default function DisputeButton({ customerId, serviceProviderId, relatedType, relatedId }: Props) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [type, setType] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')

  const TYPES = [
    { value: 'refund_request', label: 'Refund Request' },
    { value: 'quality_issue', label: 'Quality Issue' },
    { value: 'service_incomplete', label: 'Service Incomplete' },
    { value: 'payment_issue', label: 'Payment Issue' },
    { value: 'other', label: 'Other' },
  ]

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!type || !title || !description) {
      toast('Please fill in all fields', 'error')
      return
    }

    setLoading(true)
    const supabase = createClient()
    
    const { error } = await supabase.from('disputes').insert({
      customer_id: customerId,
      service_provider_id: serviceProviderId,
      related_type: relatedType,
      related_id: relatedId,
      type,
      title,
      description
    })

    if (error) {
      toast(error.message, 'error')
    } else {
      toast('Dispute filed successfully. Our admin team will step in shortly.', 'success')
      setOpen(false)
    }
    setLoading(false)
  }

  return (
    <>
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={() => setOpen(true)}
        style={{ color: 'var(--color-danger)', display: 'flex', gap: 6, alignItems: 'center', borderColor: 'rgba(239, 68, 68, 0.3)' }}
      >
        <ShieldAlert size={14} /> File a Dispute
      </Button>

      <Modal open={open} onClose={() => setOpen(false)} title="File a Dispute">
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <p style={{ fontSize: '0.9rem', color: 'var(--color-text-200)' }}>
            Opening a dispute will notify our admin team to step in. Escrow payments will remain locked until the dispute is resolved.
          </p>

          <div className="form-group">
            <label className="form-label">Dispute Type *</label>
            <select className="input" value={type} onChange={e => setType(e.target.value)} required>
              <option value="">Select type</option>
              {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Title *</label>
            <input
              type="text"
              className="input"
              placeholder="Brief summary of the issue"
              value={title}
              onChange={e => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Detailed Description *</label>
            <textarea
              className="input"
              rows={5}
              placeholder="Provide all relevant details..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', marginTop: 'var(--space-2)' }}>
            <Button variant="ghost" onClick={() => setOpen(false)} type="button">Cancel</Button>
            <Button variant="danger" loading={loading} type="submit">Submit Dispute</Button>
          </div>
        </form>
      </Modal>
    </>
  )
}
