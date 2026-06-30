import { notFound } from 'next/navigation'
import Link from 'next/link'
import { MapPin, MessageSquare, ShoppingBag, Wrench, Clock, BadgeCheck, ShieldAlert } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getCurrentProfile } from '@/lib/utils/profile'
import Navbar from '@/components/nav/Navbar'
import RatingStars from '@/components/ui/RatingStars'
import ReviewForm from '@/components/reviews/ReviewForm'
import ReviewsList from '@/components/reviews/ReviewsList'

interface PageProps {
  params: Promise<{ id: string }>
}

const REVIEWABLE_ROLES = new Set(['repairer', 'parts_seller'])

export default async function PublicProfilePage({ params }: PageProps) {
  const { id } = await params
  const profile = await getCurrentProfile()
  const supabase = await createClient()

  const { data: viewedProfile } = await supabase.from('profiles').select('*').eq('id', id).single()
  if (!viewedProfile) notFound()

  const isReviewable = REVIEWABLE_ROLES.has(viewedProfile.role)

  const [{ data: repairerDetails }, { data: products }, { data: reviews }] = await Promise.all([
    viewedProfile.role === 'repairer'
      ? supabase.from('repairer_details').select('*').eq('id', id).single()
      : Promise.resolve({ data: null }),
    viewedProfile.role === 'parts_seller'
      ? supabase.from('products').select('id, name, price, images, brand, category').eq('seller_id', id).eq('is_active', true).order('created_at', { ascending: false }).limit(8)
      : Promise.resolve({ data: null }),
    isReviewable
      ? supabase.from('reviews').select('*, reviewer:profiles!reviewer_id(full_name, avatar_url)').eq('repairer_id', id).order('created_at', { ascending: false }).limit(10)
      : Promise.resolve({ data: null }),
  ])

  let hasReviewed = false
  if (isReviewable && profile && profile.id !== id) {
    const { data: existing } = await supabase
      .from('reviews')
      .select('id')
      .eq('repairer_id', id)
      .eq('reviewer_id', profile.id)
      .maybeSingle()
    hasReviewed = !!existing
  }

  const roleLabel: Record<string, string> = {
    car_owner: 'Car Owner',
    repairer: 'Repairer',
    parts_seller: 'Parts Seller',
    field_agent: 'Field Agent',
    admin: 'Admin',
  }

  return (
    <>
      <Navbar profile={profile} />
      <div className="container section">
        {/* Hero card */}
        <div className="card" style={{ padding: 'var(--space-8)', marginBottom: 'var(--space-8)' }}>
          <div style={{ display: 'flex', gap: 'var(--space-6)', alignItems: 'flex-start', flexWrap: 'wrap' }}>
            <span className="avatar avatar--xl avatar--fallback" style={{ fontSize: 28 }}>
              {(viewedProfile.full_name ?? '?')[0]}
            </span>
            <div style={{ flex: 1 }}>
              <h1 style={{ fontSize: '1.75rem', fontWeight: 900, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
                {viewedProfile.full_name ?? 'Unnamed User'}
                {viewedProfile.is_verified && <BadgeCheck size={18} style={{ color: 'var(--color-accent)' }} />}
              </h1>
              {repairerDetails?.workshop_name && (
                <div style={{ color: 'var(--color-accent)', fontWeight: 600, marginBottom: 8 }}>
                  {repairerDetails.workshop_name}
                </div>
              )}
              <div style={{ display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap', marginBottom: 'var(--space-4)', alignItems: 'center' }}>
                <span className="badge badge--default">{roleLabel[viewedProfile.role] ?? viewedProfile.role}</span>
                {isReviewable && (
                  <>
                    <RatingStars rating={viewedProfile.rating ?? 0} showValue size={16} />
                    <span style={{ color: 'var(--color-text-300)', fontSize: '0.875rem' }}>
                      {viewedProfile.total_reviews ?? 0} reviews
                    </span>
                  </>
                )}
                {viewedProfile.role === 'repairer' && (
                  repairerDetails?.is_available
                    ? <span className="badge badge--success">Available</span>
                    : <span className="badge badge--default">Currently Busy</span>
                )}
                {viewedProfile.role === 'repairer' && (
                  viewedProfile.is_verified
                    ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: 'var(--color-accent)', fontWeight: 700, fontSize: '0.85rem' }}><BadgeCheck size={15} /> Verified Mechanic</span>
                    : <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#b45309', fontWeight: 700, fontSize: '0.85rem' }}><ShieldAlert size={15} /> Pending Verification</span>
                )}
              </div>

              <div style={{ display: 'flex', gap: 'var(--space-6)', flexWrap: 'wrap', color: 'var(--color-text-300)', fontSize: '0.9rem' }}>
                {viewedProfile.city && (
                  <span><MapPin size={14} style={{ display: 'inline', marginRight: 4 }} />{viewedProfile.city}{viewedProfile.state ? `, ${viewedProfile.state}` : ''}</span>
                )}
                {repairerDetails?.hourly_rate && (
                  <span><Clock size={14} style={{ display: 'inline', marginRight: 4 }} />₦{Number(repairerDetails.hourly_rate).toLocaleString()}/hr</span>
                )}
              </div>
            </div>

            {profile && profile.id !== id && (
              <Link href={`/chat?with=${id}`} className="btn btn--secondary btn--lg">
                <MessageSquare size={18} /> Message
              </Link>
            )}
          </div>

          {viewedProfile.bio && (
            <p style={{ color: 'var(--color-text-300)', lineHeight: 1.7, marginTop: 'var(--space-6)', borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-6)' }}>
              {viewedProfile.bio}
            </p>
          )}
        </div>

        {/* Repairer specializations */}
        {repairerDetails?.specializations?.length > 0 && (
          <div style={{ marginBottom: 'var(--space-8)' }}>
            <h2 style={{ fontWeight: 700, marginBottom: 'var(--space-4)' }}>Specializations</h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
              {(repairerDetails.specializations as string[]).map((s) => (
                <span key={s} className="badge badge--info" style={{ padding: '0.4rem 1rem', fontSize: '0.9rem' }}>
                  <Wrench size={12} /> {s}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Seller listings */}
        {viewedProfile.role === 'parts_seller' && (
          <div style={{ marginBottom: 'var(--space-8)' }}>
            <h2 style={{ fontWeight: 700, marginBottom: 'var(--space-4)' }}>Listings ({products?.length ?? 0})</h2>
            {products && products.length > 0 ? (
              <div className="product-grid">
                {(products as any[]).map((p) => (
                  <Link key={p.id} href={`/marketplace/${p.id}`}>
                    <div className="card card--hover product-card">
                      <div className="product-card__image">
                        {p.images?.[0] ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={p.images[0]} alt={p.name} />
                        ) : (
                          <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-surface-600)' }}>
                            <ShoppingBag size={44} />
                          </div>
                        )}
                      </div>
                      <div className="product-card__body">
                        <div className="product-card__name">{p.name}</div>
                        <div className="product-card__meta">{[p.brand, p.category].filter(Boolean).join(' · ')}</div>
                        <div className="product-card__price">₦{Number(p.price).toLocaleString()}</div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="empty-state" style={{ padding: 'var(--space-8)' }}>
                <ShoppingBag size={40} className="empty-state__icon" />
                <div className="empty-state__title">No active listings</div>
              </div>
            )}
          </div>
        )}

        {/* Reviews */}
        {isReviewable && (
          <div>
            <h2 style={{ fontWeight: 700, marginBottom: 'var(--space-6)' }}>
              Reviews ({viewedProfile.total_reviews ?? 0})
            </h2>
            <ReviewsList
              reviews={(reviews ?? []) as any[]}
              emptyDesc={`Be the first to review this ${roleLabel[viewedProfile.role]?.toLowerCase() ?? 'user'}.`}
            />

            {profile && profile.id !== id && (
              <div style={{ marginTop: 'var(--space-8)', maxWidth: 480 }}>
                {!hasReviewed ? (
                  <ReviewForm revieweeId={id} reviewerId={profile.id} />
                ) : (
                  <div className="card" style={{ padding: 'var(--space-6)', textAlign: 'center', color: 'var(--color-text-300)' }}>
                    <div style={{ fontSize: '2rem', marginBottom: 8 }}>✅</div>
                    <div style={{ fontWeight: 600 }}>You&apos;ve already reviewed this {roleLabel[viewedProfile.role]?.toLowerCase()}.</div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  )
}
