import Link from 'next/link'
import Image from 'next/image'
import { Wrench, ShoppingBag, MapPin, MessageSquare, Shield, Zap, ChevronRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import Navbar from '@/components/nav/Navbar'
import { getCurrentProfile } from '@/lib/utils/profile'
import RatingStars from '@/components/ui/RatingStars'
import { HeroTyping, ProofStats, RevealOnScroll } from '@/components/landing/LandingAnimations'

const features = [
  { icon: Wrench, title: 'Trusted Repairers', desc: 'Read real reviews, check ratings, and book someone who has already done good work for other car owners.' },
  { icon: ShoppingBag, title: 'Parts Marketplace', desc: 'From engine parts to body panels — new, used, or dealer-grade. Straight from verified sellers.' },
  { icon: MessageSquare, title: 'Talk to Sellers Directly', desc: 'Ask questions, negotiate prices, and get updates all in one thread. No middlemen in the way.' },
  { icon: MapPin, title: 'People Near You', desc: 'Tell us your city and we show you mechanics and parts sellers who are actually close to you.' },
  { icon: Shield, title: 'Vouched by Real Customers', desc: 'Every repairer profile shows ratings and reviews from actual customers — not curated testimonials.' },
  { icon: Zap, title: 'Order Tracking', desc: 'Know where your part is from the moment it gets packaged to the day it lands at your door.' },
]

export default async function HomePage() {
  const profile = await getCurrentProfile()
  const supabase = await createClient()

  const { data: topRepairers } = await supabase
    .from('profiles')
    .select('*, repairer_details(*)')
    .eq('role', 'repairer')
    .order('created_at', { ascending: false })
    .limit(3)

  const { data: featuredProducts } = await supabase
    .from('products')
    .select('*, profiles(id, full_name, city)')
    .eq('is_active', true)
    .limit(4)

  return (
    <>
      <Navbar profile={profile} />
      <main>
        {/* ── Hero ── */}
        <section className="hero container">
          <div className="hero__content animate-fade-in">
            <div className="hero__tag">
              <Wrench size={14} />
              Made for Nigerian car owners
            </div>
            <h1 className="hero__title">
              Your car deserves the{' '}
              <HeroTyping />
            </h1>
            <p className="hero__desc">
              Find reliable mechanics, buy parts straight from verified sellers, and stop
              overpaying for car maintenance.
            </p>
            <div className="hero__ctas">
              <Link href="/repairers" className="btn btn--primary btn--lg">
                Find a Repairer <ChevronRight size={18} />
              </Link>
              <Link href="/marketplace" className="btn btn--ghost btn--lg">
                Browse Marketplace
              </Link>
            </div>
          </div>

          {/* Mechanic photo — right column */}
          <div className="hero__visual">
            <video
              src="/videos/mech.mp4"
              autoPlay
              loop
              muted
              playsInline
              className="hero__photo"
              style={{ objectFit: 'cover', width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}
            />
            <div className="hero__badge">
              <div style={{ width: 9, height: 9, borderRadius: '50%', background: 'var(--color-success)', flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--color-text-100)', lineHeight: 1.3 }}>Verified mechanics</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-300)', marginTop: 2 }}>Rated by real customers</div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Features ── */}
        <section className="features-section container">
          <div style={{ textAlign: 'center', marginBottom: 'var(--space-12)' }}>
            <span className="section-label">What you get</span>
            <h2 className="section-heading">Fewer headaches for your car</h2>
          </div>
          <div className="features-grid">
            {features.map(({ icon: Icon, title, desc }, i) => (
              <RevealOnScroll key={title} delay={i * 80}>
                <div className="feature-card">
                  <div className="feature-icon"><Icon size={24} /></div>
                  <div className="feature-title">{title}</div>
                  <div className="feature-desc">{desc}</div>
                </div>
              </RevealOnScroll>
            ))}
          </div>
        </section>

        {/* ── Proof Banner ── */}
        <div className="proof-banner">
          <Image
            src="/images/workshop.jpg"
            alt=""
            fill
            sizes="100vw"
            className="proof-banner__img"
          />
          <div className="proof-banner__overlay">
            <ProofStats />
          </div>
        </div>

        {/* ── Top Repairers ── */}
        {topRepairers && topRepairers.length > 0 && (
          <section className="features-section container">
            <div className="section-header">
              <div>
                <span className="section-label">On ShopMecko</span>
                <h2 className="section-heading" style={{ marginBottom: 0 }}>Repairers near you</h2>
              </div>
              <Link href="/repairers" className="btn btn--ghost btn--sm">
                View all <ChevronRight size={14} />
              </Link>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px,1fr))', gap: 'var(--space-6)', marginTop: 'var(--space-6)' }}>
              {(topRepairers as any[]).map((r, i) => (
                <RevealOnScroll key={r.id} delay={i * 100}>
                  <Link href={`/repairers/${r.id}`}>
                    <div className="card card--hover" style={{ padding: 'var(--space-5)' }}>
                      <div className="repairer-card__header">
                        <span className="avatar avatar--lg avatar--fallback" style={{ fontSize: 18 }}>
                          {(r.full_name ?? '?')[0]}
                        </span>
                        <div className="repairer-card__info">
                          <div className="repairer-card__name">{r.full_name ?? 'Repairer'}</div>
                          <div className="repairer-card__workshop">{r.repairer_details?.workshop_name ?? 'Workshop'}</div>
                          <RatingStars rating={r.repairer_details?.rating ?? 0} showValue />
                        </div>
                      </div>
                      <div className="repairer-card__footer">
                        <span style={{ fontSize: '0.85rem', color: 'var(--color-text-300)' }}>
                          <MapPin size={12} style={{ display: 'inline', marginRight: 4 }} />
                          {r.city ?? 'Nigeria'}
                        </span>
                        {r.repairer_details?.is_available
                          ? <span className="badge badge--success">Available</span>
                          : <span className="badge badge--default">Busy</span>}
                      </div>
                    </div>
                  </Link>
                </RevealOnScroll>
              ))}
            </div>
          </section>
        )}

        {/* ── Featured Products ── */}
        {featuredProducts && featuredProducts.length > 0 && (
          <section className="features-section container">
            <div className="section-header">
              <div>
                <span className="section-label">For sale now</span>
                <h2 className="section-heading" style={{ marginBottom: 0 }}>Parts from real sellers</h2>
              </div>
              <Link href="/marketplace" className="btn btn--ghost btn--sm">
                View all <ChevronRight size={14} />
              </Link>
            </div>
            <div className="product-grid" style={{ marginTop: 'var(--space-6)' }}>
              {(featuredProducts as any[]).map((p, i) => (
                <RevealOnScroll key={p.id} delay={i * 90}>
                  <Link href={`/marketplace/${p.id}`}>
                    <div className="card card--hover product-card">
                      <div className="product-card__image">
                        {p.images?.[0]
                          // eslint-disable-next-line @next/next/no-img-element
                          ? <img src={p.images[0]} alt={p.name} />
                          : <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-surface-600)' }}><ShoppingBag size={40} /></div>}
                      </div>
                      <div className="product-card__body">
                        <div className="product-card__name">{p.name}</div>
                        <div className="product-card__meta">{p.brand} · {p.category}</div>
                        <div className="product-card__price">₦{Number(p.price).toLocaleString()}</div>
                      </div>
                    </div>
                  </Link>
                </RevealOnScroll>
              ))}
            </div>
          </section>
        )}

        {/* ── CTA ── */}
        <section className="cta-section container">
          <div className="cta-img-wrap">
            <Image
              src="/images/tools.jpg"
              alt=""
              fill
              sizes="(max-width: 1200px) 100vw, 1200px"
              className="cta-bg-img"
            />
            <div className="cta-overlay" />
            <div className="cta-box">
              <h2 className="section-heading" style={{ color: '#fff' }}>Join ShopMecko</h2>
              <p style={{ color: 'rgba(255,255,255,0.65)', marginBottom: 'var(--space-8)', fontSize: '1.0625rem' }}>
                Car owners, mechanics, and parts sellers are already on here. Sign up in under a minute.
              </p>
              <div style={{ display: 'flex', gap: 'var(--space-4)', justifyContent: 'center', flexWrap: 'wrap' }}>
                <Link href="/register" className="btn btn--primary btn--lg">Create your account</Link>
                <Link href="/marketplace" className="btn btn--ghost btn--lg" style={{ borderColor: 'rgba(255,255,255,0.25)', color: '#fff' }}>Browse marketplace</Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer style={{ borderTop: '1px solid var(--color-border)', padding: 'var(--space-8) 0', textAlign: 'center', color: 'var(--color-text-400)', fontSize: '0.875rem' }}>
        <div className="container">© {new Date().getFullYear()} ShopMecko. All rights reserved.</div>
      </footer>
    </>
  )
}
