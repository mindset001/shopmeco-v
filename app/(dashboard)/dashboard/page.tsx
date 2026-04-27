import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getCurrentProfile } from '@/lib/utils/profile'
import { createClient } from '@/lib/supabase/server'
import { formatRelativeTime, formatDate } from '@/lib/utils/helpers'
import Badge from '@/components/ui/Badge'
import Avatar from '@/components/ui/Avatar'
import SymptomPicker from './SymptomPicker'
import type { OrderStatus, BookingStatus } from '@/types'

const statusVariant: Record<OrderStatus, 'default' | 'warning' | 'success' | 'danger' | 'info'> = {
  pending: 'warning',
  confirmed: 'info',
  shipped: 'info',
  delivered: 'success',
  cancelled: 'danger',
}

const bookingVariant: Record<BookingStatus, 'default' | 'warning' | 'success' | 'danger' | 'info'> = {
  pending: 'warning',
  confirmed: 'info',
  completed: 'success',
  cancelled: 'danger',
}

const SERVICE_CATEGORIES = [
  { label: 'Engine & Performance', icon: '🔧', spec: 'Engine' },
  { label: 'Electrical & Diagnostics', icon: '⚡', spec: 'Electrical' },
  { label: 'Transmission', icon: '⚙️', spec: 'Transmission' },
  { label: 'Suspension & Steering', icon: '🛞', spec: 'Suspension' },
  { label: 'Brakes', icon: '🛑', spec: 'Brakes' },
  { label: 'AC & Cooling', icon: '❄️', spec: 'AC' },
  { label: 'Fuel System', icon: '⛽', spec: 'Fuel' },
  { label: 'General Maintenance', icon: '🔩', spec: 'Maintenance' },
]

const SYMPTOMS = [
  'Car not starting',
  'Car shaking / vibrating',
  'Warning light on dashboard',
  'Strange noise',
  'Burning smell',
  'Poor fuel consumption',
  'Overheating',
  'Gear problems',
]

