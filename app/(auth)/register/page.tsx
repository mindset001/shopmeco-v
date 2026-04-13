'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Car, Wrench, ShoppingBag, Mail, Lock, User } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { UserRole } from '@/types'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Toaster from '@/components/ui/Toaster'
import { toast } from '@/components/ui/Toaster'

const roles: { value: UserRole; label: string; icon: React.ElementType; desc: string }[] = [
  { value: 'car_owner', label: 'Car Owner', icon: Car, desc: 'I need repairs or parts' },
  { value: 'repairer', label: 'Repairer', icon: Wrench, desc: 'I fix cars' },
  { value: 'parts_seller', label: 'Parts Seller', icon: ShoppingBag, desc: 'I sell parts' },
]

export default function RegisterPage() {
  const router = useRouter()
  const [step, setStep] = useState<1 | 2>(1)
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<UserRole>('car_owner')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (step === 1) { setStep(2); return }

    setError(null)
    setLoading(true)

    // Create user via server route (auto-confirms email)
    const res = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, fullName, role }),
    })
    const json = await res.json()

    if (!res.ok) {
      setError(json.error ?? 'Registration failed')
      setLoading(false)
      return
    }

    // Sign in immediately
    const supabase = createClient()
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })

    if (signInError) {
      setError(signInError.message)
      setLoading(false)
      return
    }

    toast('You\'re in. Welcome to ShopMecko.', 'success')
    router.push('/dashboard')
    router.refresh()
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

          <h1 className="auth-title">
            {step === 1 ? 'Create your account' : 'One more thing'}
          </h1>
          <p className="auth-subtitle">
            {step === 1
              ? 'Let’s get you set up.'
              : 'What brings you to ShopMecko?'}
          </p>

          <form className="auth-form" onSubmit={handleSubmit}>
            {step === 1 ? (
              <>
                <Input
                  label="Full name"
                  type="text"
                  placeholder="John Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  icon={<User size={16} />}
                  required
                />
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
                  placeholder="Min. 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  icon={<Lock size={16} />}
                  required
                  minLength={8}
                  autoComplete="new-password"
                />
              </>
            ) : (
              <div className="role-grid">
                {roles.map(({ value, label, icon: Icon, desc }) => (
                  <div
                    key={value}
                    className={`role-card${role === value ? ' role-card--selected' : ''}`}
                    onClick={() => setRole(value)}
                  >
                    <div className="role-card__icon">
                      <Icon size={28} />
                    </div>
                    <div className="role-card__label">{label}</div>
                    <div
                      style={{
                        fontSize: '0.75rem',
                        color: 'var(--color-text-300)',
                        marginTop: 4,
                      }}
                    >
                      {desc}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {error && (
              <p style={{ color: 'var(--color-danger)', fontSize: '0.875rem' }}>
                {error}
              </p>
            )}

            <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
              {step === 2 && (
                <Button
                  type="button"
                  variant="secondary"
                  fullWidth
                  onClick={() => setStep(1)}
                >
                  Back
                </Button>
              )}
              <Button type="submit" fullWidth loading={loading} size="lg">
                {step === 1 ? 'Continue' : 'Create Account'}
              </Button>
            </div>
          </form>

          <div className="auth-footer">
            Already have an account? <Link href="/login">Sign in</Link>
          </div>
        </div>
      </div>
    </>
  )
}
