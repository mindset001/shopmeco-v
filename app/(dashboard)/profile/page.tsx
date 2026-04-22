'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
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
import ServicesCatalog from './ServicesCatalog'
import { NIGERIA_STATES, NIGERIA_CITIES } from '@/lib/data/nigeria-locations'
import { BadgeCheck, Star } from 'lucide-react'

// Phone validation for Nigerian numbers
const validatePhone = (phone: string): boolean => {
  if (!phone) return true // optional field
  const nigerianPhoneRegex = /^(\+234|0)[789]\d{9}$/
  return nigerianPhoneRegex.test(phone.replace(/\s/g, ''))
}

const LocationPicker = dynamic(() => import('@/components/ui/LocationPicker'), { ssr: false, loading: () => <div style={{ height: 300, background: 'var(--color-surface-800)', borderRadius: 'var(--radius-lg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-400)' }}>Loading map…</div> })

export default function ProfilePage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
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
  const [jobTitle, setJobTitle] = useState('')
  const [fixedPrice, setFixedPrice] = useState('')
  const [inspectionFee, setInspectionFee] = useState('')
  const [vehicleBrands, setVehicleBrands] = useState<string[]>([])
  const [vehicleBrandInput, setVehicleBrandInput] = useState('')
  const [services, setServices] = useState<string[]>([])
  const [serviceModes, setServiceModes] = useState<string[]>(['workshop'])
  const [availableDays, setAvailableDays] = useState<string[]>([])
  const [availableFrom, setAvailableFrom] = useState('08:00')
  const [availableTo, setAvailableTo] = useState('18:00')
  const [isAvailable, setIsAvailable] = useState(true)
  const [workshopImages, setWorkshopImages] = useState<string[]>([])
  const [shopImages, setShopImages] = useState<string[]>([])
  const [lat, setLat] = useState<number | null>(null)
  const [lng, setLng] = useState<number | null>(null)
  const [repairerStats, setRepairerStats] = useState({ rating: 0, totalReviews: 0, completedJobs: 0, isVerified: false })

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
          setJobTitle(det.job_title ?? '')
          setFixedPrice(det.fixed_price?.toString() ?? '')
          setInspectionFee(det.inspection_fee?.toString() ?? '')
          setVehicleBrands(det.vehicle_brands ?? [])
          setServices(det.services ?? [])
          setServiceModes(det.service_modes ?? ['workshop'])
          setAvailableDays(det.available_days ?? [])
          setAvailableFrom(det.available_from ?? '08:00')
          setAvailableTo(det.available_to ?? '18:00')
          setIsAvailable(det.is_available ?? true)
          setWorkshopImages(det.workshop_images ?? [])
          setRepairerStats({
            rating: det.rating ?? 0,
            totalReviews: det.total_reviews ?? 0,
            completedJobs: det.completed_jobs ?? 0,
            isVerified: data.is_verified ?? false,
          })
        }
      }
      setLoading(false)
    }
    load()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Track unsaved changes and warn on navigation
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault()
        e.returnValue = ''
        return ''
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [hasUnsavedChanges])

  // Mark as unsaved when any field changes
  const markUnsaved = useCallback(() => {
    setHasUnsavedChanges(true)
  }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!profile) return

    // Validation
    if (form.phone && !validatePhone(form.phone)) {
      toast('Please enter a valid Nigerian phone number (e.g., 08012345678 or +2348012345678)', 'error')
      return
    }

    if (profile.role === 'repairer') {
      if (!workshopName.trim()) {
        toast('Workshop name is required for repairers', 'error')
        return
      }
      if (!lat || !lng) {
        toast('Please select a location on the map', 'error')
        return
      }
    }

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
      const { error: repairerError } = await supabase.from('repairer_details').upsert({
        id: profile.id,
        workshop_name: workshopName,
        job_title: jobTitle || null,
        fixed_price: fixedPrice ? parseFloat(fixedPrice) : null,
        inspection_fee: inspectionFee ? parseFloat(inspectionFee) : null,
        vehicle_brands: vehicleBrands,
        services,
        service_modes: serviceModes,
        available_days: availableDays,
        available_from: availableFrom,
        available_to: availableTo,
        is_available: isAvailable,
        workshop_images: workshopImages,
      })
      if (repairerError) {
        toast('Failed to save repairer details: ' + repairerError.message, 'error')
        setSaving(false)
        return
      }
    }

    setSaving(false)
    setHasUnsavedChanges(false)
    toast('Changes saved successfully', 'success')
    setTimeout(() => router.push('/dashboard'), 900)
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
            onChange={(e) => { setForm({ ...form, full_name: e.target.value }); markUnsaved() }}
          />
          <Input
            label="Phone"
            type="tel"
            value={form.phone}
            onChange={(e) => { setForm({ ...form, phone: e.target.value }); markUnsaved() }}
            placeholder="+234 or 0..."
          />
          <div className="input-group">
            <label className="input-label">Bio</label>
            <textarea
              className="input"
              rows={4}
              value={form.bio}
              onChange={(e) => { setForm({ ...form, bio: e.target.value }); markUnsaved() }}
              placeholder="Tell others about yourself…"
              style={{ resize: 'vertical' }}
            />
          </div>
          <Input
            label="Address"
            value={form.address}
            onChange={(e) => { setForm({ ...form, address: e.target.value }); markUnsaved() }}
          />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
            <div className="input-group">
              <label className="input-label">State *</label>
              <select
                className="input"
                value={form.state}
                onChange={(e) => { setForm({ ...form, state: e.target.value, city: '' }); markUnsaved() }}
                required
              >
                <option value="">Select state…</option>
                {NIGERIA_STATES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div className="input-group">
              <label className="input-label">City {form.state ? '*' : ''}</label>
              <select
                className="input"
                value={form.city}
                onChange={(e) => { setForm({ ...form, city: e.target.value }); markUnsaved() }}
                disabled={!form.state}
                required={!!form.state}
              >
                <option value="">{form.state ? 'Select city…' : 'Select state first'}</option>
                {(NIGERIA_CITIES[form.state] ?? []).map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <div style={{ fontWeight: 600, marginBottom: 'var(--space-3)' }}>Exact Location</div>
            <LocationPicker
              lat={lat}
              lng={lng}
              onChange={(newLat, newLng) => { setLat(newLat); setLng(newLng); markUnsaved() }}
            />
          </div>

          {profile?.role === 'repairer' && (
            <>
              {/* ── Trust & Quality (read-only) ── */}
              <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-5)' }}>
                <div style={{ fontWeight: 700, marginBottom: 'var(--space-4)', fontSize: '1rem' }}>Your Stats</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
                  {repairerStats.isVerified && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--color-accent)', fontWeight: 700, fontSize: '0.9rem' }}>
                      <BadgeCheck size={18} /> Verified Mechanic
                    </div>
                  )}
                  <div style={{ fontSize: '0.9rem', color: 'var(--color-text-200)', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Star size={15} style={{ color: '#f59e0b' }} />
                    {repairerStats.rating.toFixed(1)} ({repairerStats.totalReviews} reviews)
                  </div>
                  <div style={{ fontSize: '0.9rem', color: 'var(--color-text-200)' }}>
                    ✅ {repairerStats.completedJobs} jobs completed
                  </div>
                </div>
              </div>

              {/* ── Workshop basic info ── */}
              <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-5)' }}>
                <div style={{ fontWeight: 700, marginBottom: 'var(--space-4)' }}>Workshop Info</div>
              </div>
              <Input
                label="Workshop / Business Name"
                value={workshopName}
                onChange={(e) => { setWorkshopName(e.target.value); markUnsaved() }}
                required
              />

              {/* ── Job title ── */}
              <div className="input-group">
                <label className="input-label">Job Title / Specialisation</label>
                <select
                  className="input"
                  value={jobTitle}
                  onChange={(e) => { setJobTitle(e.target.value); markUnsaved() }}
                >
                  <option value="">Select your primary role…</option>
                  {['Mechanic', 'Gear Master / Transmission Specialist', 'Auto Electrician', 'AC Technician', 'Panel Beater', 'Auto Painter', 'Tyre Technician', 'Diagnostics Specialist', 'General Technician'].map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              {/* ── Pricing ── */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                <Input
                  label="Base / Fixed Service Price (₦)"
                  type="number"
                  value={fixedPrice}
                  onChange={(e) => { setFixedPrice(e.target.value); markUnsaved() }}
                  placeholder="e.g. 5000"
                />
                <Input
                  label="Inspection / Diagnostic Fee (₦, optional)"
                  type="number"
                  value={inspectionFee}
                  onChange={(e) => { setInspectionFee(e.target.value); markUnsaved() }}
                  placeholder="e.g. 2000"
                />
              </div>

              {/* ── Vehicle brands ── */}
              <div className="input-group">
                <label className="input-label">Vehicle Brands You Work On</label>
                <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
                  <input
                    className="input"
                    placeholder="e.g. Toyota, Honda…"
                    value={vehicleBrandInput}
                    onChange={(e) => setVehicleBrandInput(e.target.value)}
                    onKeyDown={(e) => {
                      if ((e.key === 'Enter' || e.key === ',') && vehicleBrandInput.trim()) {
                        e.preventDefault()
                        const b = vehicleBrandInput.trim().replace(/,$/, '')
                        if (b && !vehicleBrands.includes(b)) {
                          setVehicleBrands([...vehicleBrands, b])
                          markUnsaved()
                        }
                        setVehicleBrandInput('')
                      }
                    }}
                    style={{ flex: 1 }}
                  />
                  <button
                    type="button"
                    className="btn btn--secondary btn--md"
                    onClick={() => {
                      const b = vehicleBrandInput.trim()
                      if (b && !vehicleBrands.includes(b)) {
                        setVehicleBrands([...vehicleBrands, b])
                        markUnsaved()
                      }
                      setVehicleBrandInput('')
                    }}
                  >Add</button>
                </div>
                {vehicleBrands.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
                    {vehicleBrands.map((b) => (
                      <span key={b} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '0.2rem 0.65rem', background: 'var(--color-surface-800)', border: '1px solid var(--color-border)', borderRadius: 999, fontSize: '0.82rem' }}>
                        {b}
                        <button type="button" onClick={() => { setVehicleBrands(vehicleBrands.filter((x) => x !== b)); markUnsaved() }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-300)', padding: 0, lineHeight: 1 }}>×</button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* ── Service modes ── */}
              <div className="input-group">
                <label className="input-label">Service Mode</label>
                <div style={{ display: 'flex', gap: 'var(--space-4)', marginTop: 4 }}>
                  {[{ value: 'workshop', label: '🔧 Workshop Visit' }, { value: 'home', label: '🏠 Home Service' }].map(({ value, label }) => (
                    <label key={value} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: '0.9rem' }}>
                      <input
                        type="checkbox"
                        checked={serviceModes.includes(value)}
                        onChange={(e) => { setServiceModes(e.target.checked ? [...serviceModes, value] : serviceModes.filter((m) => m !== value)); markUnsaved() }}
                        style={{ width: 16, height: 16, accentColor: 'var(--color-accent)' }}
                      />
                      {label}
                    </label>
                  ))}
                </div>
              </div>

              {/* ── Services catalog ── */}
              <ServicesCatalog selected={services} onChange={(newServices) => { setServices(newServices); markUnsaved() }} />

              {/* ── Availability ── */}
              <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-5)' }}>
                <div style={{ fontWeight: 700, marginBottom: 'var(--space-4)' }}>Availability</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                <input
                  type="checkbox"
                  id="available"
                  checked={isAvailable}
                  onChange={(e) => { setIsAvailable(e.target.checked); markUnsaved() }}
                  style={{ width: 18, height: 18, accentColor: 'var(--color-accent)' }}
                />
                <label htmlFor="available" style={{ cursor: 'pointer', fontWeight: 600 }}>
                  I&apos;m currently open for work
                </label>
              </div>
              <div className="input-group">
                <label className="input-label">Available Days</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)', marginTop: 4 }}>
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => {
                    const on = availableDays.includes(day)
                    return (
                      <button
                        key={day} type="button"
                        onClick={() => { setAvailableDays(on ? availableDays.filter((d) => d !== day) : [...availableDays, day]); markUnsaved() }}
                        style={{
                          padding: '0.3rem 0.75rem', borderRadius: 999,
                          border: `1.5px solid ${on ? 'var(--color-accent)' : 'var(--color-border)'}`,
                          background: on ? 'color-mix(in srgb, var(--color-accent) 12%, transparent)' : 'transparent',
                          color: on ? 'var(--color-accent)' : 'var(--color-text-200)',
                          fontWeight: on ? 700 : 400, fontSize: '0.85rem', cursor: 'pointer',
                        }}
                      >{day}</button>
                    )
                  })}
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                <div className="input-group">
                  <label className="input-label">Open From</label>
                  <input type="time" className="input" value={availableFrom} onChange={(e) => { setAvailableFrom(e.target.value); markUnsaved() }} />
                </div>
                <div className="input-group">
                  <label className="input-label">Close At</label>
                  <input type="time" className="input" value={availableTo} onChange={(e) => { setAvailableTo(e.target.value); markUnsaved() }} />
                </div>
              </div>

              {/* ── Workshop photos ── */}
              {profile && (
                <ImageUploadGrid
                  bucket="shops"
                  userId={profile.id}
                  maxImages={6}
                  uploadedUrls={workshopImages}
                  onUrlsChange={(urls) => { setWorkshopImages(urls); markUnsaved() }}
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
                  onUrlsChange={(urls) => { setShopImages(urls); markUnsaved() }}
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
