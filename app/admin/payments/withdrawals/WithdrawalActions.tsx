'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from '@/components/ui/Toaster'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'

interface Props {
  requestId: string
  userId: string
  amount: number
  currentStatus: string
}

export default function WithdrawalActions({ requestId, userId, amount, currentStatus }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [rejectReason, setRejectReason] = useState('')

  if (currentStatus === 'completed' || currentStatus === 'rejected') return null

  async function handleApprove() {
    if (!confirm('Are you sure you want to approve this withdrawal? This will deduct the balance from the user.')) return
    
    setLoading(true)
    // Needs to go through an API route to safely use the Admin Client
    const res = await fetch('/api/admin/payments/withdrawals/approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ request_id: requestId, user_id: userId, amount })
    })
    const data = await res.json()
    
    if (!res.ok) {
      toast(data.error ?? 'Failed to approve withdrawal', 'error')
    } else {
      toast('Withdrawal approved and balance deducted. You can now transfer the funds.', 'success')
      router.refresh()
    }
    setLoading(false)
  }

  async function handleComplete() {
    if (!confirm('Have you actually transferred the funds to their bank account?')) return
    
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase
      .from('withdrawal_requests')
      .update({ status: 'completed' })
      .eq('id', requestId)
      
    if (error) {
      toast(error.message, 'error')
    } else {
      toast('Marked as Completed!', 'success')
      router.refresh()
    }
    setLoading(false)
  }

  async function handleReject() {
    if (!rejectReason) {
      toast('Please provide a reason', 'error')
      return
    }

    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase
      .from('withdrawal_requests')
      .update({ status: 'rejected', reason: rejectReason })
      .eq('id', requestId)
      
    if (error) {
      toast(error.message, 'error')
    } else {
      toast('Request rejected.', 'success')
      setShowRejectModal(false)
      router.refresh()
    }
    setLoading(false)
  }

  return (
    <>
      <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
        {currentStatus === 'pending' && (
          <>
            <Button size="sm" variant="primary" loading={loading} onClick={handleApprove}>Approve</Button>
            <Button size="sm" variant="danger" disabled={loading} onClick={() => setShowRejectModal(true)}>Reject</Button>
          </>
        )}
        {currentStatus === 'approved' && (
          <Button size="sm" variant="primary" loading={loading} onClick={handleComplete}>Mark Paid</Button>
        )}
      </div>

      <Modal open={showRejectModal} onClose={() => setShowRejectModal(false)} title="Reject Withdrawal">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <p style={{ fontSize: '0.9rem', color: 'var(--color-text-200)' }}>
            Provide a reason for rejection. This will be shown to the user.
          </p>
          <textarea
            className="input"
            rows={3}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="e.g. Invalid bank details"
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)' }}>
            <Button variant="ghost" onClick={() => setShowRejectModal(false)}>Cancel</Button>
            <Button variant="danger" loading={loading} onClick={handleReject}>Reject</Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
