'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Wrench, Lock, CheckCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { toast } from '@/components/ui/Toaster'
import Toaster from '@/components/ui/Toaster'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [validToken, setValidToken] = useState(false)
  const [checkingSession, setCheckingSession] = useState(true)
  const [success, setSuccess] = useState(false)

  // Token verification is deferred to form submission (handleSubmit) rather than
  // run automatically here. Recovery tokens are single-use, and email security
  // scanners (Outlook Safe Links, Gmail link-checking, etc.) auto-GET every link
  // in an inbox to scan it — if we verified on mount, that prefetch would burn
  // the token before the real user ever clicks, leaving them with "link expired".
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('token_hash') || params.get('code')) {
      setValidToken(true)
      setCheckingSession(false)
      return
    }

    // No token in URL — only valid if a recovery session already exists (e.g. page refresh)
    const supabase = createClient()
    supabase.auth.getSession().then(({ data: { session } }) => {
      setValidToken(!!session?.user)
      setCheckingSession(false)
    })
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!password || !confirmPassword) {
      setError('Please fill in all fields')
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)

    const supabase = createClient()
    const params = new URLSearchParams(window.location.search)
    const tokenHash = params.get('token_hash')
    const code = params.get('code')

    if (tokenHash) {
      const { error: verifyError } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: 'recovery' })
      if (verifyError) {
        setError('This link has expired or already been used. Request a new one.')
        setValidToken(false)
        setLoading(false)
        return
      }
    } else if (code) {
      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
      if (exchangeError) {
        setError('This link has expired or already been used. Request a new one.')
        setValidToken(false)
        setLoading(false)
        return
      }
    }

    const { error: updateError } = await supabase.auth.updateUser({
      password,
    })

    if (updateError) {
      setError(updateError.message)
      setLoading(false)
      return
    }

    setSuccess(true)
    toast('Password reset successfully!', 'success')

    setTimeout(() => {
      router.push('/dashboard')
      router.refresh()
    }, 2000)
  }

  if (checkingSession) {
    return null
  }

  if (!validToken) {
    return (
      <>
        <Toaster />
        <div className="auth-layout">
          <div className="auth-card">
            <div className="auth-logo">
              <Wrench size={26} style={{ color: 'var(--color-accent)' }} />
              ShopMecko
            </div>
            <h1 className="auth-title">Invalid link</h1>
            <p className="auth-subtitle">This password reset link has expired or is invalid.</p>
            <Button 
              type="button" 
              fullWidth 
              onClick={() => router.push('/forgot-password')}
              style={{ marginTop: 'var(--space-6)' }}
            >
              Request new link
            </Button>
          </div>
        </div>
      </>
    )
  }

  if (success) {
    return (
      <>
        <Toaster />
        <div className="auth-layout">
          <div className="auth-card">
            <div style={{ textAlign: 'center', marginBottom: 'var(--space-6)' }}>
              <CheckCircle size={48} style={{ color: 'var(--color-success)', marginBottom: 'var(--space-3)' }} />
            </div>
            <h1 className="auth-title">Password reset successful</h1>
            <p className="auth-subtitle">
              Your password has been updated. You'll be redirected to your dashboard shortly.
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
          <div className="auth-logo">
            <Wrench size={26} style={{ color: 'var(--color-accent)' }} />
            ShopMecko
          </div>

          <h1 className="auth-title">Set new password</h1>
          <p className="auth-subtitle">Create a strong password for your account.</p>

          <form className="auth-form" onSubmit={handleSubmit}>
            <Input
              label="New password"
              type="password"
              placeholder="Min. 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              icon={<Lock size={16} />}
              required
              minLength={8}
              autoComplete="new-password"
            />
            <Input
              label="Confirm password"
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              icon={<Lock size={16} />}
              required
              minLength={8}
              autoComplete="new-password"
            />
            {error && (
              <p style={{ color: 'var(--color-danger)', fontSize: '0.875rem' }}>
                {error}
              </p>
            )}
            <Button type="submit" fullWidth loading={loading} size="lg">
              Reset password
            </Button>
          </form>
        </div>
      </div>
    </>
  )
}
