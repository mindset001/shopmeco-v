import { createAdminClient } from '@/lib/supabase/admin'
import Badge from '@/components/ui/Badge'
import { formatDate } from '@/lib/utils/helpers'
import Link from 'next/link'
import ReleaseButton from './ReleaseButton'
import type { EscrowStatus } from '@/types'

const statusVariant: Record<EscrowStatus, 'warning' | 'info' | 'success' | 'danger'> = {
  pending: 'warning',
  held: 'info',
  released: 'success',
  refunded: 'danger',
}

interface PageProps {
  searchParams: Promise<{ status?: string }>
}

export default async function AdminPaymentsPage({ searchParams }: PageProps) {
  const { status } = await searchParams
  const supabase = createAdminClient()

  let query = supabase
    .from('escrow_payments')
    .select(
      '*, payer:profiles!escrow_payments_payer_id_fkey(id, full_name, avatar_url), payee:profiles!escrow_payments_payee_id_fkey(id, full_name, avatar_url)'
    )
    .order('created_at', { ascending: false })

  if (status) query = query.eq('status', status)

  const { data: payments } = await query.limit(100)

  // Summary counts
  const { data: summary } = await supabase
    .from('escrow_payments')
    .select('status, amount')

  const held = summary?.filter((p) => p.status === 'held') ?? []
  const released = summary?.filter((p) => p.status === 'released') ?? []
  const heldTotal = held.reduce((s, p) => s + Number(p.amount), 0)
  const releasedTotal = released.reduce((s, p) => s + Number(p.amount), 0)

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Escrow & Payments</h1>
        <p className="page-subtitle">Manage all platform payments held in escrow.</p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
        <div className="card" style={{ padding: 'var(--space-5)' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--color-text-300)', marginBottom: 4 }}>Currently Held</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-accent)' }}>₦{heldTotal.toLocaleString()}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-400)', marginTop: 2 }}>{held.length} payment{held.length !== 1 ? 's' : ''}</div>
        </div>
        <div className="card" style={{ padding: 'var(--space-5)' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--color-text-300)', marginBottom: 4 }}>Total Released</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-success)' }}>₦{releasedTotal.toLocaleString()}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-400)', marginTop: 2 }}>{released.length} payment{released.length !== 1 ? 's' : ''}</div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-5)', flexWrap: 'wrap' }}>
        {(['', 'pending', 'held', 'released', 'refunded'] as const).map((s) => (
          <Link
            key={s || 'all'}
            href={s ? `?status=${s}` : '?'}
            className={`btn btn--sm ${status === s || (!status && !s) ? 'btn--secondary' : 'btn--ghost'}`}
          >
            {s || 'All'}
          </Link>
        ))}
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>From</th>
                <th>To</th>
                <th>Type</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Date</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {(payments ?? []).length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', color: 'var(--color-text-300)', padding: 'var(--space-8)' }}>
                    No payments found.
                  </td>
                </tr>
              ) : (
                (payments as any[]).map((p) => (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 600 }}>{p.payer?.full_name ?? '—'}</td>
                    <td style={{ fontWeight: 600 }}>{p.payee?.full_name ?? '—'}</td>
                    <td style={{ textTransform: 'capitalize', fontSize: '0.85rem', color: 'var(--color-text-300)' }}>
                      {p.related_type}
                    </td>
                    <td style={{ fontWeight: 700 }}>₦{Number(p.amount).toLocaleString()}</td>
                    <td>
                      <Badge variant={statusVariant[p.status as EscrowStatus]}>
                        {p.status}
                      </Badge>
                    </td>
                    <td style={{ fontSize: '0.85rem', color: 'var(--color-text-300)' }}>
                      {formatDate(p.created_at)}
                      {p.released_at && (
                        <div style={{ fontSize: '0.75rem' }}>Released: {formatDate(p.released_at)}</div>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
                        <ReleaseButton escrowId={p.id} status={p.status} />
                        <Link
                          href={`/${p.related_type === 'booking' ? 'bookings' : 'orders'}/${p.related_id}`}
                          className="btn btn--ghost btn--sm"
                        >
                          View
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
