'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Wrench, Mail, Lock, LogIn } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { toast } from '@/components/ui/Toaster'
import Toaster from '@/components/ui/Toaster'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = createClient()
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (signInError) {
      setError(signInError.message)
      setLoading(false)
      return
    }

    toast('Welcome back!', 'success')
    router.push('/dashboard')
    router.refresh()
  }

  async function handleGoogleSignIn() {
    setGoogleLoading(true)
    setError(null)

    const supabase = createClient()
    const { data, error: googleError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${typeof window !== 'undefined' ? window.location.origin : ''}/api/auth/callback`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    })

    if (googleError) {
      setError(googleError.message)
      setGoogleLoading(false)
      return
    }

    if (data.url) {
      window.location.href = data.url
    }
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

          <h1 className="auth-title">Welcome back</h1>
          <p className="auth-subtitle">Good to see you again.</p>

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
            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              icon={<Lock size={16} />}
              required
              autoComplete="current-password"
            />
            {error && (
              <p style={{ color: 'var(--color-danger)', fontSize: '0.875rem' }}>
                {error}
              </p>
            )}
            <Button type="submit" fullWidth loading={loading} size="lg">
              Sign in
            </Button>
          </form>

          <div style={{ 
            position: 'relative', 
            margin: 'var(--space-6) 0',
            textAlign: 'center'
          }}>
            <div style={{ 
              position: 'absolute',
              top: '50%',
              left: 0,
              right: 0,
              height: '1px',
              backgroundColor: 'var(--color-border)',
              transform: 'translateY(-50%)'
            }}></div>
            <span style={{ 
              position: 'relative',
              backgroundColor: 'var(--color-bg-100)',
              padding: '0 var(--space-2)',
              fontSize: '0.75rem',
              color: 'var(--color-text-300)',
              textTransform: 'uppercase'
            }}>
              Or
            </span>
          </div>

          <Button 
            type="button"
            fullWidth
            variant="secondary"
            loading={googleLoading}
            onClick={handleGoogleSignIn}
            style={{ marginBottom: 'var(--space-3)' }}
          >
            <LogIn size={16} style={{ marginRight: 'var(--space-2)' }} />
            Continue with Google
          </Button>

          <div className="auth-footer" style={{ flexDirection: 'column', gap: 'var(--space-3)' }}>
            <div>
              Don&apos;t have an account?{' '}
              <Link href="/register">Create one free</Link>
            </div>
            <div style={{ fontSize: '0.875rem', color: 'var(--color-text-300)' }}>
              <Link href="/forgot-password" style={{ color: 'var(--color-accent)', textDecoration: 'none' }}>
                Forgot password?
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
