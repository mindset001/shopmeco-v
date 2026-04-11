import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import Badge from '@/components/ui/Badge'
import { Car as CarIcon, MapPin } from 'lucide-react'
import type { Car } from '@/types'

export default async function CarsPage({
  searchParams,
}: {
  searchParams: Promise<{ make?: string; q?: string }>
}) {
  const { make, q } = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from('cars')
    .select('*, profiles(id, full_name, avatar_url, city)')
    .eq('is_public', true)
    .order('created_at', { ascending: false })

  if (make) query = query.ilike('make', make)
  if (q) query = query.or(`make.ilike.%${q}%,model.ilike.%${q}%,description.ilike.%${q}%`)

  const { data: cars } = await query

  const makes = ['Toyota', 'Honda', 'Ford', 'Hyundai', 'Kia', 'Nissan', 'Mazda', 'BMW', 'Mercedes-Benz', 'Volkswagen', 'Peugeot', 'Suzuki', 'Mitsubishi', 'Lexus']

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-surface-900)' }}>
      {/* Header */}
      <div style={{ background: 'var(--color-surface-800)', borderBottom: '1px solid var(--color-border)', padding: '32px 0' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: 8 }}>Cars Directory</h1>
          <p style={{ color: 'var(--color-text-300)' }}>Browse vehicles listed by car owners in the community</p>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px', display: 'grid', gridTemplateColumns: '240px 1fr', gap: 32, alignItems: 'start' }}>
        {/* Filters */}
        <aside>
          <form method="GET" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="form-group">
              <label className="form-label">Search</label>
              <input className="input" name="q" defaultValue={q ?? ''} placeholder="Make, model..." />
            </div>
            <div className="form-group">
              <label className="form-label">Make</label>
              <select className="input" name="make" defaultValue={make ?? ''}>
                <option value="">All Makes</option>
                {makes.map(m => <option key={m}>{m}</option>)}
              </select>
            </div>
            <button type="submit" className="btn btn--primary btn--md">Search</button>
            {(make || q) && (
              <Link href="/cars" className="btn btn--ghost btn--sm" style={{ textAlign: 'center' }}>Clear</Link>
            )}
          </form>
        </aside>

        {/* Grid */}
        <div>
          <p style={{ color: 'var(--color-text-300)', marginBottom: 16 }}>{cars?.length ?? 0} cars found</p>
          {(!cars || cars.length === 0) ? (
            <div className="empty-state">
              <CarIcon size={48} className="empty-state__icon" />
              <h3 className="empty-state__title">No cars found</h3>
              <p className="empty-state__desc">Try adjusting your filters.</p>
            </div>
          ) : (
            <div className="product-grid">
              {(cars as any[]).map(car => (
                <Link key={car.id} href={`/cars/${car.id}`} style={{ textDecoration: 'none' }}>
                  <div className="product-card">
                    <div className="product-card__image">
                      {car.images?.[0] ? (
                        <img src={car.images[0]} alt={`${car.make} ${car.model}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--color-text-400)' }}>
                          <CarIcon size={40} />
                        </div>
                      )}
                    </div>
                    <div className="product-card__body">
                      <h3 className="product-card__name">{car.year} {car.make} {car.model}</h3>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                        {car.color && <Badge variant="default">{car.color}</Badge>}
                        {car.mileage != null && <Badge variant="info">{car.mileage.toLocaleString()} km</Badge>}
                      </div>
                      {car.profiles?.city && (
                        <p style={{ color: 'var(--color-text-300)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <MapPin size={12} /> {car.profiles.city}
                        </p>
                      )}
                      {car.profiles?.full_name && (
                        <p style={{ color: 'var(--color-text-400)', fontSize: '0.8rem', marginTop: 4 }}>by {car.profiles.full_name}</p>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
