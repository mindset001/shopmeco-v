'use client'

import dynamic from 'next/dynamic'

const LocationMap = dynamic(() => import('./LocationMap'), {
  ssr: false,
  loading: () => (
    <div style={{ height: 280, background: 'var(--color-surface-800)', borderRadius: 'var(--radius-lg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-400)', border: '1px solid var(--color-border)' }}>
      Loading map…
    </div>
  ),
})

export default function LocationMapClient(props: React.ComponentProps<typeof LocationMap>) {
  return <LocationMap {...props} />
}
