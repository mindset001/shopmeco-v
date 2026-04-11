import Link from 'next/link'
import { MapPin, Wrench } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getCurrentProfile } from '@/lib/utils/profile'
import Navbar from '@/components/nav/Navbar'
import RatingStars from '@/components/ui/RatingStars'
import RepairersSearchBar from './RepairersSearchBar'

interface PageProps {
  searchParams: Promise<{ city?: string; specialization?: string; available?: string }>
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
  if (sp.available === '1') {
    // filter done client-side on repairer_details
  }

  const { data: repairers } = await query.order('created_at', { ascending: false }).limit(48)

  const filtered = sp.available === '1'
    ? (repairers ?? []).filter((r: any) => r.repairer_details?.is_available)
    : (repairers ?? [])

  return (
    <>
      <Navbar profile={profile} />
      <div className="container section">
        <div className="page-header">
          <h1 className="page-title">Find Repairers</h1>
          <p className="page-subtitle">Search verified auto repairers near you</p>
        </div>

        <RepairersSearchBar current={sp} />

        {filtered.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px,1fr))', gap: 'var(--space-6)', marginTop: 'var(--space-8)' }}>
            {(filtered as any[]).map((r) => (
              <Link key={r.id} href={`/repairers/${r.id}`}>
                <div className="card card--hover" style={{ padding: 'var(--space-5)' }}>
                  <div className="repairer-card__header">
                    <span className="avatar avatar--lg avatar--fallback" style={{ fontSize: 18 }}>
                      {(r.full_name ?? '?')[0]}
                    </span>
                    <div className="repairer-card__info">
                      <div className="repairer-card__name">{r.full_name}</div>
                      <div className="repairer-card__workshop">
                        {r.repairer_details?.workshop_name ?? 'Independent'}
                      </div>
                      <RatingStars rating={r.repairer_details?.rating ?? 0} showValue />
                    </div>
                  </div>

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
                      {r.repairer_details?.hourly_rate && (
                        <> · <strong>₦{Number(r.repairer_details.hourly_rate).toLocaleString()}/hr</strong></>
                      )}
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
            <div className="empty-state__desc">Try searching a different city or clearing filters.</div>
            <Link href="/repairers" className="btn btn--ghost btn--md">Clear filters</Link>
          </div>
        )}
      </div>
    </>
  )
}
