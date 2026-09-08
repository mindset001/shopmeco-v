'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Input from '@/components/ui/Input'
import { toast } from '@/components/ui/Toaster'
import type { PlatformSettings } from '@/types'

interface Props {
  settings: PlatformSettings
}

export default function PlatformSettingsForm({ settings }: Props) {
  const router = useRouter()
  const [commissionPercent, setCommissionPercent] = useState(String(settings.commission_rate * 100))
  const [featuredPrice, setFeaturedPrice] = useState(String(settings.featured_listing_price))
  const [featuredDuration, setFeaturedDuration] = useState(String(settings.featured_listing_duration_days))
  const [subscriptionPrice, setSubscriptionPrice] = useState(String(settings.subscription_price))
  const [subscriptionDuration, setSubscriptionDuration] = useState(String(settings.subscription_duration_days))
  const [trialDays, setTrialDays] = useState(String(settings.trial_period_days))
  const [deliveryFee, setDeliveryFee] = useState(String(settings.delivery_fee))
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    const percent = parseFloat(commissionPercent)
    const featPrice = parseFloat(featuredPrice)
    const featDuration = parseInt(featuredDuration, 10)
    const subPrice = parseFloat(subscriptionPrice)
    const subDuration = parseInt(subscriptionDuration, 10)
    const trial = parseInt(trialDays, 10)
    const delivery = parseFloat(deliveryFee)

    if (!Number.isFinite(percent) || percent < 0 || percent > 100) {
      toast('Enter a commission rate between 0 and 100.', 'warning')
      return
    }
    if (!Number.isFinite(featPrice) || featPrice < 0) {
      toast('Enter a valid featured listing price.', 'warning')
      return
    }
    if (!Number.isInteger(featDuration) || featDuration <= 0) {
      toast('Enter a featured listing duration of at least 1 day.', 'warning')
      return
    }
    if (!Number.isFinite(subPrice) || subPrice < 0) {
      toast('Enter a valid subscription price.', 'warning')
      return
    }
    if (!Number.isInteger(subDuration) || subDuration <= 0) {
      toast('Enter a subscription duration of at least 1 day.', 'warning')
      return
    }
    if (!Number.isInteger(trial) || trial < 0) {
      toast('Enter a trial period of 0 or more days.', 'warning')
      return
    }
    if (!Number.isFinite(delivery) || delivery < 0) {
      toast('Enter a valid delivery fee.', 'warning')
      return
    }

    setSaving(true)
    const res = await fetch('/api/admin/settings/platform', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        commission_rate: percent / 100,
        featured_listing_price: featPrice,
        featured_listing_duration_days: featDuration,
        subscription_price: subPrice,
        subscription_duration_days: subDuration,
        trial_period_days: trial,
        delivery_fee: delivery,
      }),
    })
    const data = await res.json()
    if (!res.ok) {
      toast(data.error ?? 'Failed to save settings', 'error')
    } else {
      toast('Platform settings saved.', 'success')
      router.refresh()
    }
    setSaving(false)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      <Input
        label="Commission rate (%)"
        type="number"
        min={0}
        max={100}
        step="0.1"
        value={commissionPercent}
        onChange={(e) => setCommissionPercent(e.target.value)}
      />
      <p style={{ fontSize: '0.8rem', color: 'var(--color-text-300)', margin: 0 }}>
        Deducted from the seller/repairer payout when an admin releases an escrow payment.
      </p>

      <Input
        label="Featured listing price (₦)"
        type="number"
        min={0}
        step="100"
        value={featuredPrice}
        onChange={(e) => setFeaturedPrice(e.target.value)}
      />
      <Input
        label="Featured listing duration (days)"
        type="number"
        min={1}
        step="1"
        value={featuredDuration}
        onChange={(e) => setFeaturedDuration(e.target.value)}
      />
      <p style={{ fontSize: '0.8rem', color: 'var(--color-text-300)', margin: 0 }}>
        What sellers pay to have a product spotlighted on the marketplace, and for how long.
      </p>

      <Input
        label="Subscription price (₦)"
        type="number"
        min={0}
        step="100"
        value={subscriptionPrice}
        onChange={(e) => setSubscriptionPrice(e.target.value)}
      />
      <Input
        label="Subscription duration (days)"
        type="number"
        min={1}
        step="1"
        value={subscriptionDuration}
        onChange={(e) => setSubscriptionDuration(e.target.value)}
      />
      <Input
        label="New provider trial period (days)"
        type="number"
        min={0}
        step="1"
        value={trialDays}
        onChange={(e) => setTrialDays(e.target.value)}
      />
      <p style={{ fontSize: '0.8rem', color: 'var(--color-text-300)', margin: 0 }}>
        What repairers/parts sellers pay to receive bookings and orders, and how long new signups get free before their first payment is due.
      </p>

      <Input
        label="Delivery fee (₦)"
        type="number"
        min={0}
        step="100"
        value={deliveryFee}
        onChange={(e) => setDeliveryFee(e.target.value)}
      />
      <p style={{ fontSize: '0.8rem', color: 'var(--color-text-300)', margin: 0 }}>
        Added to every marketplace order&apos;s total. Not shared with the seller — retained as platform revenue; dispatch/rider costs are paid outside the app.
      </p>

      <button className="btn btn--primary btn--md" onClick={handleSave} disabled={saving}>
        {saving ? 'Saving…' : 'Save Settings'}
      </button>
    </div>
  )
}
