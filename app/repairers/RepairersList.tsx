'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { MapPin, List, Map, Navigation, Wrench, BadgeCheck, ShieldAlert, Loader } from 'lucide-react'
import RatingStars from '@/components/ui/RatingStars'
import MultiMarkerMapClient, { type MapPin as Pin } from '@/components/ui/MultiMarkerMapClient'
import { calculateDistance } from '@/lib/utils/helpers'

interface Repairer {
  id: string
  full_name: string | null
  city: string | null
  state: string | null
  latitude: number | null
  longitude: number | null
  is_verified: boolean
  matchScore: number
  repairer_details: {
    workshop_name?: string | null
    rating?: number | null
    is_available?: boolean
    specializations?: string[]
  } | null
}

interface Props {
  repairers: Repairer[]
  showScore: boolean
}

type ViewMode = 'list' | 'map'

export default function RepairersList({ repairers, showScore }: Props) {
  const [view, setView] = useState<ViewMode>('list')
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [locating, startLocating] = useTransition()
  const [locError, setLocError] = useState<string | null>(null)

  const sorted = userCoords
    ? [...repairers].sort((a, b) => {
        const da = a.latitude && a.longitude
          ? calculateDistance(userCoords.lat, userCoords.lng, a.latitude, a.longitude)
          : Infinity
        const db = b.latitude && b.longitude
          ? calculateDistance(userCoords.lat, userCoords.lng, b.latitude, b.longitude)
          : Infinity
        return da - db
      })
    : repairers

  function handleNearMe() {
    setLocError(null)
    startLocating(() => {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => setLocError('Could not get your location. Allow location access and try again.'),
        { timeout: 8000 }
      )
    })
  }

  const pins: Pin[] = sorted
    .filter((r) => r.latitude && r.longitude)
    .map((r) => ({
      id: r.id,
      lat: r.latitude!,
      lng: r.longitude!,
      label: r.full_name ?? 'Repairer',
      sublabel: r.repairer_details?.workshop_name ?? undefined,
      badge: r.repairer_details?.is_available ? '● Available' : '● Busy',
      available: r.repairer_details?.is_available ?? false,
      href: `/repairers/${r.id}`,
    }))

  const withoutCoords = sorted.filter((r) => !r.latitude || !r.longitude).length

  return (
    <>
      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginTop: 'var(--space-6)', flexWrap: 'wrap' }}>
        {/* View toggle */}
        <div style={{ display: 'flex', background: 'var(--color-surface-700)', borderRadius: 'var(--radius-md)', padding: 3 }}>
          {(['list', 'map'] as ViewMode[]).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '0.4rem 0.85rem',
                borderRadius: 'calc(var(--radius-md) - 2px)',
                border: 'none', cursor: 'pointer',
                fontSize: '0.85rem', fontWeight: 600,
                background: view === v ? 'var(--color-bg-100)' : 'transparent',
                color: view === v ? 'var(--color-text-100)' : 'var(--color-text-400)',
                transition: 'all 0.15s',
              }}
            >
              {v === 'list' ? <List size={14} /> : <Map size={14} />}
              {v === 'list' ? 'List' : 'Map'}
            </button>
          ))}
        </div>

        {/* Near me */}
        <button
          onClick={handleNearMe}
          disabled={locating}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '0.4rem 0.85rem',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border)',
            background: userCoords ? 'color-mix(in srgb, var(--color-accent) 12%, transparent)' : 'transparent',
            color: userCoords ? 'var(--color-accent)' : 'var(--color-text-300)',
            fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer',
          }}
        >
          {locating ? <Loader size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Navigation size={14} />}
          {userCoords ? 'Sorted by distance' : 'Near me'}
        </button>

        {userCoords && (
          <button
            onClick={() => setUserCoords(null)}
            style={{ fontSize: '0.8rem', color: 'var(--color-text-400)', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            ✕ Clear
          </button>
        )}

        {locError && (
          <span style={{ fontSize: '0.8rem', color: 'var(--color-danger)' }}>{locError}</span>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* Map view */}
      {view === 'map' && (
        <div style={{ marginTop: 'var(--space-6)' }}>
          {pins.length > 0 ? (
            <>
              <MultiMarkerMapClient
                pins={pins}
                userPin={userCoords ?? undefined}
                zoom={userCoords ? 12 : 10}
                height={520}
              />
              {withoutCoords > 0 && (
                <p style={{ marginTop: 'var(--space-3)', fontSize: '0.82rem', color: 'var(--color-text-400)' }}>
                  {withoutCoords} repairer{withoutCoords > 1 ? 's' : ''} not shown — no location set on their profile.
                </p>
              )}
            </>
          ) : (
            <div className="empty-state" style={{ marginTop: 'var(--space-8)' }}>
              <MapPin size={40} className="empty-state__icon" />
              <div className="empty-state__title">No mapped locations</div>
              <div className="empty-state__desc">None of the repairers in this search have set their location yet.</div>
            </div>
          )}
        </div>
      )}

      {/* List view */}
      {view === 'list' && (
        <>
          {sorted.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px,1fr))', gap: 'var(--space-6)', marginTop: 'var(--space-8)' }}>
              {sorted.map((r) => {
                const dist = userCoords && r.latitude && r.longitude
                  ? calculateDistance(userCoords.lat, userCoords.lng, r.latitude, r.longitude)
                  : null

                return (
                  <Link key={r.id} href={`/repairers/${r.id}`}>
                    <div className="card card--hover" style={{ padding: 'var(--space-5)', opacity: r.is_verified ? 1 : 0.82, position: 'relative' }}>
                      {!r.is_verified && (
                        <div style={{
                          position: 'absolute', top: 10, right: 10,
                          display: 'flex', alignItems: 'center', gap: 4,
                          background: 'color-mix(in srgb, #f59e0b 15%, var(--color-surface))',
                          border: '1px solid #f59e0b',
                          borderRadius: 'var(--radius-sm)',
                          padding: '0.2rem 0.6rem',
                          fontSize: '0.73rem', fontWeight: 700, color: '#b45309',
                        }}>
                          <ShieldAlert size={11} /> Pending
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

                      {showScore && (
                        <div style={{ marginTop: 'var(--space-4)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: '0.78rem', color: 'var(--color-text-300)' }}>Match confidence</span>
                          <span style={{ fontWeight: 800, color: 'var(--color-accent)' }}>{r.matchScore}%</span>
                        </div>
                      )}

                      {(r.repairer_details?.specializations?.length ?? 0) > 0 && (
                        <div className="repairer-card__tags">
                          {(r.repairer_details!.specializations as string[]).slice(0, 3).map((s) => (
                            <span key={s} className="badge badge--info">
                              <Wrench size={10} />{s}
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="repairer-card__footer">
                        <div className="repairer-card__rate" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <MapPin size={12} />
                          {r.city ?? 'Nigeria'}
                          {dist !== null && (
                            <span style={{ fontSize: '0.75rem', color: 'var(--color-accent)', fontWeight: 600 }}>
                              · {dist < 1 ? `${Math.round(dist * 1000)}m` : `${dist.toFixed(1)}km`}
                            </span>
                          )}
                        </div>
                        {r.repairer_details?.is_available
                          ? <span className="badge badge--success">Available</span>
                          : <span className="badge badge--default">Busy</span>}
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          ) : (
            <div className="empty-state" style={{ marginTop: 'var(--space-12)' }}>
              <Wrench size={48} className="empty-state__icon" />
              <div className="empty-state__title">No repairers found</div>
              <div className="empty-state__desc">Try a different city, clear filters, or use emergency mode.</div>
              <Link href="/repairers" className="btn btn--ghost btn--md">Clear filters</Link>
            </div>
          )}
        </>
      )}
    </>
  )
}
