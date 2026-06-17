import dynamic from 'next/dynamic'

const MultiMarkerMap = dynamic(() => import('./MultiMarkerMap'), {
  ssr: false,
  loading: () => (
    <div style={{
      height: 480,
      background: 'var(--color-surface-700)',
      borderRadius: 'var(--radius-lg)',
      border: '1px solid var(--color-border)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'var(--color-text-400)',
      fontSize: '0.9rem',
    }}>
      Loading map…
    </div>
  ),
})

export type { MapPin } from './MultiMarkerMap'
export default MultiMarkerMap
