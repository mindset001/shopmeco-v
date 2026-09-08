import { AlertTriangle } from 'lucide-react'

export default function LegalDocument({
  title,
  lastUpdated,
  children,
}: {
  title: string
  lastUpdated: string
  children: React.ReactNode
}) {
  return (
    <div className="container section" style={{ maxWidth: 760 }}>
      <div className="page-header">
        <h1 className="page-title">{title}</h1>
        <p className="page-subtitle">Last updated: {lastUpdated}</p>
      </div>

      <div
        className="card"
        style={{
          padding: 'var(--space-5)',
          marginBottom: 'var(--space-8)',
          display: 'flex',
          gap: 'var(--space-3)',
          background: 'var(--color-surface-700)',
        }}
      >
        <AlertTriangle size={18} color="var(--color-warning)" style={{ flexShrink: 0, marginTop: 2 }} />
        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-300)', lineHeight: 1.6, margin: 0 }}>
          This is a general-purpose draft describing how ShopMecko actually works today. It is not
          legal advice, and it hasn&apos;t been reviewed by a lawyer. Have it reviewed against Nigerian
          law (including the Nigeria Data Protection Act) before relying on it.
        </p>
      </div>

      <div
        style={{
          color: 'var(--color-text-200)',
          lineHeight: 1.75,
          fontSize: '0.9375rem',
        }}
      >
        <style>{`
          .legal-body h2 { font-size: 1.125rem; font-weight: 700; color: var(--color-text-100); margin: var(--space-8) 0 var(--space-3); }
          .legal-body h2:first-child { margin-top: 0; }
          .legal-body p { margin: 0 0 var(--space-4); }
          .legal-body ul { margin: 0 0 var(--space-4); padding-left: 1.25rem; display: flex; flex-direction: column; gap: var(--space-2); }
          .legal-body a { color: var(--color-accent); }
        `}</style>
        <div className="legal-body">{children}</div>
      </div>
    </div>
  )
}
