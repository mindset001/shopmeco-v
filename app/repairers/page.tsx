import { createClient } from '@/lib/supabase/server'
import { getCurrentProfile } from '@/lib/utils/profile'
import Navbar from '@/components/nav/Navbar'
import RepairersSearchBar from './RepairersSearchBar'
import RepairersList from './RepairersList'
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

  const scored = filtered
    .map((r: any) => ({ ...r, matchScore: matchScore(r) }))
    .sort((a, b) => b.matchScore - a.matchScore)

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

        <RepairersList
          repairers={scored}
          showScore={requestedSpecs.length > 0 || sp.emergency === '1'}
        />
      </div>
    </>
  )
}
