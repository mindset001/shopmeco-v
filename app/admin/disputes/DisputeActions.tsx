'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from '@/components/ui/Toaster'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'

interface Props {
  disputeId: string
  currentStatus: string
  resolution: string | null
}

export default function DisputeActions({ disputeId, currentStatus, resolution }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [openResolveModal, setOpenResolveModal] = useState(false)
  const [resolutionText, setResolutionText] = useState(resolution || '')

  async function handleStatusChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newStatus = e.target.value
    if (newStatus === currentStatus) return
    if (newStatus === 'resolved') {
      setOpenResolveModal(true)
      return
    }
    
    setLoading(true)
    const supabase = createClient()
    
    const { error } = await supabase
      .from('disputes')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', disputeId)

    if (error) {
      toast(error.message, 'error')
    } else {
      toast('Dispute status updated', 'success')
      router.refresh()
    }
    setLoading(false)
  }

  async function handleResolve(e: React.FormEvent) {
    e.preventDefault()
    if (!resolutionText) {
      toast('Please provide a resolution details', 'error')
      return
    }

    setLoading(true)
    const supabase = createClient()
    
    const { error } = await supabase
      .from('disputes')
      .update({ 
        status: 'resolved', 
        resolution: resolutionText,
        resolved_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', disputeId)

    if (error) {
      toast(error.message, 'error')
    } else {
      toast('Dispute resolved successfully', 'success')
      setOpenResolveModal(false)
      router.refresh()
    }
    setLoading(false)
  }

  return (
    <>
      <select 
        className="input" 
        style={{ padding: '0.2rem 0.5rem', fontSize: '0.85rem', height: 'auto', minWidth: 130 }}
        value={currentStatus}
        onChange={handleStatusChange}
        disabled={loading}
      >
        <option value="open">Open</option>
        <option value="in_review">In Review</option>
        <option value="resolved">Resolved</option>
        <option value="closed">Closed</option>
      </select>

      <Modal open={openResolveModal} onClose={() => setOpenResolveModal(false)} title="Resolve Dispute">
        <form onSubmit={handleResolve} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <p style={{ fontSize: '0.9rem', color: 'var(--color-text-200)' }}>
            Enter the details of the resolution. This will be visible to both parties.
          </p>
          <textarea
            className="input"
            rows={5}
            placeholder="e.g. Issued 50% refund to customer..."
            value={resolutionText}
            onChange={(e) => setResolutionText(e.target.value)}
            required
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', marginTop: 'var(--space-2)' }}>
            <Button variant="ghost" onClick={() => setOpenResolveModal(false)} type="button">Cancel</Button>
            <Button variant="primary" loading={loading} type="submit">Mark as Resolved</Button>
          </div>
        </form>
      </Modal>
    </>
  )
}
