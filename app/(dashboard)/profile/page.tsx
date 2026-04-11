'use client'

import { useState, useEffect, useRef } from 'react'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/types'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { toast } from '@/components/ui/Toaster'
import Toaster from '@/components/ui/Toaster'
import Avatar from '@/components/ui/Avatar'
import ImageUploadGrid from '@/components/ui/ImageUploadGrid'

const LocationPicker = dynamic(() => import('@/components/ui/LocationPicker'), { ssr: false, loading: () => <div style={{ height: 300, background: 'var(--color-surface-800)', borderRadius: 'var(--radius-lg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-400)' }}>Loading map…</div> })

export default function ProfilePage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const avatarInputRef = useRef<HTMLInputElement>(null)
  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' })
  const [savingPw, setSavingPw] = useState(false)
  const [form, setForm] = useState({
    full_name: '',
    phone: '',
    bio: '',
    address: '',
    city: '',
    state: '',
  })
  const [workshopName, setWorkshopName] = useState('')
  const [hourlyRate, setHourlyRate] = useState('')
  const [specializations, setSpecializations] = useState('')
  const [isAvailable, setIsAvailable] = useState(true)
  const [workshopImages, setWorkshopImages] = useState<string[]>([])
  const [shopImages, setShopImages] = useState<string[]>([])
  const [lat, setLat] = useState<number | null>(null)
  const [lng, setLng] = useState<number | null>(null)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      if (data) {
        setProfile(data)
        setForm({
          full_name: data.full_name ?? '',
          phone: data.phone ?? '',
          bio: data.bio ?? '',
          address: data.address ?? '',
          city: data.city ?? '',
          state: data.state ?? '',
        })
        if (data.role === 'parts_seller') {
          setShopImages(data.shop_images ?? [])
        }
        setLat(data.latitude ?? null)
        setLng(data.longitude ?? null)
      }
      if (data?.role === 'repairer') {
        const { data: det } = await supabase.from('repairer_details').select('*').eq('id', user.id).single()
        if (det) {
          setWorkshopName(det.workshop_name ?? '')
          setHourlyRate(det.hourly_rate?.toString() ?? '')
          setSpecializations((det.specializations ?? []).join(', '))
          setIsAvailable(det.is_available ?? true)
          setWorkshopImages(det.workshop_images ?? [])
        }
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
    const updates: Record<string, unknown> = { ...form, latitude: lat, longitude: lng }
    if (profile.role === 'parts_seller') {
      updates.shop_images = shopImages
    }
    const { error } = await supabase.from('profiles').update(updates).eq('id', profile.id)

    if (error) {
      toast(error.message, 'error')
      setSaving(false)
      return
    }

    if (profile.role === 'repairer') {
      await supabase.from('repairer_details').upsert({
        id: profile.id,
        workshop_name: workshopName,
        hourly_rate: hourlyRate ? parseFloat(hourlyRate) : null,
        specializations: specializations.split(',').map((s) => s.trim()).filter(Boolean),
        is_available: isAvailable,
        workshop_images: workshopImages,
      })
    }

    toast('Profile updated!', 'success')
    router.refresh()
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
    // Re-authenticate by signing in with current password
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
          <h1 className="page-title">Edit Profile</h1>
          <p className="page-subtitle">Keep your info up to date so people know who they&apos;re dealing with.</p>
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-6)', alignItems: 'flex-start', marginBottom: 'var(--space-8)' }}>
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
              style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'block', position: 'relative' }}
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
            <div style={{ fontWeight: 700, fontSize: '1.25rem' }}>{profile?.full_name}</div>
            <div style={{ color: 'var(--color-accent)', textTransform: 'capitalize', marginTop: 4 }}>
              {profile?.role?.replace('_', ' ')}
            </div>
          </div>
        </div>

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)', maxWidth: 600 }}>
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
          <div className="input-group">
            <label className="input-label">Bio</label>
            <textarea
              className="input"
              rows={4}
              value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
              placeholder="Tell others about yourself…"
              style={{ resize: 'vertical' }}
            />
          </div>
          <Input
            label="Address"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
          />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
            <Input
              label="City"
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
            />
            <Input
              label="State"
              value={form.state}
              onChange={(e) => setForm({ ...form, state: e.target.value })}
            />
          </div>

          <div>
            <div style={{ fontWeight: 600, marginBottom: 'var(--space-3)' }}>Exact Location</div>
            <LocationPicker
              lat={lat}
              lng={lng}
              onChange={(newLat, newLng) => { setLat(newLat); setLng(newLng) }}
            />
          </div>

          {profile?.role === 'repairer' && (
            <>
              <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-5)' }}>
                <div style={{ fontWeight: 700, marginBottom: 'var(--space-4)' }}>Workshop Info</div>
              </div>
              <Input
                label="Workshop name"
                value={workshopName}
                onChange={(e) => setWorkshopName(e.target.value)}
              />
              <Input
                label="Hourly rate (₦)"
                type="number"
                value={hourlyRate}
                onChange={(e) => setHourlyRate(e.target.value)}
              />
              <Input
                label="Specializations (comma-separated)"
                value={specializations}
                onChange={(e) => setSpecializations(e.target.value)}
                placeholder="e.g. Engine repair, Brakes, Electrical"
              />
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                <input
                  type="checkbox"
                  id="available"
                  checked={isAvailable}
                  onChange={(e) => setIsAvailable(e.target.checked)}
                  style={{ width: 18, height: 18, accentColor: 'var(--color-accent)' }}
                />
                <label htmlFor="available" style={{ cursor: 'pointer' }}>
                  I&apos;m currently available for work
                </label>
              </div>
              {profile && (
                <ImageUploadGrid
                  bucket="shops"
                  userId={profile.id}
                  maxImages={6}
                  uploadedUrls={workshopImages}
                  onUrlsChange={setWorkshopImages}
                  label="Workshop Photos"
                />
              )}
            </>
          )}

          {profile?.role === 'parts_seller' && (
            <>
              <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-5)' }}>
                <div style={{ fontWeight: 700, marginBottom: 4 }}>Shop Photos</div>
                <div style={{ color: 'var(--color-text-300)', fontSize: '0.875rem', marginBottom: 'var(--space-4)' }}>
                  Show customers what your shop looks like.
                </div>
              </div>
              {profile && (
                <ImageUploadGrid
                  bucket="shops"
                  userId={profile.id}
                  maxImages={5}
                  uploadedUrls={shopImages}
                  onUrlsChange={setShopImages}
                  label="Shop Photos"
                />
              )}
            </>
          )}

          <Button type="submit" loading={saving} size="lg">
            Save Changes
          </Button>
        </form>

        {/* Password change */}
        <form onSubmit={handlePasswordChange} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)', maxWidth: 600, marginTop: 'var(--space-8)', paddingTop: 'var(--space-6)', borderTop: '1px solid var(--color-border)' }}>
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
