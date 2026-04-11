'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/types'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { toast } from '@/components/ui/Toaster'
import Toaster from '@/components/ui/Toaster'
import Avatar from '@/components/ui/Avatar'

export default function AdminSettingsPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const avatarInputRef = useRef<HTMLInputElement>(null)
  const [form, setForm] = useState({ full_name: '', phone: '' })
  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' })
  const [savingPw, setSavingPw] = useState(false)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      if (data) {
        setProfile(data)
        setForm({ full_name: data.full_name ?? '', phone: data.phone ?? '' })
      }
      setLoading(false)
    }
    load()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!profile) return
    setSaving(true)
    const supabase = createClient()
    const { error } = await supabase.from('profiles').update(form).eq('id', profile.id)
    if (error) { toast(error.message, 'error') }
    else { toast('Settings saved!', 'success'); router.refresh() }
    setSaving(false)
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !profile) return
    setUploadingAvatar(true)
    const supabase = createClient()
    const ext = file.name.split('.').pop()
    const path = `${profile.id}/avatar.${ext}`
    const { error: uploadError } = await supabase.storage.from('avatars').upload(path, file, { upsert: true })
    if (uploadError) {
      toast('Upload failed: ' + uploadError.message, 'error')
      setUploadingAvatar(false)
      return
    }
    const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path)
    const { error: updateError } = await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', profile.id)
    if (updateError) {
      toast('Failed to save avatar.', 'error')
    } else {
      setProfile({ ...profile, avatar_url: publicUrl })
      toast('Avatar updated!', 'success')
      router.refresh()
    }
    setUploadingAvatar(false)
    e.target.value = ''
  }

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault()
    if (!pwForm.current || !pwForm.next || !pwForm.confirm) {
      toast('Please fill in all password fields.', 'error')
      return
    }
    if (pwForm.next !== pwForm.confirm) {
      toast('New passwords do not match.', 'error')
      return
    }
    if (pwForm.next.length < 8) {
      toast('Password must be at least 8 characters.', 'error')
      return
    }
    setSavingPw(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user?.email) { toast('Could not verify identity.', 'error'); setSavingPw(false); return }
    const { error: signInError } = await supabase.auth.signInWithPassword({ email: user.email, password: pwForm.current })
    if (signInError) {
      toast('Current password is incorrect.', 'error')
      setSavingPw(false)
      return
    }
    const { error } = await supabase.auth.updateUser({ password: pwForm.next })
    if (error) {
      toast(error.message, 'error')
    } else {
      toast('Password changed successfully!', 'success')
      setPwForm({ current: '', next: '', confirm: '' })
    }
    setSavingPw(false)
  }

  if (loading) return <div className="loader"><div className="loader__ring" /></div>

  return (
    <>
      <Toaster />
      <div className="animate-fade-in">
        <div className="page-header">
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">Manage your admin account details.</p>
        </div>

        {/* Avatar */}
        <div style={{ display: 'flex', gap: 'var(--space-6)', alignItems: 'center', marginBottom: 'var(--space-8)' }}>
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleAvatarChange}
            />
            <button
              type="button"
              onClick={() => avatarInputRef.current?.click()}
              disabled={uploadingAvatar}
              style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', position: 'relative', display: 'block' }}
              title="Change avatar"
            >
              <Avatar src={profile?.avatar_url} name={profile?.full_name} size="xl" />
              <span style={{
                position: 'absolute', bottom: 0, right: 0,
                background: 'var(--color-accent)', borderRadius: '50%',
                width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, color: '#fff', border: '2px solid var(--color-surface)',
                pointerEvents: 'none',
              }}>
                {uploadingAvatar ? '…' : '✎'}
              </span>
            </button>
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '1.125rem' }}>{profile?.full_name ?? '—'}</div>
            <div style={{ color: 'var(--color-accent)', fontSize: '0.875rem', marginTop: 2 }}>Administrator</div>
          </div>
        </div>

        {/* Account details */}
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)', maxWidth: 520 }}>
          <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: -8 }}>Account Details</div>
          <Input
            label="Full name"
            value={form.full_name}
            onChange={(e) => setForm({ ...form, full_name: e.target.value })}
          />
          <Input
            label="Phone"
            type="tel"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
          <Button type="submit" loading={saving} size="lg">
            Save Changes
          </Button>
        </form>

        {/* Password change */}
        <form onSubmit={handlePasswordChange} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)', maxWidth: 520, marginTop: 'var(--space-8)', paddingTop: 'var(--space-6)', borderTop: '1px solid var(--color-border)' }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 4 }}>Change Password</div>
            <div style={{ color: 'var(--color-text-300)', fontSize: '0.875rem' }}>Leave blank if you don&apos;t want to change your password.</div>
          </div>
          <Input
            label="Current password"
            type="password"
            value={pwForm.current}
            onChange={(e) => setPwForm({ ...pwForm, current: e.target.value })}
            autoComplete="current-password"
          />
          <Input
            label="New password"
            type="password"
            value={pwForm.next}
            onChange={(e) => setPwForm({ ...pwForm, next: e.target.value })}
            autoComplete="new-password"
          />
          <Input
            label="Confirm new password"
            type="password"
            value={pwForm.confirm}
            onChange={(e) => setPwForm({ ...pwForm, confirm: e.target.value })}
            autoComplete="new-password"
          />
          <Button type="submit" loading={savingPw} size="md" variant="secondary">
            Update Password
          </Button>
        </form>
      </div>
    </>
  )
}
