import Link from 'next/link'
import { MapPin, Users, Wrench, HeadphonesIcon, TrendingUp, Code2, ChevronRight } from 'lucide-react'
import Navbar from '@/components/nav/Navbar'
import { getCurrentProfile } from '@/lib/utils/profile'
import { RevealOnScroll } from '@/components/landing/LandingAnimations'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Careers — ShopMecko',
  description: 'Join the team building Nigeria\'s leading auto repair and parts marketplace.',
}

const values = [
  {
    title: 'Built for Nigeria',
    desc: 'Everything we build is shaped around how Nigerians actually own, maintain, and repair their cars — not a copy of something foreign.',
  },
  {
    title: 'Honesty first',
    desc: 'We say what we mean, ship what we promise, and own our mistakes. No corporate speak, no finger pointing.',
  },
  {
    title: 'Speed matters',
    desc: 'A car owner waiting on a mechanic has no time for slow software. We move fast and build things that work.',
  },
  {
    title: 'Real impact',
    desc: 'When a mechanic on ShopMecko earns more this month than last, that is the product working. We measure the outcomes that matter.',
  },
]

const openRoles = [
  {
    icon: MapPin,
    title: 'Field Agent',
    type: 'Full-time · Field',
    location: 'Lagos, Abuja, Port Harcourt',
    desc: 'Verify mechanic workshops, onboard new repairers, and be our eyes and ears on the ground. You know the city, you know the hustle.',
    tag: 'Operations',
  },
  {
    icon: HeadphonesIcon,
    title: 'Customer Support Specialist',
    type: 'Full-time · Remote',
    location: 'Nigeria (Remote)',
    desc: 'Help car owners and mechanics resolve issues fast. You will handle disputes, guide first-time users, and keep satisfaction high.',
    tag: 'Support',
  },
  {
    icon: TrendingUp,
    title: 'Seller Acquisition Lead',
    type: 'Full-time · Hybrid',
    location: 'Lagos',
    desc: 'Bring verified parts sellers onto the platform. You will pitch, close, and own the growth of our marketplace supply side.',
    tag: 'Growth',
  },
  {
    icon: Code2,
    title: 'Full-Stack Engineer',
    type: 'Full-time · Remote',
    location: 'Nigeria (Remote)',
    desc: 'Build and scale the platform — Next.js, Supabase, real-time features. You will own features end-to-end, from DB schema to UI.',
    tag: 'Engineering',
  },
  {
    icon: Wrench,
    title: 'Mechanic Verification Officer',
    type: 'Contract · Field',
    location: 'Multiple cities',
    desc: 'Inspect workshop facilities, validate certifications, and help us maintain a trusted directory of repairers across Nigeria.',
    tag: 'Operations',
  },
  {
    icon: Users,
    title: 'Community & Partnerships Manager',
    type: 'Full-time · Hybrid',
    location: 'Lagos',
    desc: 'Build relationships with mechanic associations, auto parts dealers, and car clubs. Turn the community into our biggest distribution channel.',
    tag: 'Growth',
  },
]

const tagColor: Record<string, string> = {
  Operations: 'var(--color-accent)',
  Support: 'var(--color-success)',
  Growth: '#f59e0b',
  Engineering: '#8b5cf6',
}

