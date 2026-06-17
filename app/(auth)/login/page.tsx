'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Wrench, Mail, Lock, LogIn, Phone, MessageSquare } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { toast } from '@/components/ui/Toaster'
import Toaster from '@/components/ui/Toaster'

type LoginMethod = 'email' | 'phone'
type PhoneStep = 'enter' | 'verify'

function toE164(raw: string): string {
  const digits = raw.replace(/\D/g, '')
  if (digits.startsWith('234')) return `+${digits}`
  if (digits.startsWith('0')) return `+234${digits.slice(1)}`
  return `+${digits}`
}

export default function LoginPage() {
  const router = useRouter()

  // shared
  const [method, setMethod] = useState<LoginMethod>('email')
  const [error, setError] = useState<string | null>(null)

  // email
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [emailLoading, setEmailLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  // phone
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [phoneStep, setPhoneStep] = useState<PhoneStep>('enter')
  const [phoneLoading, setPhoneLoading] = useState(false)

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setEmailLoading(true)

    const supabase = createClient()
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })

    if (signInError) {
      setError(signInError.message)
      setEmailLoading(false)
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
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || (typeof window !== 'undefined' ? window.location.origin : '')}/api/auth/callback`,
        queryParams: { access_type: 'offline', prompt: 'consent' },
      },
    })

    if (googleError) {
      setError(googleError.message)
      setGoogleLoading(false)
      return
    }

    if (data.url) window.location.href = data.url
  }

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!phone.trim()) { setError('Enter your phone number'); return }
    setPhoneLoading(true)

    const supabase = createClient()
    const { error: otpError } = await supabase.auth.signInWithOtp({
      phone: toE164(phone),
    })

    setPhoneLoading(false)

    if (otpError) {
      setError(otpError.message)
      return
    }

    setPhoneStep('verify')
    toast('OTP sent! Check your messages.', 'success')
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (otp.length < 6) { setError('Enter the 6-digit code'); return }
    setPhoneLoading(true)

    const supabase = createClient()
    const { data, error: verifyError } = await supabase.auth.verifyOtp({
      phone: toE164(phone),
      token: otp,
      type: 'sms',
    })

    if (verifyError) {
      setError(verifyError.message)
      setPhoneLoading(false)
      return
    }

    // Ensure a profile exists for phone-only users
    if (data.user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', data.user.id)
        .single()

      if (!profile) {
        await supabase.from('profiles').insert({
          id: data.user.id,
          full_name: data.user.phone ?? 'User',
          role: 'car_owner',
          phone: data.user.phone,
        })
      }
    }

    toast('Welcome back!', 'success')
    router.push('/dashboard')
    router.refresh()
  }

  const divider = (
    <div style={{ position: 'relative', margin: 'var(--space-5) 0', textAlign: 'center' }}>
      <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: 1, background: 'var(--color-border)', transform: 'translateY(-50%)' }} />
      <span style={{ position: 'relative', background: 'var(--color-bg-100)', padding: '0 var(--space-2)', fontSize: '0.75rem', color: 'var(--color-text-300)', textTransform: 'uppercase' }}>Or</span>
    </div>
  )

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

          {/* Method tabs */}
          <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-5)', background: 'var(--color-surface-700)', borderRadius: 'var(--radius-md)', padding: 4 }}>
            {(['email', 'phone'] as LoginMethod[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => { setMethod(m); setError(null); setPhoneStep('enter') }}
                style={{
                  flex: 1, padding: 'var(--space-2) var(--space-3)',
                  borderRadius: 'calc(var(--radius-md) - 2px)',
                  border: 'none', cursor: 'pointer',
                  fontSize: '0.875rem', fontWeight: 600,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  background: method === m ? 'var(--color-bg-100)' : 'transparent',
                  color: method === m ? 'var(--color-text-100)' : 'var(--color-text-400)',
                  transition: 'all 0.15s',
                }}
              >
                {m === 'email' ? <Mail size={14} /> : <Phone size={14} />}
                {m === 'email' ? 'Email' : 'Phone'}
              </button>
            ))}
          </div>

          {/* Email form */}
          {method === 'email' && (
            <>
              <form className="auth-form" onSubmit={handleEmailSubmit}>
                <Input label="Email address" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} icon={<Mail size={16} />} required autoComplete="email" />
                <Input label="Password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} icon={<Lock size={16} />} required autoComplete="current-password" />
                {error && <p style={{ color: 'var(--color-danger)', fontSize: '0.875rem' }}>{error}</p>}
                <Button type="submit" fullWidth loading={emailLoading} size="lg">Sign in</Button>
              </form>

              {divider}

              <Button type="button" fullWidth variant="secondary" loading={googleLoading} onClick={handleGoogleSignIn} style={{ marginBottom: 'var(--space-3)' }}>
                <LogIn size={16} style={{ marginRight: 'var(--space-2)' }} />
                Continue with Google
              </Button>
            </>
          )}

          {/* Phone OTP form */}
          {method === 'phone' && phoneStep === 'enter' && (
            <form className="auth-form" onSubmit={handleSendOtp}>
              <Input
                label="Phone number"
                type="tel"
                placeholder="08012345678"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                icon={<Phone size={16} />}
                required
                autoComplete="tel"
              />
              <p style={{ fontSize: '0.8rem', color: 'var(--color-text-400)', marginTop: -8 }}>
                Nigeria numbers: enter as 0801… or +2348…
              </p>
              {error && <p style={{ color: 'var(--color-danger)', fontSize: '0.875rem' }}>{error}</p>}
              <Button type="submit" fullWidth loading={phoneLoading} size="lg">
                <MessageSquare size={16} style={{ marginRight: 'var(--space-2)' }} />
                Send OTP
              </Button>
            </form>
          )}

          {method === 'phone' && phoneStep === 'verify' && (
            <form className="auth-form" onSubmit={handleVerifyOtp}>
              <p style={{ fontSize: '0.9rem', color: 'var(--color-text-300)', marginBottom: 'var(--space-4)' }}>
                Code sent to <strong>{toE164(phone)}</strong>
              </p>
              <Input
                label="6-digit OTP"
                type="text"
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                placeholder="123456"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                icon={<MessageSquare size={16} />}
                required
                autoComplete="one-time-code"
              />
              {error && <p style={{ color: 'var(--color-danger)', fontSize: '0.875rem' }}>{error}</p>}
              <Button type="submit" fullWidth loading={phoneLoading} size="lg">Verify & Sign in</Button>
              <button type="button" onClick={() => { setPhoneStep('enter'); setOtp(''); setError(null) }} style={{ background: 'none', border: 'none', color: 'var(--color-accent)', cursor: 'pointer', fontSize: '0.875rem', padding: 0 }}>
                ← Change number
              </button>
            </form>
          )}

          <div className="auth-footer" style={{ flexDirection: 'column', gap: 'var(--space-3)', marginTop: 'var(--space-5)' }}>
            <div>Don&apos;t have an account? <Link href="/register">Create one free</Link></div>
            {method === 'email' && (
              <div style={{ fontSize: '0.875rem' }}>
                <Link href="/forgot-password" style={{ color: 'var(--color-accent)', textDecoration: 'none' }}>Forgot password?</Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
