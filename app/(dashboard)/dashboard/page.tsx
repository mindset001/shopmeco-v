import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getCurrentProfile } from '@/lib/utils/profile'
import { createClient } from '@/lib/supabase/server'
import { formatRelativeTime } from '@/lib/utils/helpers'
import Badge from '@/components/ui/Badge'
import type { OrderStatus } from '@/types'

const statusVariant: Record<OrderStatus, 'default' | 'warning' | 'success' | 'danger' | 'info'> = {
  pending: 'warning',
  confirmed: 'info',
  shipped: 'info',
  delivered: 'success',
  cancelled: 'danger',
}

export default async function DashboardPage() {
  const profile = await getCurrentProfile()
  if (!profile) redirect('/login')

  const supabase = await createClient()

  if (profile.role === 'car_owner') {
    const [{ data: orders }, { count: chatCount }, { count: carCount }] = await Promise.all([
      supabase.from('orders').select('*, products(name, images)').eq('buyer_id', profile.id).order('created_at', { ascending: false }).limit(5),
      supabase.from('conversations').select('*', { count: 'exact', head: true }).or(`participant_1.eq.${profile.id},participant_2.eq.${profile.id}`),
      supabase.from('cars').select('*', { count: 'exact', head: true }).eq('owner_id', profile.id),
    ])

    return (
      <div className="animate-fade-in">
        <div className="page-header">
          <h1 className="page-title">Welcome back, {profile.full_name?.split(' ')[0]} 👋</h1>
          <p className="page-subtitle">Here&apos;s a look at your activity.</p>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-card__icon" style={{ background: 'rgba(249,115,22,0.12)' }}>
              <span style={{ color: 'var(--color-accent)', fontSize: '1.25rem' }}>📦</span>
            </div>
            <div className="stat-card__label">Total Orders</div>
            <div className="stat-card__value">{orders?.length ?? 0}</div>
          </div>
          <div className="stat-card">
            <div className="stat-card__icon" style={{ background: 'rgba(37,99,235,0.12)' }}>
              <span style={{ color: 'var(--color-primary-light)', fontSize: '1.25rem' }}>💬</span>
            </div>
            <div className="stat-card__label">Conversations</div>
            <div className="stat-card__value">{chatCount ?? 0}</div>
          </div>
          <div className="stat-card">
            <div className="stat-card__icon" style={{ background: 'rgba(22,163,74,0.12)' }}>
              <span style={{ color: '#16a34a', fontSize: '1.25rem' }}>🚗</span>
            </div>
            <div className="stat-card__label">My Cars</div>
            <div className="stat-card__value">{carCount ?? 0}</div>
          </div>
        </div>

        <div className="section-header">
          <h2 className="section-title">Recent Orders</h2>
          <Link href="/orders" className="btn btn--ghost btn--sm">View all</Link>
        </div>
        {orders && orders.length > 0 ? (
          <div className="card">
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Status</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {(orders as any[]).map((o) => (
                    <tr key={o.id}>
                      <td>{o.products?.name ?? '—'}</td>
                      <td><Badge variant={statusVariant[o.status as OrderStatus]}>{o.status}</Badge></td>
                      <td style={{ color: 'var(--color-text-300)' }}>{formatRelativeTime(o.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-state__title">No orders yet</div>
            <div className="empty-state__desc">Head to the marketplace when you need a part.</div>
            <Link href="/marketplace" className="btn btn--primary btn--md">Go to Marketplace</Link>
          </div>
        )}
      </div>
    )
  }

  if (profile.role === 'repairer') {
    const { data: details } = await supabase.from('repairer_details').select('*').eq('id', profile.id).single()
    const { data: reviews } = await supabase.from('reviews').select('*, reviewer:profiles!reviewer_id(full_name, avatar_url)').eq('repairer_id', profile.id).order('created_at', { ascending: false }).limit(5)

    return (
      <div className="animate-fade-in">
        <div className="page-header">
          <h1 className="page-title">Your Workshop</h1>
          <p className="page-subtitle">Check your reviews and see how your bookings are going.</p>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-card__label">Rating</div>
            <div className="stat-card__value">{details?.rating?.toFixed(1) ?? '—'} ⭐</div>
          </div>
          <div className="stat-card">
            <div className="stat-card__label">Total Reviews</div>
            <div className="stat-card__value">{details?.total_reviews ?? 0}</div>
          </div>
          <div className="stat-card">
            <div className="stat-card__label">Status</div>
            <div className="stat-card__value" style={{ fontSize: '1.2rem' }}>
              {details?.is_available ? '🟢 Available' : '🔴 Busy'}
            </div>
          </div>
        </div>

        <div className="section-header">
          <h2 className="section-title">Recent Reviews</h2>
          <Link href="/profile" className="btn btn--ghost btn--sm">View profile</Link>
        </div>
        {reviews && reviews.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            {(reviews as any[]).map((rev) => (
              <div key={rev.id} className="card" style={{ padding: 'var(--space-5)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
                  <span style={{ fontWeight: 600 }}>{rev.reviewer?.full_name ?? 'Anonymous'}</span>
                  <span style={{ color: 'var(--color-warning)' }}>{'★'.repeat(rev.rating)}</span>
                </div>
                <p style={{ color: 'var(--color-text-300)', fontSize: '0.9rem' }}>{rev.comment}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-state__title">No reviews yet</div>
            <div className="empty-state__desc">Once you finish jobs, reviews will show up here.</div>
          </div>
        )}
      </div>
    )
  }

  if (profile.role === 'parts_seller') {
    const [{ data: products, count: productCount }, { data: orders }] = await Promise.all([
      supabase.from('products').select('*', { count: 'exact' }).eq('seller_id', profile.id).eq('is_active', true),
      supabase.from('orders').select('*, products(name)').eq('seller_id', profile.id).order('created_at', { ascending: false }).limit(5),
    ])

    const revenue = orders?.filter((o) => (o as any).status === 'delivered')
      .reduce((sum, o) => sum + Number((o as any).total_price), 0) ?? 0

    return (
      <div className="animate-fade-in">
        <div className="page-header">
          <h1 className="page-title">Your Shop</h1>
          <p className="page-subtitle">See what&apos;s selling and what needs attention.</p>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-card__label">Active Listings</div>
            <div className="stat-card__value">{productCount ?? 0}</div>
          </div>
          <div className="stat-card">
            <div className="stat-card__label">Total Orders</div>
            <div className="stat-card__value">{orders?.length ?? 0}</div>
          </div>
          <div className="stat-card">
            <div className="stat-card__label">Revenue (delivered)</div>
            <div className="stat-card__value">₦{revenue.toLocaleString()}</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-4)', marginBottom: 'var(--space-8)' }}>
          <Link href="/marketplace/new" className="btn btn--primary btn--md">+ New Listing</Link>
          <Link href="/orders" className="btn btn--ghost btn--md">Manage Orders</Link>
        </div>

        <div className="section-header">
          <h2 className="section-title">Recent Orders</h2>
        </div>
        {orders && orders.length > 0 ? (
          <div className="card">
            <div className="table-wrapper">
              <table className="table">
                <thead><tr><th>Product</th><th>Status</th><th>Amount</th><th>Date</th></tr></thead>
                <tbody>
                  {(orders as any[]).map((o) => (
                    <tr key={o.id}>
                      <td>{o.products?.name ?? '—'}</td>
                      <td><Badge variant={statusVariant[o.status as OrderStatus]}>{o.status}</Badge></td>
                      <td>₦{Number(o.total_price).toLocaleString()}</td>
                      <td style={{ color: 'var(--color-text-300)' }}>{formatRelativeTime(o.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-state__title">Nothing in yet</div>
            <div className="empty-state__desc">Post some listings and orders will start coming in.</div>
            <Link href="/marketplace/new" className="btn btn--primary btn--md">Add Listing</Link>
          </div>
        )}
      </div>
    )
  }

  // admin — redirect to admin panel
  redirect('/admin')
}
