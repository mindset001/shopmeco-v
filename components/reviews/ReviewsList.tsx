'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from '@/components/ui/Toaster'
import RatingStars from '@/components/ui/RatingStars'
import { formatDate } from '@/lib/utils/helpers'

interface Review {
  id: string
  rating: number
  comment: string | null
  created_at: string
  reviewer?: { full_name: string | null; avatar_url?: string | null } | null
}

export default function ReviewsList({
  reviews,
  canModerate = false,
  emptyTitle = 'No reviews yet',
  emptyDesc = 'Be the first to leave a review.',
}: {
  reviews: Review[]
  canModerate?: boolean
  emptyTitle?: string
  emptyDesc?: string
}) {
  const router = useRouter()
  const [deletingId, setDeletingId] = useState<string | null>(null)

  async function handleDelete(reviewId: string) {
    const confirmed = window.confirm('Delete this review? This cannot be undone.')
    if (!confirmed) return
    setDeletingId(reviewId)
    const supabase = createClient()
    const { error } = await supabase.from('reviews').delete().eq('id', reviewId)
    if (error) {
      toast(error.message, 'error')
    } else {
      toast('Review deleted.', 'info')
      router.refresh()
    }
    setDeletingId(null)
  }

  if (!reviews || reviews.length === 0) {
    return (
      <div className="empty-state" style={{ padding: 'var(--space-8)' }}>
        <div className="empty-state__title">{emptyTitle}</div>
        <div className="empty-state__desc">{emptyDesc}</div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      {reviews.map((rev) => (
        <div key={rev.id} className="card" style={{ padding: 'var(--space-5)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-2)', gap: 'var(--space-3)' }}>
            <span style={{ fontWeight: 600 }}>{rev.reviewer?.full_name ?? 'Customer'}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <RatingStars rating={rev.rating} size={13} />
              <span style={{ fontSize: '0.8rem', color: 'var(--color-text-400)', whiteSpace: 'nowrap' }}>{formatDate(rev.created_at)}</span>
              {canModerate && (
                <button
                  onClick={() => handleDelete(rev.id)}
                  disabled={deletingId === rev.id}
                  className="btn btn--ghost btn--sm"
                  style={{ color: 'var(--color-danger)', padding: '0.2rem 0.5rem' }}
                >
                  Delete
                </button>
              )}
            </div>
          </div>
          {rev.comment && <p style={{ color: 'var(--color-text-300)', fontSize: '0.9rem', lineHeight: 1.6, margin: 0 }}>{rev.comment}</p>}
        </div>
      ))}
    </div>
  )
}
