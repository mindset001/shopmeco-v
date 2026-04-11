import { createAdminClient } from '@/lib/supabase/admin'
import Badge from '@/components/ui/Badge'
import Link from 'next/link'
import { formatDate } from '@/lib/utils/helpers'

export default async function AdminPage() {
  const supabase = createAdminClient()

  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

  const [
    { count: totalUsers },
    { count: totalProducts },
    { count: totalOrders },
    { count: totalBookings },
    { count: newUsersThisWeek },
    { count: newOrdersThisWeek },
    { data: revenueData },
    { data: recentUsers },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('products').select('*', { count: 'exact', head: true }),
    supabase.from('orders').select('*', { count: 'exact', head: true }),
    supabase.from('bookings').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', oneWeekAgo),
    supabase.from('orders').select('*', { count: 'exact', head: true }).gte('created_at', oneWeekAgo),
    supabase.from('orders').select('total_price').eq('status', 'delivered'),
    supabase.from('profiles').select('id, full_name, role, created_at, is_verified').order('created_at', { ascending: false }).limit(8),
  ])

  const totalRevenue = (revenueData ?? []).reduce((sum: number, o: any) => sum + Number(o.total_price), 0)

  const roleColor: Record<string, 'accent' | 'info' | 'success' | 'warning'> = {
    car_owner: 'info', repairer: 'accent', parts_seller: 'success', admin: 'warning',
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Admin Overview</h1>
        <p className="page-subtitle">Platform statistics and management</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-card__label">Total Users</div>
          <div className="stat-card__value">{totalUsers ?? 0}</div>
          <div style={{ fontSize: '0.8125rem', color: 'var(--color-success)', marginTop: 4 }}>+{newUsersThisWeek ?? 0} this week</div>
        </div>
        <div className="stat-card">
          <div className="stat-card__label">Products Listed</div>
          <div className="stat-card__value">{totalProducts ?? 0}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card__label">Total Orders</div>
          <div className="stat-card__value">{totalOrders ?? 0}</div>
          <div style={{ fontSize: '0.8125rem', color: 'var(--color-success)', marginTop: 4 }}>+{newOrdersThisWeek ?? 0} this week</div>
        </div>
        <div className="stat-card">
          <div className="stat-card__label">Total Bookings</div>
          <div className="stat-card__value">{totalBookings ?? 0}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card__label">Revenue (Delivered)</div>
          <div className="stat-card__value" style={{ fontSize: '1.5rem' }}>₦{totalRevenue.toLocaleString()}</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 'var(--space-4)', marginBottom: 'var(--space-8)', flexWrap: 'wrap' }}>
        <Link href="/admin/users" className="btn btn--secondary btn--md">Manage Users</Link>
        <Link href="/admin/products" className="btn btn--secondary btn--md">Manage Products</Link>
        <Link href="/admin/orders" className="btn btn--secondary btn--md">View Orders</Link>
        <Link href="/admin/bookings" className="btn btn--secondary btn--md">View Bookings</Link>
      </div>

      <div className="section-header">
        <h2 className="section-title">Recent Registrations</h2>
        <Link href="/admin/users" className="btn btn--ghost btn--sm">View all</Link>
      </div>
      <div className="card">
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Role</th>
                <th>Status</th>
                <th>Joined</th>
              </tr>
            </thead>
            <tbody>
              {(recentUsers ?? []).map((u: any) => (
                <tr key={u.id}>
                  <td>
                    <Link href={`/admin/users/${u.id}`} style={{ color: 'inherit', textDecoration: 'none', fontWeight: 600 }} className="hover-underline">
                      {u.full_name ?? '—'}
                    </Link>
                  </td>
                  <td>
                    <Badge variant={roleColor[u.role] ?? 'default'}>
                      {u.role?.replace('_', ' ')}
                    </Badge>
                  </td>
                  <td>
                    {u.is_verified
                      ? <Badge variant="success">Verified</Badge>
                      : <Badge variant="default">Pending</Badge>}
                  </td>
                  <td style={{ color: 'var(--color-text-300)' }}>{formatDate(u.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
