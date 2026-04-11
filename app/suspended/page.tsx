import Link from 'next/link'

export default function SuspendedPage() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-surface-900)', padding: 24 }}>
      <div style={{ textAlign: 'center', maxWidth: 480 }}>
        <div style={{ fontSize: '4rem', marginBottom: 16 }}>🚫</div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: 12 }}>Account Suspended</h1>
        <p style={{ color: 'var(--color-text-300)', lineHeight: 1.7, marginBottom: 32 }}>
          Your account has been suspended by an administrator. If you believe this is a mistake, please contact support.
        </p>
        <Link href="/login" className="btn btn--secondary btn--md">Back to Login</Link>
      </div>
    </div>
  )
}
