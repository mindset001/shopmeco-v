'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from '@/components/ui/Toaster'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'

interface Props {
  verificationId: string
  userId: string
  status: string
}

export default function VerificationActions({ verificationId, userId, status }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [rejectReason, setRejectReason] = useState('')

  if (status !== 'pending') return null

  async function handleApprove() {
    if (!confirm('Are you sure you want to approve this verification?')) return
    setLoading(true)
    const supabase = createClient()

    // Update the verification status
    const { error: verifyError } = await supabase
      .from('id_verifications')
      .update({ status: 'approved', verified_at: new Date().toISOString() })
      .eq('id', verificationId)

    if (verifyError) {
      toast(verifyError.message, 'error')
      setLoading(false)
      return
    }

    // Update the user profile
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ is_verified: true })
      .eq('id', userId)

    if (profileError) {
      toast(profileError.message, 'error')
    } else {
      toast('Verification approved successfully!', 'success')
      router.refresh()
    }
    setLoading(false)
  }

  async function handleReject() {
    if (!rejectReason.trim()) {
      toast('Please provide a reason for rejection.', 'error')
      return
    }
    setLoading(true)
    const supabase = createClient()

    const { error } = await supabase
      .from('id_verifications')
      .update({ status: 'rejected', rejection_reason: rejectReason })
      .eq('id', verificationId)

    if (error) {
      toast(error.message, 'error')
    } else {
      toast('Verification rejected.', 'success')
      setShowRejectModal(false)
      router.refresh()
    }
    setLoading(false)
  }

  return (
    <>
      <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
        <Button size="sm" variant="primary" loading={loading} onClick={handleApprove}>Approve</Button>
        <Button size="sm" variant="danger" disabled={loading} onClick={() => setShowRejectModal(true)}>
          Reject
        </Button>
      </div>

      <Modal open={showRejectModal} onClose={() => setShowRejectModal(false)} title="Reject Verification">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <p style={{ fontSize: '0.9rem', color: 'var(--color-text-200)' }}>
            Please provide a reason for rejecting this document. This will be shown to the user.
          </p>
          <textarea
            className="input"
            rows={3}
            placeholder="e.g., Image is blurry, name does not match profile..."
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', marginTop: 'var(--space-2)' }}>
            <Button variant="ghost" onClick={() => setShowRejectModal(false)}>Cancel</Button>
            <Button variant="danger" loading={loading} onClick={handleReject}>Confirm Rejection</Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
