import { notFound } from 'next/navigation'
import Link from 'next/link'
import { MapPin, Wrench, Clock, MessageSquare, Calendar } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getCurrentProfile } from '@/lib/utils/profile'
import Navbar from '@/components/nav/Navbar'
import RatingStars from '@/components/ui/RatingStars'
import { formatDate } from '@/lib/utils/helpers'
import BookingForm from './BookingForm'
import ReviewForm from './ReviewForm'
import type { Metadata } from 'next'
import LocationMapClient from '@/components/ui/LocationMapClient'

interface PageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const [{ data: repairer }, { data: details }] = await Promise.all([
    supabase.from('profiles').select('full_name, city, state, avatar_url').eq('id', id).single(),
    supabase.from('repairer_details').select('workshop_name, rating, specializations').eq('id', id).single(),
  ])
  if (!repairer) return { title: 'Repairer not found — ShopMeco' }
  const title = details?.workshop_name
    ? `${details.workshop_name} (${repairer.full_name}) — ShopMeco`
    : `${repairer.full_name} — Repairer on ShopMeco`
  const location = repairer.city ? ` in ${repairer.city}${repairer.state ? `, ${repairer.state}` : ''}` : ''
  const specs = details?.specializations?.length ? ` Specializes in ${details.specializations.slice(0, 3).join(', ')}.` : ''
  return {
    title,
    description: `Book ${repairer.full_name}${location} for auto repair services.${specs}`,
    openGraph: {
      title,
      description: `Book ${repairer.full_name}${location} for auto repair.${specs}`,
      images: repairer.avatar_url ? [{ url: repairer.avatar_url }] : [],
    },
  }
}

