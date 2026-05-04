import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { getCurrentProfile } from '@/lib/utils/profile'
import { createClient } from '@/lib/supabase/server'
import Badge from '@/components/ui/Badge'
import BookingActions from '../BookingActions'
import DisputeButton from '@/components/ui/DisputeButton'
import { formatDate } from '@/lib/utils/helpers'
import type { BookingStatus } from '@/types'

const statusVariant: Record<BookingStatus, 'default' | 'warning' | 'success' | 'danger' | 'info'> = {
  pending: 'warning', confirmed: 'info', completed: 'success', cancelled: 'danger',
}

const timeline: BookingStatus[] = ['pending', 'confirmed', 'completed']

export default async function BookingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const profile = await getCurrentProfile()
  if (!profile) redirect('/login')

  const supabase = await createClient()

  const { data: booking } = await supabase
    .from('bookings')
    .select('*, repairer:profiles!bookings_repairer_id_fkey(id, full_name, phone, city, state, avatar_url), customer:profiles!bookings_customer_id_fkey(id, full_name, phone, city)')
    .eq('id', id)
    .single()

  if (!booking) notFound()

  const canView = profile.id === booking.repairer_id || profile.id === booking.customer_id || profile.role === 'admin'
  if (!canView) redirect('/bookings')

  const isRepairer = profile.id === booking.repairer_id
  const other = isRepairer ? booking.customer : booking.repairer

  // Check if customer already reviewed this repairer
  let hasReviewed = false
  if (!isRepairer && booking.status === 'completed') {
    const { data: existing } = await supabase
      .from('reviews')
      .select('id')
      .eq('repairer_id', booking.repairer_id)
      .eq('reviewer_id', profile.id)
      .maybeSingle()
    hasReviewed = !!existing
  }

  return (
    <div className="animate-fade-in">
      {/* Back + header */}
      <div className="page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <Link href="/bookings" className="btn btn--ghost btn--sm" style={{ marginBottom: 8 }}>
            ← Back to Bookings
          </Link>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            Booking Details
            <Badge variant={statusVariant[booking.status as BookingStatus]}>{booking.status}</Badge>
          </h1>
          <p className="page-subtitle" style={{ fontFamily: 'monospace', fontSize: '0.8125rem' }}>
            {booking.id}
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-300)' }}>
            Scheduled for
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>
            {formatDate(booking.scheduled_date)}
          </div>
          <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-300)', marginTop: 4 }}>
            Requested {formatDate(booking.created_at)}
          </div>
          {!isRepairer && (
            <div style={{ marginTop: 8, display: 'flex', justifyContent: 'flex-end' }}>
              <DisputeButton
                customerId={profile.id}
                serviceProviderId={booking.repairer_id}
                relatedType="booking"
                relatedId={booking.id}
              />
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
        {/* Other party */}
        <div className="card">
          <h2 style={{ fontWeight: 700, marginBottom: 16, fontSize: '1rem' }}>
            {isRepairer ? 'Customer' : 'Repairer'}
          </h2>
          <dl style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '8px 16px' }}>
            <dt style={{ color: 'var(--color-text-300)', fontSize: '0.8125rem' }}>Name</dt>
            <dd style={{ margin: 0, fontWeight: 500, fontSize: '0.875rem' }}>{other?.full_name ?? '—'}</dd>
            {other?.phone && (
              <>
                <dt style={{ color: 'var(--color-text-300)', fontSize: '0.8125rem' }}>Phone</dt>
                <dd style={{ margin: 0, fontWeight: 500, fontSize: '0.875rem' }}>{other.phone}</dd>
              </>
            )}
            {other?.city && (
              <>
                <dt style={{ color: 'var(--color-text-300)', fontSize: '0.8125rem' }}>City</dt>
                <dd style={{ margin: 0, fontWeight: 500, fontSize: '0.875rem' }}>
                  {other.city}{(other as any).state ? `, ${(other as any).state}` : ''}
                </dd>
              </>
            )}
          </dl>
          <div style={{ marginTop: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Link
              href={`/chat?with=${isRepairer ? booking.customer_id : booking.repairer_id}`}
              className="btn btn--ghost btn--sm"
            >
              💬 Message
            </Link>
            {!isRepairer && (
              <Link href={`/repairers/${booking.repairer_id}`} className="btn btn--ghost btn--sm">
                View Profile
              </Link>
            )}
          </div>
        </div>

        {/* Description */}
        <div className="card">
          <h2 style={{ fontWeight: 700, marginBottom: 16, fontSize: '1rem' }}>Description</h2>
          <p style={{ fontSize: '0.9rem', lineHeight: 1.7, color: 'var(--color-text-200)' }}>
            {booking.description}
          </p>
        </div>
      </div>

      {/* Status timeline */}
      {booking.status !== 'cancelled' && (
        <div className="card" style={{ marginTop: 20 }}>
          <h2 style={{ fontWeight: 700, marginBottom: 16, fontSize: '1rem' }}>Status</h2>
          <div style={{ display: 'flex' }}>
            {timeline.map((step, i) => {
              const currentIdx = timeline.indexOf(booking.status as BookingStatus)
              const isDone = i < currentIdx
              const isActive = i === currentIdx
              const isLast = i === timeline.length - 1
              return (
                <div key={step} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, position: 'relative' }}>
                  {!isLast && (
                    <div style={{
                      position: 'absolute', top: 7, left: '50%', right: '-50%', height: 2,
                      background: isDone ? 'var(--color-success)' : 'var(--color-surface-600)', zIndex: 0,
                    }} />
                  )}
                  <div style={{
                    width: 16, height: 16, borderRadius: '50%', zIndex: 1, flexShrink: 0,
                    background: isDone ? 'var(--color-success)' : isActive ? 'var(--color-accent)' : 'var(--color-surface-600)',
                    border: isActive ? '2px solid var(--color-accent)' : '2px solid transparent',
                  }} />
                  <div style={{ fontSize: '0.75rem', textTransform: 'capitalize', color: isActive ? 'var(--color-text-100)' : isDone ? 'var(--color-success)' : 'var(--color-text-400)', fontWeight: isActive ? 700 : 400 }}>
                    {step}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Actions */}
      <BookingActions bookingId={booking.id} currentStatus={booking.status} isRepairer={isRepairer} />

      {/* Review prompt — shown to car_owner after completion */}
      {!isRepairer && booking.status === 'completed' && (
        <div className="card" style={{ marginTop: 20, padding: 'var(--space-6)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          {hasReviewed ? (
            <>
              <div>
                <div style={{ fontWeight: 700, marginBottom: 4 }}>✅ You reviewed this repairer</div>
                <div style={{ fontSize: '0.875rem', color: 'var(--color-text-300)' }}>Thanks for your feedback.</div>
              </div>
              <Link href={`/repairers/${booking.repairer_id}`} className="btn btn--ghost btn--sm">
                View Profile
              </Link>
            </>
          ) : (
            <>
              <div>
                <div style={{ fontWeight: 700, marginBottom: 4 }}>⭐ Leave a review</div>
                <div style={{ fontSize: '0.875rem', color: 'var(--color-text-300)' }}>
                  How was your experience with {booking.repairer?.full_name}?
                </div>
              </div>
              <Link href={`/repairers/${booking.repairer_id}#review`} className="btn btn--primary btn--sm">
                Write a Review
              </Link>
            </>
          )}
        </div>
      )}
    </div>
  )
}
