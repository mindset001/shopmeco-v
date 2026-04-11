import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getCurrentProfile } from '@/lib/utils/profile'
import Badge from '@/components/ui/Badge'
import Avatar from '@/components/ui/Avatar'
import { Car as CarIcon, MapPin, Calendar, Gauge, MessageSquare, Wrench } from 'lucide-react'

export default async function CarDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [supabase, currentProfile] = await Promise.all([
    createClient(),
    getCurrentProfile(),
  ])

  const { data: car } = await supabase
    .from('cars')
    .select('*, profiles(id, full_name, avatar_url, city, state)')
    .eq('id', id)
    .single()

  if (!car || (!car.is_public && car.owner_id !== currentProfile?.id)) notFound()

  const isOwner = currentProfile?.id === car.owner_id

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-surface-900)' }}>
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '40px 24px' }}>
        <Link href="/cars" style={{ color: 'var(--color-text-300)', fontSize: '0.9rem', textDecoration: 'none', marginBottom: 24, display: 'inline-block' }}>
          ← Back to Cars
        </Link>

        {/* Image gallery */}
        {car.images?.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: car.images.length > 1 ? '1fr 1fr' : '1fr', gap: 8, marginBottom: 32, borderRadius: 16, overflow: 'hidden', maxHeight: 420 }}>
            {car.images.slice(0, 4).map((url: string, i: number) => (
              <img key={i} src={url} alt={`${car.make} ${car.model}`} style={{ width: '100%', height: car.images.length === 1 ? 420 : 206, objectFit: 'cover' }} />
            ))}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 32, alignItems: 'start' }}>
          {/* Main info */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <h1 style={{ fontSize: '1.8rem', fontWeight: 700 }}>{car.year} {car.make} {car.model}</h1>
              {isOwner && (
                <Link href={`/dashboard/cars/${car.id}/edit`} className="btn btn--secondary btn--sm">Edit</Link>
              )}
            </div>

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24 }}>
              {car.color && <Badge variant="default">{car.color}</Badge>}
              {car.plate_number && <Badge variant="info">{car.plate_number}</Badge>}
              <Badge variant={car.is_public ? 'success' : 'warning'}>{car.is_public ? 'Public' : 'Private'}</Badge>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
              <div className="stat-card">
                <div className="stat-card__label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Calendar size={14} /> Year</div>
                <div className="stat-card__value" style={{ fontSize: '1.4rem' }}>{car.year}</div>
              </div>
              {car.mileage != null && (
                <div className="stat-card">
                  <div className="stat-card__label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Gauge size={14} /> Mileage</div>
                  <div className="stat-card__value" style={{ fontSize: '1.4rem' }}>{car.mileage.toLocaleString()} km</div>
                </div>
              )}
            </div>

            {car.description && (
              <div className="card" style={{ padding: 'var(--space-6)', marginBottom: 24 }}>
                <h2 style={{ fontWeight: 600, marginBottom: 12 }}>About this car</h2>
                <p style={{ color: 'var(--color-text-200)', lineHeight: 1.7, whiteSpace: 'pre-line' }}>{car.description}</p>
              </div>
            )}

            {/* CTA for non-owners */}
            {!isOwner && currentProfile && (
              <div style={{ display: 'flex', gap: 12 }}>
                <Link href={`/chat?with=${car.owner_id}`} className="btn btn--primary btn--md">
                  <MessageSquare size={16} /> Message Owner
                </Link>
                <Link href="/repairers" className="btn btn--secondary btn--md">
                  <Wrench size={16} /> Find Repairers
                </Link>
              </div>
            )}
            {!currentProfile && (
              <Link href="/login" className="btn btn--primary btn--md">Login to contact owner</Link>
            )}
          </div>

          {/* Owner card */}
          <div className="card" style={{ padding: 'var(--space-6)', position: 'sticky', top: 24 }}>
            <h3 style={{ fontWeight: 600, marginBottom: 16 }}>Owner</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <Avatar src={car.profiles?.avatar_url} name={car.profiles?.full_name} size="md" />
              <div>
                <p style={{ fontWeight: 600 }}>{car.profiles?.full_name ?? 'Unknown'}</p>
                {(car.profiles?.city || car.profiles?.state) && (
                  <p style={{ color: 'var(--color-text-300)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <MapPin size={12} /> {[car.profiles.city, car.profiles.state].filter(Boolean).join(', ')}
                  </p>
                )}
              </div>
            </div>
            {!isOwner && currentProfile && (
              <Link href={`/chat?with=${car.owner_id}`} className="btn btn--primary btn--sm" style={{ width: '100%', textAlign: 'center', display: 'block' }}>
                Send Message
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
