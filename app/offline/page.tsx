export default function OfflinePage() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      background: 'var(--color-bg-100)',
      textAlign: 'center',
    }}>
      <div style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>🔧</div>
      <h1 style={{
        fontSize: '1.5rem',
        fontWeight: 800,
        color: 'var(--color-text-100)',
        marginBottom: '0.75rem',
      }}>
        You&apos;re offline
      </h1>
      <p style={{
        color: 'var(--color-text-300)',
        fontSize: '1rem',
        lineHeight: 1.6,
        maxWidth: 320,
        marginBottom: '2rem',
      }}>
        No internet connection. Check your network and try again.
      </p>
      <button
        onClick={() => window.location.reload()}
        style={{
          padding: '0.75rem 2rem',
          borderRadius: '0.5rem',
          border: 'none',
          background: 'var(--color-accent)',
          color: '#fff',
          fontWeight: 700,
          fontSize: '0.9375rem',
          cursor: 'pointer',
        }}
      >
        Try again
      </button>
    </div>
  )
}
