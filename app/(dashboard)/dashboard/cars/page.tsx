import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getCurrentProfile } from '@/lib/utils/profile'
import { createClient } from '@/lib/supabase/server'
import Badge from '@/components/ui/Badge'
import type { Car } from '@/types'
import { Plus, Car as CarIcon, Wrench, AlertTriangle } from 'lucide-react'

type BookingSummary = {
  id: string
  car_id: string | null
  status: string
  scheduled_date: string
  created_at: string
  description: string
}

function maintenanceRecommendation(car: Car, serviceCount: number) {
  if (car.mileage != null && car.mileage >= 100000) {
    return 'High-mileage check: inspect suspension, cooling system, plugs, belts, and transmission fluid.'
  }
  if (car.mileage != null && car.mileage >= 50000) {
    return 'Schedule a mid-life service: brake check, filters, plugs, alignment, and fluids.'
  }
  if (serviceCount === 0) {
    return 'No service history yet. Start with a routine inspection to build your maintenance record.'
  }
  return 'Keep this garage updated after every repair so future estimates get smarter.'
}

export default async function MyCarsPage() {
  const profile = await getCurrentProfile()
  if (!profile) redirect('/login')
  if (profile.role !== 'car_owner') redirect('/dashboard')

  const supabase = await createClient()
  const { data: cars } = await supabase
    .from('cars')
    .select('*')
    .eq('owner_id', profile.id)
    .order('created_at', { ascending: false })

  const { data: bookings } = await supabase
    .from('bookings')
    .select('id, car_id, status, scheduled_date, created_at, description')
    .eq('customer_id', profile.id)
    .order('created_at', { ascending: false })

  const bookingsByCar = new Map<string, BookingSummary[]>()
  for (const booking of (bookings ?? []) as BookingSummary[]) {
    if (!booking.car_id) continue
    bookingsByCar.set(booking.car_id, [...(bookingsByCar.get(booking.car_id) ?? []), booking])
  }

  const totalServiceRecords = (bookings ?? []).filter((booking: any) => booking.car_id).length

  return (
    <div className="animate-fade-in">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">My Cars</h1>
          <p className="page-subtitle">{cars?.length ?? 0} registered vehicles · {totalServiceRecords} service records</p>
        </div>
        <Link href="/dashboard/cars/new" className="btn btn--primary btn--md">
          <Plus size={16} /> Add Car
        </Link>
      </div>

      {(!cars || cars.length === 0) ? (
        <div className="empty-state">
          <CarIcon size={48} className="empty-state__icon" />
          <h3 className="empty-state__title">No cars yet</h3>
          <p className="empty-state__desc">Add your vehicle to track it, find matching repairers, and more.</p>
          <Link href="/dashboard/cars/new" className="btn btn--primary btn--md">Add your first car</Link>
        </div>
      ) : (
        <>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
          <div className="stat-card">
            <div className="stat-card__label">Garage Vehicles</div>
            <div className="stat-card__value">{cars.length}</div>
          </div>
          <div className="stat-card">
            <div className="stat-card__label">Service History</div>
            <div className="stat-card__value">{totalServiceRecords}</div>
          </div>
          <Link href="/repairers?available=1&emergency=1" className="stat-card card--hover" style={{ textDecoration: 'none' }}>
            <div className="stat-card__label">Emergency Help</div>
            <div className="stat-card__value" style={{ fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
              <AlertTriangle size={18} /> Find now
            </div>
          </Link>
        </div>

        <div className="product-grid">
          {(cars as Car[]).map(car => (
            <div key={car.id} className="product-card">
              <div className="product-card__image">
                {car.images?.[0] ? (
                  <img src={car.images[0]} alt={`${car.make} ${car.model}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--color-text-400)' }}>
                    <CarIcon size={48} />
                  </div>
                )}
              </div>
              <div className="product-card__body">
                {(() => {
                  const carBookings = bookingsByCar.get(car.id) ?? []
                  const lastService = carBookings[0]
                  return (
                    <>
                <h3 className="product-card__name">{car.year} {car.make} {car.model}</h3>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
                  {car.color && <Badge variant="default">{car.color}</Badge>}
                  {car.plate_number && <Badge variant="info">{car.plate_number}</Badge>}
                  <Badge variant={car.is_public ? 'success' : 'warning'}>
                    {car.is_public ? 'Public' : 'Private'}
                  </Badge>
                  <Badge variant="accent">{carBookings.length} services</Badge>
                </div>
                {car.mileage != null && (
                  <p style={{ color: 'var(--color-text-300)', fontSize: '0.85rem' }}>{car.mileage.toLocaleString()} km</p>
                )}
                <div style={{ marginTop: 10, padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', background: 'var(--color-surface-800)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, fontSize: '0.82rem', marginBottom: 4 }}>
                    <Wrench size={13} /> Recommended next
                  </div>
                  <p style={{ color: 'var(--color-text-300)', fontSize: '0.78rem', lineHeight: 1.5 }}>
                    {maintenanceRecommendation(car, carBookings.length)}
                  </p>
                  {lastService && (
                    <p style={{ color: 'var(--color-text-400)', fontSize: '0.75rem', marginTop: 6 }}>
                      Last service request: {new Date(lastService.scheduled_date).toLocaleDateString()}
                    </p>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                  <Link href={`/cars/${car.id}`} className="btn btn--secondary btn--sm" style={{ flex: 1, textAlign: 'center' }}>View</Link>
                  <Link href={`/dashboard/cars/${car.id}/edit`} className="btn btn--ghost btn--sm" style={{ flex: 1, textAlign: 'center' }}>Edit</Link>
                  <Link href={`/repairers?city=${encodeURIComponent(profile.city ?? '')}`} className="btn btn--ghost btn--sm" style={{ flex: 1, textAlign: 'center' }}>Service</Link>
                </div>
                    </>
                  )
                })()}
              </div>
            </div>
          ))}
        </div>
        </>
      )}
    </div>
  )
}
