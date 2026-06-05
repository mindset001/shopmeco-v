'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Wrench, Mail, ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { toast } from '@/components/ui/Toaster'
import Toaster from '@/components/ui/Toaster'

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = createClient()
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })

    if (resetError) {
      setError(resetError.message)
      setLoading(false)
      return
    }

    setSubmitted(true)
    toast('Check your email for password reset link', 'success')
  }

  if (submitted) {
    return (
      <>
        <Toaster />
        <div className="auth-layout">
          <div className="auth-card">
            <div className="auth-logo">
              <Wrench size={26} style={{ color: 'var(--color-accent)' }} />
              ShopMecko
            </div>

            <h1 className="auth-title">Check your email</h1>
            <p className="auth-subtitle">
              We've sent a password reset link to <strong>{email}</strong>
            </p>

            <div style={{ 
              padding: 'var(--space-4)',
              backgroundColor: 'var(--color-bg-200)',
              borderRadius: 'var(--radius-md)',
              marginBottom: 'var(--space-4)',
              marginTop: 'var(--space-6)',
              fontSize: '0.875rem',
              lineHeight: 1.6,
              color: 'var(--color-text-200)'
            }}>
              <p style={{ marginBottom: 'var(--space-2)' }}>
                💡 <strong>Didn't receive it?</strong>
              </p>
              <ul style={{ marginLeft: 'var(--space-4)', marginBottom: 0 }}>
                <li>Check your spam or junk folder</li>
                <li>The link will expire in 24 hours</li>
                <li>Click the link to reset your password</li>
              </ul>
            </div>

            <Button
              type="button"
              fullWidth
              variant="secondary"
              onClick={() => setSubmitted(false)}
              style={{ marginBottom: 'var(--space-3)' }}
            >
              <ArrowLeft size={16} style={{ marginRight: 'var(--space-2)' }} />
              Try another email
            </Button>

            <div className="auth-footer">
              Remember your password? <Link href="/login">Sign in</Link>
            </div>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <Toaster />
      <div className="auth-layout">
        <div className="auth-card">
          <div className="auth-logo">
            <Wrench size={26} style={{ color: 'var(--color-accent)' }} />
            ShopMecko
          </div>

          <h1 className="auth-title">Forgot password?</h1>
          <p className="auth-subtitle">
            No worries. We'll send you a link to reset it.
          </p>

          <form className="auth-form" onSubmit={handleSubmit}>
            <Input
              label="Email address"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              icon={<Mail size={16} />}
              required
              autoComplete="email"
            />
            {error && (
              <p style={{ color: 'var(--color-danger)', fontSize: '0.875rem' }}>
                {error}
              </p>
            )}
            <Button type="submit" fullWidth loading={loading} size="lg">
              Send reset link
            </Button>
          </form>

          <div className="auth-footer">
            <Link href="/login">Back to sign in</Link>
          </div>
        </div>
      </div>
    </>
  )
}
