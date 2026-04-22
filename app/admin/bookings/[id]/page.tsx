import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'
import Badge from '@/components/ui/Badge'
import { formatDate } from '@/lib/utils/helpers'
import Button from '@/components/ui/Button'
import type { BookingStatus } from '@/types'

interface PageProps {
  params: Promise<{ id: string }>
}

const statusVariant: Record<BookingStatus, 'default' | 'warning' | 'success' | 'danger' | 'info'> = {
  pending: 'warning', confirmed: 'info', completed: 'success', cancelled: 'danger',
}

export default async function BookingDetailPage({ params }: PageProps) {
  const { id } = await params
  const supabase = createAdminClient()

  const { data: booking } = await supabase
    .from('bookings')
    .select(`
      *,
      customer:profiles!bookings_customer_id_fkey(id, full_name, phone, city),
      repairer:profiles!bookings_repairer_id_fkey(id, full_name, phone, city)
    `)
    .eq('id', id)
    .single()

  if (!booking) redirect('/admin/bookings')

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: 'var(--space-6)' }}>
        <Link href="/admin/bookings" className="btn btn--sm btn--ghost">
          ← Back to Bookings
        </Link>
      </div>

      <div className="page-header">
        <div>
          <h1 className="page-title">Booking Details</h1>
          <p className="page-subtitle">ID: {booking.id}</p>
        </div>
        <div>
          <Badge variant={statusVariant[booking.status as BookingStatus]}>
            {booking.status}
          </Badge>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-6)', marginBottom: 'var(--space-6)' }}>
        {/* Customer Info */}
        <div className="card">
          <div style={{ fontWeight: 700, marginBottom: 'var(--space-4)', fontSize: '0.95rem' }}>
            Customer Info
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-400)', marginBottom: 4 }}>Name</div>
              <div style={{ fontWeight: 600 }}>{booking.customer?.full_name ?? '—'}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-400)', marginBottom: 4 }}>Phone</div>
              <div>{booking.customer?.phone ?? '—'}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-400)', marginBottom: 4 }}>City</div>
              <div>{booking.customer?.city ?? '—'}</div>
            </div>
          </div>
        </div>

        {/* Repairer Info */}
        <div className="card">
          <div style={{ fontWeight: 700, marginBottom: 'var(--space-4)', fontSize: '0.95rem' }}>
            Repairer Info
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-400)', marginBottom: 4 }}>Name</div>
              <div style={{ fontWeight: 600 }}>{booking.repairer?.full_name ?? '—'}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-400)', marginBottom: 4 }}>Phone</div>
              <div>{booking.repairer?.phone ?? '—'}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-400)', marginBottom: 4 }}>City</div>
              <div>{booking.repairer?.city ?? '—'}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Booking Details */}
      <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
        <div style={{ fontWeight: 700, marginBottom: 'var(--space-4)', fontSize: '0.95rem' }}>
          Booking Details
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 'var(--space-4)' }}>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-400)', marginBottom: 4 }}>Scheduled Date</div>
            <div style={{ fontWeight: 600 }}>{formatDate(booking.scheduled_date)}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-400)', marginBottom: 4 }}>Created</div>
            <div>{formatDate(booking.created_at)}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-400)', marginBottom: 4 }}>Status</div>
            <Badge variant={statusVariant[booking.status as BookingStatus]}>{booking.status}</Badge>
          </div>
          {booking.agreed_price && (
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-400)', marginBottom: 4 }}>Agreed Price</div>
              <div style={{ fontWeight: 600 }}>₦{booking.agreed_price.toLocaleString()}</div>
            </div>
          )}
          {booking.payment_status && (
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-400)', marginBottom: 4 }}>Payment Status</div>
              <Badge variant={booking.payment_status === 'released' ? 'success' : 'warning'}>
                {booking.payment_status}
              </Badge>
            </div>
          )}
        </div>
      </div>

      {/* Description */}
      <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
        <div style={{ fontWeight: 700, marginBottom: 'var(--space-4)', fontSize: '0.95rem' }}>
          Problem Description
        </div>
        <div style={{ color: 'var(--color-text-200)', lineHeight: 1.6 }}>
          {booking.description || '—'}
        </div>
      </div>

      {/* Completion Notes */}
      {booking.completion_notes && (
        <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
          <div style={{ fontWeight: 700, marginBottom: 'var(--space-4)', fontSize: '0.95rem' }}>
            Completion Notes
          </div>
          <div style={{ color: 'var(--color-text-200)', lineHeight: 1.6 }}>
            {booking.completion_notes}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="card">
        <div style={{ fontWeight: 700, marginBottom: 'var(--space-4)', fontSize: '0.95rem' }}>
          Admin Actions
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
          <Link href="/admin/bookings" className="btn btn--secondary">
            Back to List
          </Link>
          <button className="btn btn--ghost" disabled style={{ cursor: 'not-allowed', opacity: 0.5 }}>
            Edit (Coming Soon)
          </button>
          <button className="btn btn--ghost" disabled style={{ cursor: 'not-allowed', opacity: 0.5 }}>
            Cancel (Coming Soon)
          </button>
        </div>
      </div>
    </div>
  )
}
