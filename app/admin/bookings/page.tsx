import { Suspense } from 'react'
import { createAdminClient } from '@/lib/supabase/admin'
import Badge from '@/components/ui/Badge'
import { formatDate } from '@/lib/utils/helpers'
import AdminSearchInput from '@/components/admin/AdminSearchInput'
import AdminPagination from '@/components/admin/AdminPagination'
import type { BookingStatus } from '@/types'

const PAGE_SIZE = 25

const statusVariant: Record<BookingStatus, 'default' | 'warning' | 'success' | 'danger' | 'info'> = {
  pending: 'warning', confirmed: 'info', completed: 'success', cancelled: 'danger',
}

interface PageProps {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>
}

export default async function AdminBookingsPage({ searchParams }: PageProps) {
  const { q, status, page } = await searchParams
  const supabase = createAdminClient()

  const currentPage = Math.max(1, parseInt(page ?? '1'))
  const from = (currentPage - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  let query = supabase
    .from('bookings')
    .select('*, repairer:profiles!bookings_repairer_id_fkey(full_name, city), customer:profiles!bookings_customer_id_fkey(full_name)', { count: 'exact' })
  if (status) query = query.eq('status', status)
  const { data: bookings, count } = await query.order('scheduled_date', { ascending: false }).range(from, to)

  // If q is set, filter in JS (names come from joined tables)
  const filtered = q
    ? (bookings ?? []).filter((b: any) =>
        b.customer?.full_name?.toLowerCase().includes(q.toLowerCase()) ||
        b.repairer?.full_name?.toLowerCase().includes(q.toLowerCase()),
      )
    : (bookings ?? [])

  const baseParams = new URLSearchParams()
  if (q) baseParams.set('q', q)
  if (status) baseParams.set('status', status)
  const baseQuery = baseParams.size ? `?${baseParams.toString()}` : ''

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Bookings Overview</h1>
        <p className="page-subtitle">{count ?? 0} bookings total</p>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap', marginBottom: 'var(--space-5)', alignItems: 'center' }}>
        <Suspense>
          <AdminSearchInput placeholder="Search by name…" />
        </Suspense>
        <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
          {(['', 'pending', 'confirmed', 'completed', 'cancelled'] as const).map((s) => {
            const params = new URLSearchParams()
            if (q) params.set('q', q)
            if (s) params.set('status', s)
            return (
              <a key={s || 'all'} href={`?${params.toString()}`} className={`btn btn--sm ${status === s || (!status && !s) ? 'btn--secondary' : 'btn--ghost'}`}>
                {s || 'All'}
              </a>
            )
          })}
        </div>
      </div>

      <div className="card">
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Repairer</th>
                <th>City</th>
                <th>Scheduled</th>
                <th>Description</th>
                <th>Status</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((b: any) => (
                <tr key={b.id}>
                  <td style={{ fontWeight: 600 }}>{b.customer?.full_name ?? '—'}</td>
                  <td style={{ color: 'var(--color-text-300)' }}>{b.repairer?.full_name ?? '—'}</td>
                  <td style={{ color: 'var(--color-text-300)' }}>{b.repairer?.city ?? '—'}</td>
                  <td>{formatDate(b.scheduled_date)}</td>
                  <td style={{ maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--color-text-300)', fontSize: '0.8125rem' }}>
                    {b.description}
                  </td>
                  <td><Badge variant={statusVariant[b.status as BookingStatus]}>{b.status}</Badge></td>
                  <td style={{ color: 'var(--color-text-300)' }}>{formatDate(b.created_at)}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--color-text-400)', padding: '2rem' }}>No bookings found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        {!q && <AdminPagination currentPage={currentPage} totalCount={count ?? 0} pageSize={PAGE_SIZE} baseQuery={baseQuery} />}
      </div>
    </div>
  )
}
