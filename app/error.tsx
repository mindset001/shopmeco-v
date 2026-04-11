'use client'

import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

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
      <div style={{ fontSize: '4rem', lineHeight: 1, marginBottom: '1rem' }}>⚠️</div>
      <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.75rem' }}>
        Something went wrong
      </h1>
      <p style={{ color: 'var(--color-text-300)', maxWidth: 420, lineHeight: 1.6, marginBottom: '2rem' }}>
        An unexpected error occurred. Please try again or go back to the home page.
      </p>
      {error.digest && (
        <p style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--color-text-400)', marginBottom: '1.5rem' }}>
          Error ID: {error.digest}
        </p>
      )}
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center' }}>
        <button onClick={reset} className="btn btn--primary btn--md">Try Again</button>
        <a href="/" className="btn btn--ghost btn--md">Go Home</a>
      </div>
    </div>
  )
}
