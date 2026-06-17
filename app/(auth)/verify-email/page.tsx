'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Mail, CheckCircle, Loader } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'
import { toast } from '@/components/ui/Toaster'
import Toaster from '@/components/ui/Toaster'

export default function VerifyEmailPage() {
  const router = useRouter()
  const [checking, setChecking] = useState(true)
  const [verified, setVerified] = useState(false)
  const [email, setEmail] = useState<string | null>(null)
  const [resending, setResending] = useState(false)

  useEffect(() => {
    // ?email param is set right after registration — no session exists yet
    const params = new URLSearchParams(window.location.search)
    const emailParam = params.get('email')

    if (emailParam) {
      setEmail(emailParam)
      setChecking(false)
      return
    }

    // Fallback: user navigated here while already signed in (e.g. unverified session)
    const supabase = createClient()
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setEmail(session.user.email ?? null)
        if (session.user.email_confirmed_at) {
          setVerified(true)
          toast('Email already verified!', 'success')
          setTimeout(() => router.push('/dashboard'), 1500)
        }
      } else {
        router.push('/register')
      }
      setChecking(false)
    })
  }, [router])

  async function handleResend() {
    if (!email) return
    setResending(true)
    const supabase = createClient()
    const { error } = await supabase.auth.resend({ type: 'signup', email })
    setResending(false)
    if (error) {
      toast(error.message, 'error')
    } else {
      toast('Verification email sent! Check your inbox.', 'success')
    }
  }

  if (checking) {
    return (
      <>
        <Toaster />
        <div className="auth-layout">
          <div className="auth-card" style={{ textAlign: 'center' }}>
            <Loader size={40} style={{ color: 'var(--color-accent)', animation: 'spin 1s linear infinite', marginBottom: 'var(--space-4)' }} />
            <p className="auth-subtitle">Just a moment…</p>
          </div>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </>
    )
  }

  if (verified) {
    return (
      <>
        <Toaster />
        <div className="auth-layout">
          <div className="auth-card" style={{ textAlign: 'center' }}>
            <CheckCircle size={48} style={{ color: 'var(--color-success)', marginBottom: 'var(--space-4)' }} />
            <h1 className="auth-title">Email verified!</h1>
            <p className="auth-subtitle">Redirecting you to your dashboard…</p>
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
          <div style={{ textAlign: 'center', marginBottom: 'var(--space-4)' }}>
            <Mail size={48} style={{ color: 'var(--color-accent)' }} />
          </div>

          <h1 className="auth-title">Check your email</h1>
          <p className="auth-subtitle">
            We sent a confirmation link to<br />
            <strong>{email}</strong>
          </p>

          <div style={{
            padding: 'var(--space-4)',
            background: 'var(--color-bg-200)',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.875rem',
            lineHeight: 1.7,
            color: 'var(--color-text-200)',
            margin: 'var(--space-6) 0',
          }}>
            <p style={{ marginBottom: 'var(--space-2)' }}>Click the link in the email to activate your account.</p>
            <p style={{ marginBottom: 0 }}>The link expires in 24 hours. Check your spam folder if you don't see it.</p>
          </div>

          <Button
            type="button"
            fullWidth
            variant="secondary"
            onClick={handleResend}
            loading={resending}
            style={{ marginBottom: 'var(--space-3)' }}
          >
            <Mail size={16} style={{ marginRight: 'var(--space-2)' }} />
            Resend confirmation email
          </Button>

          <div className="auth-footer">
            Wrong email? <a href="/register">Start over</a>
          </div>
        </div>
      </div>
    </>
  )
}
