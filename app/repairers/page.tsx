import Link from 'next/link'
import { MapPin, Wrench, BadgeCheck, ShieldAlert } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getCurrentProfile } from '@/lib/utils/profile'
import Navbar from '@/components/nav/Navbar'
import RatingStars from '@/components/ui/RatingStars'
import RepairersSearchBar from './RepairersSearchBar'
import { categoriesFromSymptoms } from '@/lib/car-owner/insights'

interface PageProps {
  searchParams: Promise<{ city?: string; specialization?: string; available?: string; symptoms?: string; emergency?: string; q?: string }>
}

export default async function RepairersPage({ searchParams }: PageProps) {
  const sp = await searchParams
  const profile = await getCurrentProfile()
  const supabase = await createClient()

  let query = supabase
    .from('profiles')
    .select('*, repairer_details(*)')
    .eq('role', 'repairer')

  if (sp.city) query = query.ilike('city', `%${sp.city}%`)

  const { data: repairers } = await query.order('created_at', { ascending: false }).limit(48)

  let filtered = (repairers ?? []).sort((a: any, b: any) => {
    // Verified repairers appear first
    const av = a.is_verified ? 1 : 0
    const bv = b.is_verified ? 1 : 0
    return bv - av
  })

  if (sp.available === '1') {
    filtered = filtered.filter((r: any) => r.repairer_details?.is_available)
  }

  const symptoms = sp.symptoms?.split(',').filter(Boolean) ?? []
  const requestedSpecs = sp.specialization
    ? sp.specialization.split(',').map((spec) => spec.trim()).filter(Boolean)
    : categoriesFromSymptoms(symptoms)

  if (requestedSpecs.length > 0) {
    const specs = requestedSpecs.map((spec) => spec.toLowerCase())
    filtered = filtered.filter((r: any) =>
      (r.repairer_details?.specializations as string[] ?? []).some((s: string) =>
        specs.some((spec) => s.toLowerCase().includes(spec))
      )
    )
  }

  function matchScore(repairer: any) {
    let score = 0
    if (repairer.is_verified) score += 35
    if (repairer.repairer_details?.is_available) score += 25
    if (Number(repairer.repairer_details?.rating ?? 0) >= 4) score += 15
    const specs = (repairer.repairer_details?.specializations as string[] ?? []).map((s) => s.toLowerCase())
    for (const requested of requestedSpecs) {
      if (specs.some((spec) => spec.includes(requested.toLowerCase()))) score += 15
    }
    return Math.min(score, 100)
  }

  filtered = filtered.sort((a: any, b: any) => matchScore(b) - matchScore(a))

  return (
    <>
      <Navbar profile={profile} />
      <div className="container section">
        <div className="page-header">
          <h1 className="page-title">Find Repairers</h1>
          <p className="page-subtitle">Search verified auto repairers near you</p>
        </div>

        <RepairersSearchBar current={sp} />

        {(requestedSpecs.length > 0 || sp.emergency === '1') && (
          <div style={{ marginTop: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
            {sp.emergency === '1' && (
              <span className="badge badge--danger">Emergency mode</span>
            )}
            {requestedSpecs.length > 0 && (
              <span style={{ fontSize: '0.9rem', color: 'var(--color-text-300)' }}>
                Matched for: <strong style={{ color: 'var(--color-accent)' }}>{requestedSpecs.join(', ')}</strong>
              </span>
            )}
          </div>
        )}

        {filtered.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px,1fr))', gap: 'var(--space-6)', marginTop: 'var(--space-8)' }}>
            {(filtered as any[]).map((r) => (
              <Link key={r.id} href={`/repairers/${r.id}`}>
                <div className="card card--hover" style={{ padding: 'var(--space-5)', opacity: r.is_verified ? 1 : 0.82, position: 'relative' }}>
                  {/* Unverified overlay banner */}
                  {!r.is_verified && (
                    <div style={{
                      position: 'absolute', top: 10, right: 10,
                      display: 'flex', alignItems: 'center', gap: 4,
                      background: 'color-mix(in srgb, #f59e0b 15%, var(--color-surface))',
                      border: '1px solid #f59e0b',
                      borderRadius: 'var(--radius-sm)',
                      padding: '0.2rem 0.6rem',
                      fontSize: '0.73rem',
                      fontWeight: 700,
                      color: '#b45309',
                    }}>
                      <ShieldAlert size={11} /> Pending Verification
                    </div>
                  )}

                  <div className="repairer-card__header">
                    <span className="avatar avatar--lg avatar--fallback" style={{ fontSize: 18 }}>
                      {(r.full_name ?? '?')[0]}
                    </span>
                    <div className="repairer-card__info">
                      <div className="repairer-card__name" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {r.full_name}
                        {r.is_verified && <BadgeCheck size={15} style={{ color: 'var(--color-accent)', flexShrink: 0 }} />}
                      </div>
                      <div className="repairer-card__workshop">
                        {r.repairer_details?.workshop_name ?? 'Independent'}
                      </div>
                      <RatingStars rating={r.repairer_details?.rating ?? 0} showValue />
                    </div>
                  </div>

                  {(requestedSpecs.length > 0 || sp.emergency === '1') && (
                    <div style={{ marginTop: 'var(--space-4)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-3)' }}>
                      <span style={{ fontSize: '0.78rem', color: 'var(--color-text-300)' }}>Match confidence</span>
                      <span style={{ fontWeight: 800, color: 'var(--color-accent)' }}>{matchScore(r)}%</span>
                    </div>
                  )}

                  {r.repairer_details?.specializations?.length > 0 && (
                    <div className="repairer-card__tags">
                      {(r.repairer_details.specializations as string[]).slice(0, 3).map((s: string) => (
                        <span key={s} className="badge badge--info">
                          <Wrench size={10} />{s}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="repairer-card__footer">
                    <div className="repairer-card__rate">
                      <MapPin size={12} style={{ display: 'inline', marginRight: 4 }} />
                      {r.city ?? 'Nigeria'}
                    </div>
                    {r.repairer_details?.is_available
                      ? <span className="badge badge--success">Available</span>
                      : <span className="badge badge--default">Busy</span>}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="empty-state" style={{ marginTop: 'var(--space-12)' }}>
            <Wrench size={48} className="empty-state__icon" />
            <div className="empty-state__title">No repairers found</div>
            <div className="empty-state__desc">Try searching a different city, clearing filters, or using emergency mode for available repairers.</div>
            <Link href="/repairers" className="btn btn--ghost btn--md">Clear filters</Link>
          </div>
        )}
      </div>
    </>
  )
}
