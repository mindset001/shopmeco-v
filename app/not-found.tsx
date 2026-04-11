import Link from 'next/link'

export default function NotFound() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      textAlign: 'center',
      background: 'var(--color-surface)',
    }}>
      <div style={{ fontSize: '5rem', lineHeight: 1, marginBottom: '1rem', fontWeight: 900, color: 'var(--color-accent)' }}>
        404
      </div>
      <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.75rem' }}>
        Page not found
      </h1>
      <p style={{ color: 'var(--color-text-300)', maxWidth: 420, lineHeight: 1.6, marginBottom: '2rem' }}>
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center' }}>
        <Link href="/" className="btn btn--primary btn--md">Go Home</Link>
        <Link href="/marketplace" className="btn btn--ghost btn--md">Browse Marketplace</Link>
      </div>
    </div>
  )
}
