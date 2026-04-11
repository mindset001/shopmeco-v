'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from '@/components/ui/Toaster'

const STARS = [1, 2, 3, 4, 5]

export default function ReviewForm({
  repairerId,
  reviewerId,
}: {
  repairerId: string
  reviewerId: string
}) {
  const router = useRouter()
  const [rating, setRating] = useState(0)
  const [hovered, setHovered] = useState(0)
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (rating === 0) { toast('Please select a star rating.', 'error'); return }
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.from('reviews').insert({
      repairer_id: repairerId,
      reviewer_id: reviewerId,
      rating,
      comment: comment.trim() || null,
    })
    if (error) {
      toast(error.message, 'error')
    } else {
      toast('Review submitted!', 'success')
      setSubmitted(true)
      router.refresh()
    }
    setLoading(false)
  }

  if (submitted) {
    return (
      <div className="card" style={{ padding: 'var(--space-6)', textAlign: 'center' }}>
        <div style={{ fontSize: '2rem', marginBottom: 8 }}>⭐</div>
        <div style={{ fontWeight: 700 }}>Thanks for your review!</div>
      </div>
    )
  }

  const display = hovered || rating

  return (
    <div className="card" style={{ padding: 'var(--space-6)' }}>
      <h3 style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: 'var(--space-4)' }}>
        Leave a Review
      </h3>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        {/* Star picker */}
        <div className="form-group">
          <label className="form-label">Rating</label>
          <div style={{ display: 'flex', gap: 6 }}>
            {STARS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setRating(s)}
                onMouseEnter={() => setHovered(s)}
                onMouseLeave={() => setHovered(0)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '1.75rem',
                  lineHeight: 1,
                  color: s <= display ? '#f59e0b' : 'var(--color-surface-600)',
                  transition: 'color 0.1s',
                  padding: 2,
                }}
                aria-label={`${s} star${s > 1 ? 's' : ''}`}
              >
                ★
              </button>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Comment <span style={{ color: 'var(--color-text-400)', fontWeight: 400 }}>(optional)</span></label>
          <textarea
            className="form-input"
            rows={3}
            placeholder="Share your experience…"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            style={{ resize: 'vertical' }}
          />
        </div>

        <button
          type="submit"
          className="btn btn--primary btn--md"
          disabled={loading || rating === 0}
          style={{ alignSelf: 'flex-start' }}
        >
          {loading ? 'Submitting…' : 'Submit Review'}
        </button>
      </form>
    </div>
  )
}
