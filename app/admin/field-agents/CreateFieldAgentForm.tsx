'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { UserPlus } from 'lucide-react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Toaster, { toast } from '@/components/ui/Toaster'

type RegistrableRole = 'repairer' | 'parts_seller'

const ROLE_OPTIONS: { value: RegistrableRole; label: string }[] = [
  { value: 'repairer', label: 'Repairers' },
  { value: 'parts_seller', label: 'Parts sellers' },
]

export default function CreateFieldAgentForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
  })
  const [allowedRoles, setAllowedRoles] = useState<RegistrableRole[]>(['repairer'])

  function update(field: keyof typeof form) {
    return (event: React.ChangeEvent<HTMLInputElement>) => {
      setForm((current) => ({ ...current, [field]: event.target.value }))
    }
  }

  function toggleRole(role: RegistrableRole) {
    setAllowedRoles((current) =>
      current.includes(role)
        ? current.filter((item) => item !== role)
        : [...current, role]
    )
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (allowedRoles.length === 0) {
      toast('Assign at least one user type.', 'error')
      return
    }

    setLoading(true)
    const res = await fetch('/api/admin/field-agents/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, allowedRoles }),
    })
    const data = await res.json()

    if (!res.ok) {
      toast(data.error ?? 'Could not create field agent', 'error')
    } else {
      toast('Field agent created.', 'success')
      setForm({ fullName: '', email: '', phone: '', password: '' })
      setAllowedRoles(['repairer'])
      router.refresh()
    }
    setLoading(false)
  }

  return (
    <>
      <Toaster />
      <form onSubmit={handleSubmit} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontWeight: 700 }}>
          <UserPlus size={18} />
          Create Field Agent
        </div>
        <Input label="Full name" value={form.fullName} onChange={update('fullName')} required />
        <Input label="Email address" type="email" value={form.email} onChange={update('email')} required />
        <Input label="Phone" value={form.phone} onChange={update('phone')} />
        <Input label="Temporary password" type="password" minLength={8} value={form.password} onChange={update('password')} required />

        <div className="input-group">
          <div className="input-label">Can register</div>
          <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
            {ROLE_OPTIONS.map((option) => (
              <label key={option.value} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.9rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={allowedRoles.includes(option.value)}
                  onChange={() => toggleRole(option.value)}
                  style={{ accentColor: 'var(--color-accent)' }}
                />
                {option.label}
              </label>
            ))}
          </div>
        </div>

        <Button type="submit" loading={loading}>
          Create agent
        </Button>
      </form>
    </>
  )
}
