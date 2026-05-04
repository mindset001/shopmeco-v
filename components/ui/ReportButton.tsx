'use client'

import { useState } from 'react'
import { Flag } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from '@/components/ui/Toaster'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'

interface Props {
  reporterId: string
  reportType: 'user' | 'product' | 'review' | 'message'
  reportedUserId?: string
  reportedProductId?: string
  variant?: 'ghost' | 'secondary'
}

export default function ReportButton({ reporterId, reportType, reportedUserId, reportedProductId, variant = 'ghost' }: Props) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [reason, setReason] = useState('')
  const [description, setDescription] = useState('')

  const REASONS = [
    'Inappropriate Content',
    'Scam or Fraud',
    'Harassment',
    'Spam',
    'Offensive Language',
    'Other'
  ]

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!reason) {
      toast('Please select a reason', 'error')
      return
    }

    setLoading(true)
    const supabase = createClient()
    
    const { error } = await supabase.from('reports').insert({
      reporter_id: reporterId,
      report_type: reportType,
      reported_user_id: reportedUserId,
      reported_product_id: reportedProductId,
      reason,
      description
    })

    if (error) {
      toast(error.message, 'error')
    } else {
      toast('Report submitted successfully. Our team will review it.', 'success')
      setOpen(false)
      setReason('')
      setDescription('')
    }
    setLoading(false)
  }

  return (
    <>
      <Button 
        variant={variant} 
        size="sm" 
        onClick={() => setOpen(true)}
        style={{ color: 'var(--color-text-300)', display: 'flex', gap: 6, alignItems: 'center' }}
        title="Report"
      >
        <Flag size={14} /> Report
      </Button>

      <Modal open={open} onClose={() => setOpen(false)} title={`Report ${reportType}`}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <p style={{ fontSize: '0.9rem', color: 'var(--color-text-200)' }}>
            Your report will remain anonymous. Please provide details to help our admin team investigate.
          </p>

          <div className="form-group">
            <label className="form-label">Reason</label>
            <select className="input" value={reason} onChange={e => setReason(e.target.value)} required>
              <option value="">Select a reason</option>
              {REASONS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Additional Details (Optional)</label>
            <textarea
              className="input"
              rows={4}
              placeholder="Provide any specific details..."
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', marginTop: 'var(--space-2)' }}>
            <Button variant="ghost" onClick={() => setOpen(false)} type="button">Cancel</Button>
            <Button variant="danger" loading={loading} type="submit">Submit Report</Button>
          </div>
        </form>
      </Modal>
    </>
  )
}
