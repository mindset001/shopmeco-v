import Link from 'next/link'
import { Suspense } from 'react'
import { createAdminClient } from '@/lib/supabase/admin'
import Badge from '@/components/ui/Badge'
import UserActions from './UserActions'
import AdminSearchInput from '@/components/admin/AdminSearchInput'
import AdminPagination from '@/components/admin/AdminPagination'
import { formatDate } from '@/lib/utils/helpers'

const PAGE_SIZE = 20

interface PageProps {
  searchParams: Promise<{ q?: string; role?: string; page?: string }>
}

export default async function AdminUsersPage({ searchParams }: PageProps) {
  const { q, role, page } = await searchParams
  const supabase = createAdminClient()

  const currentPage = Math.max(1, parseInt(page ?? '1'))
  const from = (currentPage - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  let query = supabase.from('profiles').select('*', { count: 'exact' })
  if (q) query = query.ilike('full_name', `%${q}%`)
  if (role) query = query.eq('role', role)
  const { data: users, count } = await query.order('created_at', { ascending: false }).range(from, to)

  const roleColor: Record<string, 'accent' | 'info' | 'success' | 'warning'> = {
    car_owner: 'info', repairer: 'accent', parts_seller: 'success', admin: 'warning',
  }

  // Build base query string (without page) for pagination links
  const baseParams = new URLSearchParams()
  if (q) baseParams.set('q', q)
  if (role) baseParams.set('role', role)
  const baseQuery = baseParams.size ? `?${baseParams.toString()}` : ''

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">User Management</h1>
        <p className="page-subtitle">{count ?? 0} registered users</p>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap', marginBottom: 'var(--space-5)', alignItems: 'center' }}>
        <Suspense>
          <AdminSearchInput placeholder="Search by name…" />
        </Suspense>
        <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
          {(['', 'car_owner', 'repairer', 'parts_seller', 'admin'] as const).map((r) => {
            const params = new URLSearchParams()
            if (q) params.set('q', q)
            if (r) params.set('role', r)
            return (
              <Link
                key={r || 'all'}
                href={`?${params.toString()}`}
                className={`btn btn--sm ${role === r || (!role && !r) ? 'btn--secondary' : 'btn--ghost'}`}
              >
                {r ? r.replace('_', ' ') : 'All roles'}
              </Link>
            )
          })}
        </div>
      </div>

      <div className="card">
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Role</th>
                <th>Status</th>
                <th>City</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {(users ?? []).map((u: any) => (
                <tr key={u.id} style={{ opacity: u.is_suspended ? 0.6 : 1 }}>
                  <td>
                    <Link
                      href={`/admin/users/${u.id}`}
                      style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, color: 'inherit', textDecoration: 'none' }}
                      className="hover-underline"
                    >
                      {u.full_name ?? '—'}
                      {u.is_verified && (
                        <span title="Verified" style={{ color: '#3b82f6', fontSize: '0.75rem' }}>✔</span>
                      )}
                    </Link>
                  </td>
                  <td>
                    <Badge variant={roleColor[u.role] ?? 'default'}>
                      {u.role?.replace('_', ' ')}
                    </Badge>
                  </td>
                  <td>
                    {u.is_suspended
                      ? <Badge variant="danger">Suspended</Badge>
                      : u.is_verified
                        ? <Badge variant="success">Verified</Badge>
                        : <Badge variant="default">Active</Badge>
                    }
                  </td>
                  <td style={{ color: 'var(--color-text-300)' }}>{u.city ?? '—'}</td>
                  <td style={{ color: 'var(--color-text-300)' }}>{formatDate(u.created_at)}</td>
                  <td>
                    <UserActions
                      userId={u.id}
                      isVerified={!!u.is_verified}
                      isSuspended={!!u.is_suspended}
                    />
                  </td>
                </tr>
              ))}
              {(users ?? []).length === 0 && (
                <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--color-text-400)', padding: '2rem' }}>No users found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <AdminPagination currentPage={currentPage} totalCount={count ?? 0} pageSize={PAGE_SIZE} baseQuery={baseQuery} />
      </div>
    </div>
  )
}
