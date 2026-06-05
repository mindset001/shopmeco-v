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
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    // Check if user has valid reset token from email link
    const supabase = createClient()
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setValidToken(true)
      } else {
        setError('Invalid or expired reset link. Please request a new one.')
        router.push('/forgot-password')
      }
    })
  }, [router])

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
