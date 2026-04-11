import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createAdminClient } from '@/lib/supabase/admin'
import Badge from '@/components/ui/Badge'
import UserActions from '../UserActions'
import { formatDate } from '@/lib/utils/helpers'

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = createAdminClient()

  const [
    { data: profile },
    { data: repairerDetails },
    { data: cars },
    { data: products },
    { data: orders },
  ] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', id).single(),
    supabase.from('repairer_details').select('*').eq('id', id).single(),
    supabase.from('cars').select('*').eq('owner_id', id).order('created_at', { ascending: false }),
    supabase.from('products').select('id, name, price, category, is_active, created_at').eq('seller_id', id).order('created_at', { ascending: false }),
    supabase.from('orders').select('id, total_price, status, created_at').or(`buyer_id.eq.${id},seller_id.eq.${id}`).order('created_at', { ascending: false }).limit(10),
  ])

  if (!profile) notFound()

  const roleColor: Record<string, 'accent' | 'info' | 'success' | 'warning'> = {
    car_owner: 'info', repairer: 'accent', parts_seller: 'success', admin: 'warning',
  }

  const fields: { label: string; value: string | number | null | undefined }[] = [
    { label: 'Full Name', value: profile.full_name },
    { label: 'Role', value: profile.role?.replace(/_/g, ' ') },
    { label: 'Phone', value: profile.phone },
    { label: 'City', value: profile.city },
    { label: 'State', value: profile.state },
    { label: 'Address', value: profile.address },
    { label: 'Latitude', value: profile.latitude },
    { label: 'Longitude', value: profile.longitude },
    { label: 'Joined', value: formatDate(profile.created_at) },
    { label: 'User ID', value: profile.id },
  ]

  return (
    <div className="animate-fade-in">
      {/* Back + header */}
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <Link href="/admin/users" className="btn btn--ghost btn--sm" style={{ marginBottom: 8 }}>
            ← Back to Users
          </Link>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {profile.full_name ?? 'Unnamed User'}
            {profile.is_verified && (
              <span title="Verified" style={{ color: '#3b82f6', fontSize: '1rem' }}>✔</span>
            )}
            <Badge variant={roleColor[profile.role] ?? 'default'}>
              {profile.role?.replace(/_/g, ' ')}
            </Badge>
          </h1>
          <p className="page-subtitle">
            {profile.is_suspended
              ? 'Account is suspended'
              : profile.is_verified
                ? 'Verified account'
                : 'Pending verification'
            }
          </p>
        </div>
        <UserActions
          userId={profile.id}
          isVerified={!!profile.is_verified}
          isSuspended={!!profile.is_suspended}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>

        {/* Avatar + bio */}
        <div className="card">
          <h2 style={{ fontWeight: 700, marginBottom: 16, fontSize: '1rem' }}>Profile</h2>
          {profile.avatar_url && (
            <div style={{ marginBottom: 16 }}>
              <Image
                src={profile.avatar_url}
                alt={profile.full_name ?? 'Avatar'}
                width={80}
                height={80}
                style={{ borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--color-border)' }}
              />
            </div>
          )}
          <dl style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '8px 16px', alignItems: 'start' }}>
            {fields.map(({ label, value }) => (
              value != null && value !== '' ? (
                <>
                  <dt key={`l-${label}`} style={{ color: 'var(--color-text-300)', fontSize: '0.8125rem', whiteSpace: 'nowrap' }}>{label}</dt>
                  <dd key={`v-${label}`} style={{ margin: 0, fontWeight: 500, wordBreak: 'break-all', fontSize: '0.875rem' }}>{value}</dd>
                </>
              ) : null
            ))}
          </dl>
          {profile.bio && (
            <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--color-border)' }}>
              <p style={{ color: 'var(--color-text-300)', fontSize: '0.8125rem', marginBottom: 4 }}>Bio</p>
              <p style={{ fontSize: '0.875rem', lineHeight: 1.6 }}>{profile.bio}</p>
            </div>
          )}
        </div>

        {/* Status summary */}
        <div className="card">
          <h2 style={{ fontWeight: 700, marginBottom: 16, fontSize: '1rem' }}>Account Status</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--color-text-300)', fontSize: '0.875rem' }}>Verification</span>
              {profile.is_verified
                ? <Badge variant="success">Verified</Badge>
                : <Badge variant="default">Not Verified</Badge>}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--color-text-300)', fontSize: '0.875rem' }}>Suspension</span>
              {profile.is_suspended
                ? <Badge variant="danger">Suspended</Badge>
                : <Badge variant="success">Active</Badge>}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--color-text-300)', fontSize: '0.875rem' }}>Cars</span>
              <span style={{ fontWeight: 600 }}>{cars?.length ?? 0}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--color-text-300)', fontSize: '0.875rem' }}>Products</span>
              <span style={{ fontWeight: 600 }}>{products?.length ?? 0}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--color-text-300)', fontSize: '0.875rem' }}>Orders</span>
              <span style={{ fontWeight: 600 }}>{orders?.length ?? 0}</span>
            </div>
          </div>
        </div>

        {/* Repairer details */}
        {repairerDetails && (
          <div className="card">
            <h2 style={{ fontWeight: 700, marginBottom: 16, fontSize: '1rem' }}>Repairer Details</h2>
            <dl style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '8px 16px' }}>
              <dt style={{ color: 'var(--color-text-300)', fontSize: '0.8125rem' }}>Workshop</dt>
              <dd style={{ margin: 0, fontWeight: 500, fontSize: '0.875rem' }}>{repairerDetails.workshop_name ?? '—'}</dd>

              <dt style={{ color: 'var(--color-text-300)', fontSize: '0.8125rem' }}>Hourly Rate</dt>
              <dd style={{ margin: 0, fontWeight: 500, fontSize: '0.875rem' }}>
                {repairerDetails.hourly_rate ? `$${repairerDetails.hourly_rate}` : '—'}
              </dd>

              <dt style={{ color: 'var(--color-text-300)', fontSize: '0.8125rem' }}>Experience</dt>
              <dd style={{ margin: 0, fontWeight: 500, fontSize: '0.875rem' }}>
                {repairerDetails.years_experience != null ? `${repairerDetails.years_experience} yrs` : '—'}
              </dd>

              <dt style={{ color: 'var(--color-text-300)', fontSize: '0.8125rem' }}>Rating</dt>
              <dd style={{ margin: 0, fontWeight: 500, fontSize: '0.875rem' }}>
                ⭐ {repairerDetails.rating?.toFixed(1) ?? '0.0'} ({repairerDetails.total_reviews} reviews)
              </dd>

              <dt style={{ color: 'var(--color-text-300)', fontSize: '0.8125rem' }}>Available</dt>
              <dd style={{ margin: 0, fontSize: '0.875rem' }}>
                {repairerDetails.is_available
                  ? <Badge variant="success">Yes</Badge>
                  : <Badge variant="default">No</Badge>}
              </dd>
            </dl>
            {repairerDetails.specializations?.length > 0 && (
              <div style={{ marginTop: 12 }}>
                <p style={{ color: 'var(--color-text-300)', fontSize: '0.8125rem', marginBottom: 6 }}>Specializations</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {repairerDetails.specializations.map((s: string) => (
                    <Badge key={s} variant="accent">{s}</Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Cars */}
      {(cars?.length ?? 0) > 0 && (
        <div className="card" style={{ marginTop: 20 }}>
          <h2 style={{ fontWeight: 700, marginBottom: 16, fontSize: '1rem' }}>Cars ({cars!.length})</h2>
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Make / Model</th>
                  <th>Year</th>
                  <th>Color</th>
                  <th>Plate</th>
                  <th>Mileage</th>
                  <th>Visibility</th>
                  <th>Added</th>
                </tr>
              </thead>
              <tbody>
                {cars!.map((car: any) => (
                  <tr key={car.id}>
                    <td style={{ fontWeight: 600 }}>{car.make} {car.model}</td>
                    <td>{car.year}</td>
                    <td>{car.color ?? '—'}</td>
                    <td>{car.plate_number ?? '—'}</td>
                    <td>{car.mileage != null ? `${car.mileage.toLocaleString()} km` : '—'}</td>
                    <td>
                      {car.is_public
                        ? <Badge variant="success">Public</Badge>
                        : <Badge variant="default">Private</Badge>}
                    </td>
                    <td style={{ color: 'var(--color-text-300)' }}>{formatDate(car.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Products */}
      {(products?.length ?? 0) > 0 && (
        <div className="card" style={{ marginTop: 20 }}>
          <h2 style={{ fontWeight: 700, marginBottom: 16, fontSize: '1rem' }}>Products ({products!.length})</h2>
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Status</th>
                  <th>Listed</th>
                </tr>
              </thead>
              <tbody>
                {products!.map((p: any) => (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 600 }}>{p.name}</td>
                    <td>{p.category ?? '—'}</td>
                    <td>${p.price}</td>
                    <td>
                      {p.is_active
                        ? <Badge variant="success">Active</Badge>
                        : <Badge variant="default">Inactive</Badge>}
                    </td>
                    <td style={{ color: 'var(--color-text-300)' }}>{formatDate(p.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Recent orders */}
      {(orders?.length ?? 0) > 0 && (
        <div className="card" style={{ marginTop: 20 }}>
          <h2 style={{ fontWeight: 700, marginBottom: 16, fontSize: '1rem' }}>Recent Orders</h2>
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {orders!.map((o: any) => (
                  <tr key={o.id}>
                    <td style={{ fontFamily: 'monospace', fontSize: '0.8125rem', color: 'var(--color-text-300)' }}>
                      {o.id.slice(0, 8)}…
                    </td>
                    <td style={{ fontWeight: 600 }}>${o.total_price}</td>
                    <td><Badge variant="default">{o.status}</Badge></td>
                    <td style={{ color: 'var(--color-text-300)' }}>{formatDate(o.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
