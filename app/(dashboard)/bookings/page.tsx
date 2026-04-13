import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getCurrentProfile } from '@/lib/utils/profile'
import { createClient } from '@/lib/supabase/server'
import Badge from '@/components/ui/Badge'
import BookingActions from './BookingActions'
import { formatDate } from '@/lib/utils/helpers'
import type { BookingStatus } from '@/types'

const statusVariant: Record<BookingStatus, 'default' | 'warning' | 'success' | 'danger' | 'info'> = {
  pending: 'warning',
  confirmed: 'info',
  completed: 'success',
  cancelled: 'danger',
}

export default async function BookingsPage() {
  const profile = await getCurrentProfile()
  if (!profile) redirect('/login')
  if (profile.role === 'parts_seller') redirect('/dashboard')

  const supabase = await createClient()
  const isRepairer = profile.role === 'repairer'

  const { data: bookings } = await supabase
    .from('bookings')
    .select(
      isRepairer
        ? '*, customer:profiles!bookings_customer_id_fkey(id, full_name, avatar_url, phone)'
        : '*, repairer:profiles!bookings_repairer_id_fkey(id, full_name, avatar_url, city)'
    )
    .eq(isRepairer ? 'repairer_id' : 'customer_id', profile.id)
    .order('scheduled_date', { ascending: false })

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">{isRepairer ? 'Booking Requests' : 'My Bookings'}</h1>
        <p className="page-subtitle">
          {bookings?.length ?? 0} {isRepairer ? 'incoming bookings' : 'bookings made'}
        </p>
      </div>

      {!isRepairer && (
        <div style={{ marginBottom: 'var(--space-6)' }}>
          <Link href="/repairers" className="btn btn--primary btn--md">
            + Book a Repairer
          </Link>
        </div>
      )}

      {bookings && bookings.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {(bookings as any[]).map((b) => {
            const other = isRepairer ? b.customer : b.repairer
            return (
              <div key={b.id} className="card" style={{ padding: 'var(--space-6)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 4 }}>
                      {isRepairer ? `Request from ${other?.full_name ?? '—'}` : `Booking with ${other?.full_name ?? '—'}`}
                    </div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--color-text-300)', marginBottom: 2 }}>
                      📅 {formatDate(b.scheduled_date)} &nbsp;·&nbsp; Requested {formatDate(b.created_at)}
                    </div>
                    {isRepairer && other?.phone && (
                      <div style={{ fontSize: '0.875rem', color: 'var(--color-text-300)', marginBottom: 2 }}>
                        📞 {other.phone}
                      </div>
                    )}
                    {!isRepairer && other?.city && (
                      <div style={{ fontSize: '0.875rem', color: 'var(--color-text-300)', marginBottom: 2 }}>
                        📍 {other.city}
                      </div>
                    )}
                    {b.agreed_price && (
                      <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--color-accent)', marginTop: 4 }}>
                        Agreed price: ₦{Number(b.agreed_price).toLocaleString()}
                        {b.payment_status === 'in_escrow' && <span style={{ marginLeft: 8, color: 'var(--color-success)', fontWeight: 400, fontSize: '0.8rem' }}>· In escrow</span>}
                        {b.payment_status === 'released' && <span style={{ marginLeft: 8, color: 'var(--color-success)', fontWeight: 400, fontSize: '0.8rem' }}>· Released</span>}
                      </div>
                    )}
                  </div>
                  <Badge variant={statusVariant[b.status as BookingStatus]}>
                    {b.status}
                  </Badge>
                </div>

                <div style={{ marginTop: 12, padding: '12px 14px', background: 'var(--color-surface-800)', borderRadius: 'var(--radius-md)', fontSize: '0.9rem', lineHeight: 1.6, color: 'var(--color-text-200)' }}>
                  {b.description}
                </div>

                <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                  <Link
                    href={`/chat?with=${isRepairer ? b.customer_id : b.repairer_id}`}
                    className="btn btn--ghost btn--sm"
                  >
                    💬 Message
                  </Link>
                  <BookingActions
                    bookingId={b.id}
                    currentStatus={b.status}
                    isRepairer={isRepairer}
                    agreedPrice={b.agreed_price}
                    paymentStatus={b.payment_status}
                  />
                  <Link href={`/bookings/${b.id}`} className="btn btn--ghost btn--sm" style={{ marginLeft: 'auto' }}>
                    View Details →
                  </Link>
                </div>
                {!isRepairer && b.status === 'completed' && (
                  <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                    <span style={{ fontSize: '0.875rem', color: 'var(--color-text-300)' }}>⭐ Rate your experience with {other?.full_name}</span>
                    <Link href={`/repairers/${b.repairer_id}#review`} className="btn btn--primary btn--sm">
                      Leave a Review
                    </Link>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-state__icon" style={{ fontSize: '3rem' }}>🔧</div>
          <div className="empty-state__title">
            {isRepairer ? 'No booking requests yet' : 'No bookings yet'}
          </div>
          <div className="empty-state__desc">
            {isRepairer
              ? 'Customers will send booking requests from your profile page.'
              : 'Find a repairer and send a booking request.'}
          </div>
          {!isRepairer && (
            <Link href="/repairers" className="btn btn--primary btn--md" style={{ marginTop: 16 }}>
              Find Repairers
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
