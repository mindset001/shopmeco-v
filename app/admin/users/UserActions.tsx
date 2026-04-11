'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from '@/components/ui/Toaster'

type Action = 'delete' | 'verify' | 'unverify' | 'suspend' | 'unsuspend'

export default function UserActions({
  userId,
  isVerified,
  isSuspended,
}: {
  userId: string
  isVerified: boolean
  isSuspended: boolean
}) {
  const router = useRouter()
  const [loading, setLoading] = useState<Action | null>(null)

  async function runAction(action: Action, confirmMsg?: string) {
    if (confirmMsg && !confirm(confirmMsg)) return
    setLoading(action)
    const res = await fetch('/api/admin/user-action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, action }),
    })
    const json = await res.json()
    if (!res.ok) { toast(json.error ?? 'Failed', 'error') }
    else { toast('Done.', 'success'); router.refresh() }
    setLoading(null)
  }

  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      {/* Verify / Unverify */}
      {!isVerified ? (
        <button
          className="btn btn--success btn--sm"
          onClick={() => runAction('verify')}
          disabled={!!loading}
        >
          {loading === 'verify' ? '…' : 'Verify'}
        </button>
      ) : (
        <button
          className="btn btn--ghost btn--sm"
          onClick={() => runAction('unverify')}
          disabled={!!loading}
        >
          {loading === 'unverify' ? '…' : 'Unverify'}
        </button>
      )}

      {/* Suspend / Unsuspend */}
      {!isSuspended ? (
        <button
          className="btn btn--secondary btn--sm"
          onClick={() => runAction('suspend', 'Suspend this user? They will be blocked from logging in.')}
          disabled={!!loading}
        >
          {loading === 'suspend' ? '…' : 'Suspend'}
        </button>
      ) : (
        <button
          className="btn btn--secondary btn--sm"
          style={{ color: 'var(--color-accent)' }}
          onClick={() => runAction('unsuspend')}
          disabled={!!loading}
        >
          {loading === 'unsuspend' ? '…' : 'Activate'}
        </button>
      )}

      {/* Delete */}
      <button
        className="btn btn--danger btn--sm"
        onClick={() => runAction('delete', 'Permanently delete this user and all their data? This cannot be undone.')}
        disabled={!!loading}
      >
        {loading === 'delete' ? '…' : 'Delete'}
      </button>
    </div>
  )
}