export default async function DashboardPage() {
  const profile = await getCurrentProfile()
  if (!profile) redirect('/login')

  const supabase = await createClient()

  if (profile.role === 'car_owner') {
    const [
      { data: bookings },
      { data: cars },
      { count: chatCount },
    ] = await Promise.all([
      supabase
        .from('bookings')
        .select('*, repairer:profiles!bookings_repairer_id_fkey(id, full_name, avatar_url, city)')
        .eq('customer_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(5),
      supabase
        .from('cars')
        .select('id, make, model, year, images')
        .eq('owner_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(6),
      supabase
        .from('conversations')
        .select('*', { count: 'exact', head: true })
        .or(`participant_1.eq.${profile.id},participant_2.eq.${profile.id}`),
    ])

    // Unique repairers from past bookings for "Rebook" 
    const seenRepairers = new Map<string, any>()
    for (const b of (bookings ?? []) as any[]) {
      if (b.repairer && !seenRepairers.has(b.repairer_id)) {
        seenRepairers.set(b.repairer_id, b.repairer)
      }
    }
    const previousRepairers = Array.from(seenRepairers.values()).slice(0, 3)
    const cityParam = profile.city ? `?city=${encodeURIComponent(profile.city)}` : ''

    return (
      <div className="animate-fade-in">
        {/* Welcome */}
        <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
          <div>
            <h1 className="page-title">Welcome back, {profile.full_name?.split(' ')[0] ?? 'there'} 👋</h1>
            <p className="page-subtitle">What does your car need today?</p>
          </div>
          <Badge variant="info" style={{ fontSize: '0.85rem', padding: '0.4rem 0.8rem' }}>🚗 Car Owner Account</Badge>
        </div>

        {/* ── 1. Quick Actions ───────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px,1fr))', gap: 'var(--space-4)', marginBottom: 'var(--space-8)' }}>
          <Link href={`/repairers${cityParam}`} className="card card--hover" style={{ padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-2)', textDecoration: 'none', textAlign: 'center' }}>
            <span style={{ fontSize: '2rem' }}>📍</span>
            <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Find Car Repairs Near Me</span>
          </Link>
          <Link href="/repairers" className="card card--hover" style={{ padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-2)', textDecoration: 'none', textAlign: 'center' }}>
            <span style={{ fontSize: '2rem' }}>📅</span>
            <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Book Appointment</span>
          </Link>
          {previousRepairers.length > 0 ? (
            <Link href={`/repairers/${previousRepairers[0].id}#book`} className="card card--hover" style={{ padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-2)', textDecoration: 'none', textAlign: 'center' }}>
              <span style={{ fontSize: '2rem' }}>🔄</span>
              <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Rebook Previous Mechanic</span>
            </Link>
          ) : (
            <div className="card" style={{ padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-2)', textAlign: 'center', opacity: 0.5 }}>
              <span style={{ fontSize: '2rem' }}>🔄</span>
              <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Rebook Previous Mechanic</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-400)' }}>No history yet</span>
            </div>
          )}
          <Link href="/repairers?available=1" className="card card--hover" style={{ padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-2)', textDecoration: 'none', textAlign: 'center', border: '2px solid var(--color-danger)' }}>
            <span style={{ fontSize: '2rem' }}>🚨</span>
            <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--color-danger)' }}>Emergency Repair / Breakdown</span>
          </Link>
        </div>

        {/* ── 2. Service Categories ───────────────────── */}
        <div className="section-header">
          <h2 className="section-title">What do you need?</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 'var(--space-3)', marginBottom: 'var(--space-8)' }}>
          {SERVICE_CATEGORIES.map((cat) => (
            <Link
              key={cat.spec}
              href={`/repairers?specialization=${encodeURIComponent(cat.spec)}`}
              className="card card--hover"
              style={{ padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-2)', textDecoration: 'none', textAlign: 'center' }}
            >
              <span style={{ fontSize: '1.75rem' }}>{cat.icon}</span>
              <span style={{ fontSize: '0.82rem', fontWeight: 600, lineHeight: 1.3 }}>{cat.label}</span>
            </Link>
          ))}
        </div>

        {/* ── 3. Symptom Picker ───────────────────────── */}
        <SymptomPicker symptoms={SYMPTOMS} city={profile.city ?? ''} />

        {/* ── 4. Recent Bookings ──────────────────────── */}
        <div className="section-header" style={{ marginTop: 'var(--space-8)' }}>
          <h2 className="section-title">Recent Bookings</h2>
          <Link href="/bookings" className="btn btn--ghost btn--sm">View all</Link>
        </div>
        {bookings && bookings.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', marginBottom: 'var(--space-8)' }}>
            {(bookings as any[]).slice(0, 3).map((b) => (
              <div key={b.id} className="card" style={{ padding: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
                <Avatar src={b.repairer?.avatar_url} name={b.repairer?.full_name} size="md" />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600 }}>{b.repairer?.full_name ?? '—'}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-300)' }}>{formatDate(b.scheduled_date)}</div>
                </div>
                <Badge variant={bookingVariant[b.status as BookingStatus]}>{b.status}</Badge>
                <Link href={`/repairers/${b.repairer_id}#book`} className="btn btn--ghost btn--sm">Book Again</Link>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state" style={{ marginBottom: 'var(--space-8)' }}>
            <div className="empty-state__title">No bookings yet</div>
            <div className="empty-state__desc">Find a repairer and send a booking request.</div>
            <Link href="/repairers" className="btn btn--primary btn--sm" style={{ marginTop: 12 }}>Find Repairers</Link>
          </div>
        )}

        {/* ── 5. My Cars ──────────────────────────────── */}
        <div className="section-header">
          <h2 className="section-title">My Cars</h2>
          <Link href="/dashboard/cars" className="btn btn--ghost btn--sm">Manage</Link>
        </div>
        {cars && cars.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px,1fr))', gap: 'var(--space-3)', marginBottom: 'var(--space-8)' }}>
            {(cars as any[]).map((car) => (
              <Link key={car.id} href={`/dashboard/cars/${car.id}/edit`} className="card card--hover" style={{ overflow: 'hidden', textDecoration: 'none' }}>
                <div style={{ height: 90, background: 'var(--color-surface-700)', overflow: 'hidden' }}>
                  {car.images?.[0]
                    ? <img src={car.images[0]} alt={car.make} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>🚗</div>
                  }
                </div>
                <div style={{ padding: 'var(--space-3)' }}>
                  <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{car.year} {car.make}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-300)' }}>{car.model}</div>
                </div>
              </Link>
            ))}
            <Link href="/dashboard/cars/new" className="card card--hover" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 130, textDecoration: 'none', flexDirection: 'column', gap: 8, color: 'var(--color-text-300)' }}>
              <span style={{ fontSize: '1.75rem' }}>＋</span>
              <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>Add Car</span>
            </Link>
          </div>
        ) : (
          <div className="empty-state" style={{ marginBottom: 'var(--space-8)' }}>
            <div className="empty-state__title">No cars added</div>
            <Link href="/dashboard/cars/new" className="btn btn--primary btn--sm" style={{ marginTop: 12 }}>Add your first car</Link>
          </div>
        )}

        {/* ── 6. Rebook Previous Repairers ────────────── */}
        {previousRepairers.length > 0 && (
          <>
            <div className="section-header">
              <h2 className="section-title">Previous Mechanics</h2>
            </div>
            <div style={{ display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap', marginBottom: 'var(--space-8)' }}>
              {previousRepairers.map((r) => (
                <div key={r.id} className="card" style={{ padding: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 'var(--space-3)', minWidth: 220 }}>
                  <Avatar src={r.avatar_url} name={r.full_name} size="md" />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{r.full_name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-300)' }}>{r.city ?? ''}</div>
                  </div>
                  <Link href={`/repairers/${r.id}#book`} className="btn btn--primary btn--sm">Book Again</Link>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    )
  }

  if (profile.role === 'repairer') {
    const { data: details } = await supabase.from('repairer_details').select('*').eq('id', profile.id).single()
    const { data: reviews } = await supabase.from('reviews').select('*, reviewer:profiles!reviewer_id(full_name, avatar_url)').eq('repairer_id', profile.id).order('created_at', { ascending: false }).limit(5)

    return (
      <div className="animate-fade-in">
        <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
          <div>
            <h1 className="page-title">Your Workshop</h1>
            <p className="page-subtitle">Check your reviews and see how your bookings are going.</p>
          </div>
          <Badge variant="accent" style={{ fontSize: '0.85rem', padding: '0.4rem 0.8rem' }}>🔧 Repairer Account</Badge>
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
      supabase.from('products').select('*', { count: 'exact' }).eq('seller_id', profile.id).eq('is_active', true).order('created_at', { ascending: false }).limit(4),
      supabase.from('orders').select('*, products(name)').eq('seller_id', profile.id).order('created_at', { ascending: false }).limit(5),
    ])

    const revenue = orders?.filter((o) => (o as any).status === 'delivered')
      .reduce((sum, o) => sum + Number((o as any).total_price), 0) ?? 0

    return (
      <div className="animate-fade-in">
        <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
          <div>
            <h1 className="page-title">Your Shop</h1>
            <p className="page-subtitle">See what&apos;s selling and what needs attention.</p>
          </div>
          <Badge variant="success" style={{ fontSize: '0.85rem', padding: '0.4rem 0.8rem' }}>📦 Parts Seller Account</Badge>
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
            <div className="empty-state__title">No orders yet</div>
            {(productCount ?? 0) > 0 ? (
              <div className="empty-state__desc">You have active listings. Wait for customers to place an order.</div>
            ) : (
              <>
                <div className="empty-state__desc">Post some listings and orders will start coming in.</div>
                <Link href="/marketplace/new" className="btn btn--primary btn--md">Add Listing</Link>
              </>
            )}
          </div>
        )}

        <div className="section-header" style={{ marginTop: 'var(--space-8)' }}>
          <h2 className="section-title">Recent Listings</h2>
          <Link href="/dashboard/listings" className="btn btn--ghost btn--sm">View all</Link>
        </div>
        {products && products.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 'var(--space-4)', marginBottom: 'var(--space-8)' }}>
            {(products as any[]).map((p) => (
              <Link key={p.id} href={`/dashboard/listings/${p.id}/edit`} className="card card--hover" style={{ textDecoration: 'none', overflow: 'hidden' }}>
                <div style={{ height: 120, background: 'var(--color-surface-700)' }}>
                  {p.images?.[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.images[0]} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>📦</div>
                  )}
                </div>
                <div style={{ padding: 'var(--space-3)' }}>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 800, color: 'var(--color-accent)' }}>₦{Number(p.price).toLocaleString()}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-400)' }}>{p.stock_quantity} in stock</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : null}
      </div>
    )
  }

  // admin — redirect to admin panel
  redirect('/admin')
}
