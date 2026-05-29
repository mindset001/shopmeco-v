'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { UserPlus } from 'lucide-react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Toaster, { toast } from '@/components/ui/Toaster'

type RegistrableRole = 'repairer' | 'parts_seller'

const LABELS: Record<RegistrableRole, string> = {
  repairer: 'Repairer',
  parts_seller: 'Parts seller',
}

export default function RegisterBusinessForm({
  allowedRoles,
}: {
  allowedRoles: RegistrableRole[]
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [role, setRole] = useState<RegistrableRole>(allowedRoles[0] ?? 'repairer')
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
  })

  function update(field: keyof typeof form) {
    return (event: React.ChangeEvent<HTMLInputElement>) => {
      setForm((current) => ({ ...current, [field]: event.target.value }))
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setLoading(true)

    const res = await fetch('/api/field-agent/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, role }),
    })
    const data = await res.json()

    if (!res.ok) {
      toast(data.error ?? 'Could not create account', 'error')
    } else {
      toast('Account created.', 'success')
      setForm({ fullName: '', email: '', phone: '', password: '' })
      router.refresh()
    }
    setLoading(false)
  }

  if (allowedRoles.length === 0) {
    return (
      <div className="card">
        <div style={{ fontWeight: 700, marginBottom: 4 }}>No assigned user types</div>
        <p style={{ color: 'var(--color-text-300)', fontSize: '0.9rem' }}>
          Ask an admin to assign which account types you can register.
        </p>
      </div>
    )
  }

  return (
    <>
      <Toaster />
      <form onSubmit={handleSubmit} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontWeight: 700 }}>
          <UserPlus size={18} />
          Create Account
        </div>

        <div className="input-group">
          <label className="input-label" htmlFor="account-role">User type</label>
          <select
            id="account-role"
            className="input"
            value={role}
            onChange={(event) => setRole(event.target.value as RegistrableRole)}
          >
            {allowedRoles.map((item) => (
              <option key={item} value={item}>{LABELS[item]}</option>
            ))}
          </select>
        </div>

        <Input label="Full name or business contact" value={form.fullName} onChange={update('fullName')} required />
        <Input label="Email address" type="email" value={form.email} onChange={update('email')} required />
        <Input label="Phone" value={form.phone} onChange={update('phone')} />
        <Input label="Temporary password" type="password" minLength={8} value={form.password} onChange={update('password')} required />

        <Button type="submit" loading={loading}>
          Create account
        </Button>
      </form>
    </>
  )
}
