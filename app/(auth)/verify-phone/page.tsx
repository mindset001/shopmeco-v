'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Phone, MessageSquare, CheckCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { toast } from '@/components/ui/Toaster'
import Toaster from '@/components/ui/Toaster'

type Step = 'enter' | 'verify' | 'done'

function toE164(raw: string): string {
  const digits = raw.replace(/\D/g, '')
  if (digits.startsWith('234')) return `+${digits}`
  if (digits.startsWith('0')) return `+234${digits.slice(1)}`
  return `+${digits}`
}

export default function VerifyPhonePage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('enter')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [existingPhone, setExistingPhone] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.push('/login'); return }
      // Pre-fill if they already have a phone on their profile
      supabase.from('profiles').select('phone').eq('id', session.user.id).single().then(({ data }) => {
        if (data?.phone) setExistingPhone(data.phone)
      })
    })
  }, [router])

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!phone.trim()) { setError('Enter your phone number'); return }
    setLoading(true)

    const supabase = createClient()
    // updateUser triggers Supabase to send an OTP to verify the new phone
    const { error: updateError } = await supabase.auth.updateUser({ phone: toE164(phone) })

    setLoading(false)
    if (updateError) { setError(updateError.message); return }

    setStep('verify')
    toast('OTP sent to your phone!', 'success')
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (otp.length < 6) { setError('Enter the 6-digit code'); return }
    setLoading(true)

    const supabase = createClient()
    const { error: verifyError } = await supabase.auth.verifyOtp({
      phone: toE164(phone),
      token: otp,
      type: 'phone_change',
    })

    if (verifyError) { setError(verifyError.message); setLoading(false); return }

    // Persist verified phone to profile
    const { data: { session } } = await supabase.auth.getSession()
    if (session) {
      await supabase.from('profiles').update({ phone: toE164(phone), phone_verified: true }).eq('id', session.user.id)
    }

    setStep('done')
    setLoading(false)
  }

  if (step === 'done') {
    return (
      <>
        <Toaster />
        <div className="auth-layout">
          <div className="auth-card" style={{ textAlign: 'center' }}>
            <CheckCircle size={48} style={{ color: 'var(--color-success)', marginBottom: 'var(--space-4)' }} />
            <h1 className="auth-title">Phone verified!</h1>
            <p className="auth-subtitle" style={{ marginBottom: 'var(--space-6)' }}>
              You can now sign in with your phone number.
            </p>
            <Button fullWidth onClick={() => router.push('/dashboard')}>Go to dashboard</Button>
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
            <Phone size={40} style={{ color: 'var(--color-accent)' }} />
          </div>

          <h1 className="auth-title">Verify your phone</h1>
          <p className="auth-subtitle">
            {step === 'enter'
              ? existingPhone
                ? `Update or confirm your number. Current: ${existingPhone}`
                : 'Add a phone number to enable SMS sign-in.'
              : `Enter the code sent to ${toE164(phone)}`}
          </p>

          {step === 'enter' && (
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
                Nigeria numbers: 0801… or +2348…
              </p>
              {error && <p style={{ color: 'var(--color-danger)', fontSize: '0.875rem' }}>{error}</p>}
              <Button type="submit" fullWidth loading={loading} size="lg">
                <MessageSquare size={16} style={{ marginRight: 'var(--space-2)' }} />
                Send OTP
              </Button>
            </form>
          )}

          {step === 'verify' && (
            <form className="auth-form" onSubmit={handleVerifyOtp}>
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
              <Button type="submit" fullWidth loading={loading} size="lg">Verify phone</Button>
              <button
                type="button"
                onClick={() => { setStep('enter'); setOtp(''); setError(null) }}
                style={{ background: 'none', border: 'none', color: 'var(--color-accent)', cursor: 'pointer', fontSize: '0.875rem', padding: 0 }}
              >
                ← Change number
              </button>
            </form>
          )}

          <div className="auth-footer" style={{ marginTop: 'var(--space-5)' }}>
            <a href="/dashboard" style={{ color: 'var(--color-text-400)' }}>Skip for now</a>
          </div>
        </div>
      </div>
    </>
  )
}
