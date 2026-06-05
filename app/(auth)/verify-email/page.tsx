'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Wrench, Mail, CheckCircle, AlertCircle, Loader } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'
import { toast } from '@/components/ui/Toaster'
import Toaster from '@/components/ui/Toaster'

export default function VerifyEmailPage() {
  const router = useRouter()
  const [verifying, setVerifying] = useState(true)
  const [verified, setVerified] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [resending, setResending] = useState(false)

  useEffect(() => {
    // Check if user came from email confirmation link
    const supabase = createClient()

    async function verifySession() {
      try {
        const { data: { session } } = await supabase.auth.getSession()

        if (session?.user) {
          setUserEmail(session.user.email || null)

          // Check if email is already verified
          if (session.user.email_confirmed_at) {
            setVerified(true)
            setVerifying(false)
            
            // Redirect to dashboard after a brief delay
            toast('Email verified successfully!', 'success')
            setTimeout(() => {
              router.push('/dashboard')
              router.refresh()
            }, 2000)
          } else {
            setVerifying(false)
            setError('Email not yet verified')
          }
        } else {
          setVerifying(false)
          setError('No active session. Please sign up first.')
        }
      } catch (err) {
        setVerifying(false)
        setError(err instanceof Error ? err.message : 'Verification failed')
      }
    }

    verifySession()
  }, [router])

  async function handleResendEmail() {
    if (!userEmail) {
      setError('Email address not found')
      return
    }

    setResending(true)
    const supabase = createClient()

    const { error: resendError } = await supabase.auth.resendEnvelope({
      type: 'signup',
      email: userEmail,
    })

    setResending(false)

    if (resendError) {
      setError(resendError.message)
      return
    }

    toast('Verification email sent! Check your inbox.', 'success')
  }

  if (verifying) {
    return (
      <>
        <Toaster />
        <div className="auth-layout">
          <div className="auth-card">
            <div style={{ textAlign: 'center' }}>
              <Loader 
                size={48} 
                style={{ 
                  color: 'var(--color-accent)',
                  marginBottom: 'var(--space-4)',
                  animation: 'spin 1s linear infinite'
                }} 
              />
            </div>
            <h1 className="auth-title">Verifying email...</h1>
            <p className="auth-subtitle">Please wait while we confirm your email address.</p>
          </div>
        </div>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </>
    )
  }

  if (verified) {
    return (
      <>
        <Toaster />
        <div className="auth-layout">
          <div className="auth-card">
            <div style={{ textAlign: 'center', marginBottom: 'var(--space-6)' }}>
              <CheckCircle 
                size={48} 
                style={{ color: 'var(--color-success)' }} 
              />
            </div>
            <h1 className="auth-title">Email verified!</h1>
            <p className="auth-subtitle">
              Your email has been confirmed. Redirecting to dashboard...
            </p>
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
            <AlertCircle 
              size={48} 
              style={{ color: 'var(--color-warning)' }} 
            />
          </div>

          <h1 className="auth-title">Verify your email</h1>
          <p className="auth-subtitle">
            A verification link has been sent to<br/>
            <strong>{userEmail || 'your email'}</strong>
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
            <p style={{ marginBottom: 'var(--space-3)' }}>
              ✓ Click the link in the email to confirm your account
            </p>
            <p style={{ marginBottom: 'var(--space-3)' }}>
              ✓ The link will expire in 24 hours
            </p>
            <p style={{ marginBottom: 0 }}>
              ✓ Once verified, you can start using ShopMecko
            </p>
          </div>

          {error && (
            <p style={{ color: 'var(--color-danger)', fontSize: '0.875rem', marginBottom: 'var(--space-3)' }}>
              {error}
            </p>
          )}

          <Button
            type="button"
            fullWidth
            variant="secondary"
            onClick={handleResendEmail}
            loading={resending}
            style={{ marginBottom: 'var(--space-3)' }}
          >
            <Mail size={16} style={{ marginRight: 'var(--space-2)' }} />
            Resend verification email
          </Button>

          <div className="auth-footer">
            Did you sign up with the wrong email? <a href="/register" style={{ cursor: 'pointer' }}>Create new account</a>
          </div>
        </div>
      </div>
    </>
  )
}