export default async function CareersPage() {
  const profile = await getCurrentProfile()

  return (
    <>
      <Navbar profile={profile} />
      <main>

        {/* ── Hero ── */}
        <section className="container animate-fade-in" style={{ paddingTop: 'var(--space-20)', paddingBottom: 'var(--space-16)', textAlign: 'center', maxWidth: 720 }}>
          <span className="section-label">We&apos;re hiring</span>
          <h1 className="section-heading" style={{ fontSize: 'clamp(2rem, 5vw, 3.25rem)', marginTop: 'var(--space-3)', marginBottom: 'var(--space-5)' }}>
            Help us fix the way Nigeria maintains its cars
          </h1>
          <p style={{ fontSize: '1.125rem', color: 'var(--color-text-300)', lineHeight: 1.75, marginBottom: 'var(--space-8)' }}>
            ShopMecko connects car owners with trusted mechanics and spare parts sellers across Nigeria.
            We are a small, focused team — every person here has a visible impact.
          </p>
          <a href="#roles" className="btn btn--primary btn--lg">
            See open roles <ChevronRight size={18} />
          </a>
        </section>

        {/* ── Values ── */}
        <section style={{ background: 'var(--color-surface-800)', borderTop: '1px solid var(--color-border)', borderBottom: '1px solid var(--color-border)', padding: 'var(--space-16) 0' }}>
          <div className="container">
            <div style={{ textAlign: 'center', marginBottom: 'var(--space-12)' }}>
              <span className="section-label">How we work</span>
              <h2 className="section-heading">What we believe in</h2>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 'var(--space-6)' }}>
              {values.map((v, i) => (
                <RevealOnScroll key={v.title} delay={i * 80}>
                  <div className="card" style={{ padding: 'var(--space-6)', height: '100%' }}>
                    <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 'var(--space-2)', color: 'var(--color-text-100)' }}>
                      {v.title}
                    </div>
                    <div style={{ fontSize: '0.9rem', color: 'var(--color-text-300)', lineHeight: 1.7 }}>
                      {v.desc}
                    </div>
                  </div>
                </RevealOnScroll>
              ))}
            </div>
          </div>
        </section>

        {/* ── Open Roles ── */}
        <section id="roles" className="container" style={{ padding: 'var(--space-16) var(--space-4)' }}>
          <div style={{ textAlign: 'center', marginBottom: 'var(--space-12)' }}>
            <span className="section-label">Open positions</span>
            <h2 className="section-heading">Find your role</h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)', maxWidth: 780, margin: '0 auto' }}>
            {openRoles.map((role, i) => (
              <RevealOnScroll key={role.title} delay={i * 60}>
                <div className="card" style={{ padding: 'var(--space-6)' }}>
                  <div style={{ display: 'flex', gap: 'var(--space-4)', alignItems: 'flex-start' }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: 'var(--radius-md)', flexShrink: 0,
                      background: 'var(--color-surface-700)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: tagColor[role.tag] ?? 'var(--color-accent)',
                    }}>
                      <role.icon size={20} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexWrap: 'wrap', marginBottom: 'var(--space-1)' }}>
                        <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--color-text-100)' }}>{role.title}</span>
                        <span style={{
                          fontSize: '0.7rem', fontWeight: 600, padding: '2px 8px', borderRadius: 99,
                          background: `color-mix(in srgb, ${tagColor[role.tag] ?? 'var(--color-accent)'} 15%, transparent)`,
                          color: tagColor[role.tag] ?? 'var(--color-accent)',
                          border: `1px solid color-mix(in srgb, ${tagColor[role.tag] ?? 'var(--color-accent)'} 30%, transparent)`,
                        }}>
                          {role.tag}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--color-text-400)', marginBottom: 'var(--space-3)' }}>
                        {role.type} &nbsp;·&nbsp; <MapPin size={11} style={{ display: 'inline', verticalAlign: 'middle' }} /> {role.location}
                      </div>
                      <p style={{ fontSize: '0.9rem', color: 'var(--color-text-300)', lineHeight: 1.65, margin: 0, marginBottom: 'var(--space-4)' }}>
                        {role.desc}
                      </p>
                      <a
                        href={`mailto:careers@shopmecko.com?subject=Application: ${encodeURIComponent(role.title)}`}
                        className="btn btn--primary btn--sm"
                      >
                        Apply now
                      </a>
                    </div>
                  </div>
                </div>
              </RevealOnScroll>
            ))}
          </div>
        </section>

        {/* ── General CTA ── */}
        <section style={{ borderTop: '1px solid var(--color-border)', padding: 'var(--space-16) 0' }}>
          <div className="container" style={{ maxWidth: 640, textAlign: 'center' }}>
            <span className="section-label">Don&apos;t see your role?</span>
            <h2 className="section-heading" style={{ marginTop: 'var(--space-3)', marginBottom: 'var(--space-5)' }}>
              Send us an open application
            </h2>
            <p style={{ color: 'var(--color-text-300)', fontSize: '1rem', lineHeight: 1.75, marginBottom: 'var(--space-8)' }}>
              If you believe in what we are building and think you can make it better, tell us. We read every message.
            </p>
            <div style={{ display: 'flex', gap: 'var(--space-4)', justifyContent: 'center', flexWrap: 'wrap' }}>
              <a href="mailto:careers@shopmecko.com" className="btn btn--primary btn--lg">
                Email us
              </a>
              <Link href="/" className="btn btn--ghost btn--lg">
                Back to ShopMecko
              </Link>
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
