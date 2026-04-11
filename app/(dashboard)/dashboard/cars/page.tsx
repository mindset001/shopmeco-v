import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getCurrentProfile } from '@/lib/utils/profile'
import { createClient } from '@/lib/supabase/server'
import Badge from '@/components/ui/Badge'
import type { Car } from '@/types'
import { Plus, Car as CarIcon, Eye, EyeOff } from 'lucide-react'

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

  return (
    <div className="animate-fade-in">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">My Cars</h1>
          <p className="page-subtitle">{cars?.length ?? 0} registered vehicles</p>
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
                <h3 className="product-card__name">{car.year} {car.make} {car.model}</h3>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
                  {car.color && <Badge variant="default">{car.color}</Badge>}
                  {car.plate_number && <Badge variant="info">{car.plate_number}</Badge>}
                  <Badge variant={car.is_public ? 'success' : 'warning'}>
                    {car.is_public ? 'Public' : 'Private'}
                  </Badge>
                </div>
                {car.mileage != null && (
                  <p style={{ color: 'var(--color-text-300)', fontSize: '0.85rem' }}>{car.mileage.toLocaleString()} km</p>
                )}
                <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                  <Link href={`/cars/${car.id}`} className="btn btn--secondary btn--sm" style={{ flex: 1, textAlign: 'center' }}>View</Link>
                  <Link href={`/dashboard/cars/${car.id}/edit`} className="btn btn--ghost btn--sm" style={{ flex: 1, textAlign: 'center' }}>Edit</Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