export default async function RepairerDetailPage({ params }: PageProps) {
  const { id } = await params
  const profile = await getCurrentProfile()
  const supabase = await createClient()

  const [{ data: repairer }, { data: details }, { data: reviews }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', id).single(),
    supabase.from('repairer_details').select('*').eq('id', id).single(),
    supabase.from('reviews').select('*, reviewer:profiles!reviewer_id(full_name, avatar_url)').eq('repairer_id', id).order('created_at', { ascending: false }).limit(10),
  ])

  if (!repairer || repairer.role !== 'repairer') notFound()

  // Check if current user already reviewed this repairer
  let hasReviewed = false
  if (profile && profile.id !== id) {
    const { data: existing } = await supabase
      .from('reviews')
      .select('id')
      .eq('repairer_id', id)
      .eq('reviewer_id', profile.id)
      .maybeSingle()
    hasReviewed = !!existing
  }

  return (
    <>
      <Navbar profile={profile} />
      <div className="container section">
        {/* Hero card */}
        <div className="card" style={{ padding: 'var(--space-8)', marginBottom: 'var(--space-8)' }}>
          <div style={{ display: 'flex', gap: 'var(--space-6)', alignItems: 'flex-start', flexWrap: 'wrap' }}>
            <span className="avatar avatar--xl avatar--fallback" style={{ fontSize: 28 }}>
              {(repairer.full_name ?? '?')[0]}
            </span>
            <div style={{ flex: 1 }}>
              <h1 style={{ fontSize: '1.75rem', fontWeight: 900, marginBottom: 4 }}>{repairer.full_name}</h1>
              {details?.workshop_name && (
                <div style={{ color: 'var(--color-accent)', fontWeight: 600, marginBottom: 8 }}>
                  {details.workshop_name}
                </div>
              )}
              <div style={{ display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap', marginBottom: 'var(--space-4)' }}>
                {details && <RatingStars rating={details.rating ?? 0} showValue size={16} />}
                <span style={{ color: 'var(--color-text-300)', fontSize: '0.875rem' }}>
                  {details?.total_reviews ?? 0} reviews
                </span>
                {details?.is_available
                  ? <span className="badge badge--success">Available</span>
                  : <span className="badge badge--default">Currently Busy</span>}
              </div>

              <div style={{ display: 'flex', gap: 'var(--space-6)', flexWrap: 'wrap', color: 'var(--color-text-300)', fontSize: '0.9rem' }}>
                {repairer.city && (
                  <span><MapPin size={14} style={{ display: 'inline', marginRight: 4 }} />{repairer.city}, {repairer.state}</span>
                )}
                {details?.hourly_rate && (
                  <span><Clock size={14} style={{ display: 'inline', marginRight: 4 }} />₦{Number(details.hourly_rate).toLocaleString()}/hr</span>
                )}
                {details?.years_experience && (
                  <span><Wrench size={14} style={{ display: 'inline', marginRight: 4 }} />{details.years_experience} yrs experience</span>
                )}
              </div>
            </div>

            {profile && profile.id !== id && (
              <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
                <Link href={`/chat?with=${id}`} className="btn btn--secondary btn--lg">
                  <MessageSquare size={18} /> Message
                </Link>
                <Link href="#book" className="btn btn--primary btn--lg">
                  <Calendar size={18} /> Book Appointment
                </Link>
              </div>
            )}
          </div>

          {repairer.bio && (
            <p style={{ color: 'var(--color-text-300)', lineHeight: 1.7, marginTop: 'var(--space-6)', borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-6)' }}>
              {repairer.bio}
            </p>
          )}
        </div>

        {/* Location map */}
        {repairer.latitude && repairer.longitude && (
          <div className="card" style={{ padding: 'var(--space-6)', marginBottom: 'var(--space-8)' }}>
            <h2 style={{ fontWeight: 700, marginBottom: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <MapPin size={18} /> Workshop Location
            </h2>
            <LocationMapClient
              lat={repairer.latitude}
              lng={repairer.longitude}
              label={details?.workshop_name ?? repairer.full_name ?? 'Workshop'}
            />
          </div>
        )}

        {/* Specializations */}
        {details?.specializations?.length > 0 && (
          <div style={{ marginBottom: 'var(--space-8)' }}>
            <h2 style={{ fontWeight: 700, marginBottom: 'var(--space-4)' }}>Specializations</h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
              {(details.specializations as string[]).map((s) => (
                <span key={s} className="badge badge--info" style={{ padding: '0.4rem 1rem', fontSize: '0.9rem' }}>
                  <Wrench size={12} /> {s}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Reviews */}
        <div>
          <h2 style={{ fontWeight: 700, marginBottom: 'var(--space-6)' }}>
            Reviews ({details?.total_reviews ?? 0})
          </h2>
          {reviews && reviews.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              {(reviews as any[]).map((rev) => (
                <div key={rev.id} className="card" style={{ padding: 'var(--space-5)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
                    <span style={{ fontWeight: 600 }}>{rev.reviewer?.full_name ?? 'Customer'}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <RatingStars rating={rev.rating} size={13} />
                      <span style={{ fontSize: '0.8rem', color: 'var(--color-text-400)' }}>{formatDate(rev.created_at)}</span>
                    </div>
                  </div>
                  {rev.comment && <p style={{ color: 'var(--color-text-300)', fontSize: '0.9rem', lineHeight: 1.6 }}>{rev.comment}</p>}
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state" style={{ padding: 'var(--space-8)' }}>
              <div className="empty-state__title">No reviews yet</div>
              <div className="empty-state__desc">Be the first to review this repairer.</div>
            </div>
          )}
        </div>

        {/* Booking form + review form */}
        {profile && profile.id !== id && (
          <div
            id="book"
            style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--space-6)', marginTop: 'var(--space-8)' }}
          >
            <BookingForm repairerId={id} customerId={profile.id} />
            {!hasReviewed ? (
              <ReviewForm repairerId={id} reviewerId={profile.id} />
            ) : (
              <div className="card" style={{ padding: 'var(--space-6)', textAlign: 'center', color: 'var(--color-text-300)' }}>
                <div style={{ fontSize: '2rem', marginBottom: 8 }}>✅</div>
                <div style={{ fontWeight: 600 }}>You&apos;ve already reviewed this repairer.</div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  )
}
