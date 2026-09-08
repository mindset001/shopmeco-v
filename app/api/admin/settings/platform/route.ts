import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentProfile } from '@/lib/utils/profile'

export async function PATCH(req: NextRequest) {
  const profile = await getCurrentProfile()
  if (!profile || profile.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = (await req.json()) as {
    commission_rate?: number
    featured_listing_price?: number
    featured_listing_duration_days?: number
    subscription_price?: number
    subscription_duration_days?: number
    trial_period_days?: number
    delivery_fee?: number
  }

  const updates: Record<string, unknown> = {}

  if (body.commission_rate !== undefined) {
    if (typeof body.commission_rate !== 'number' || body.commission_rate < 0 || body.commission_rate > 1) {
      return NextResponse.json({ error: 'commission_rate must be between 0 and 1' }, { status: 400 })
    }
    updates.commission_rate = body.commission_rate
  }

  if (body.featured_listing_price !== undefined) {
    if (typeof body.featured_listing_price !== 'number' || body.featured_listing_price < 0) {
      return NextResponse.json({ error: 'featured_listing_price must be 0 or greater' }, { status: 400 })
    }
    updates.featured_listing_price = body.featured_listing_price
  }

  if (body.featured_listing_duration_days !== undefined) {
    if (!Number.isInteger(body.featured_listing_duration_days) || body.featured_listing_duration_days <= 0) {
      return NextResponse.json({ error: 'featured_listing_duration_days must be a positive integer' }, { status: 400 })
    }
    updates.featured_listing_duration_days = body.featured_listing_duration_days
  }

  if (body.subscription_price !== undefined) {
    if (typeof body.subscription_price !== 'number' || body.subscription_price < 0) {
      return NextResponse.json({ error: 'subscription_price must be 0 or greater' }, { status: 400 })
    }
    updates.subscription_price = body.subscription_price
  }

  if (body.subscription_duration_days !== undefined) {
    if (!Number.isInteger(body.subscription_duration_days) || body.subscription_duration_days <= 0) {
      return NextResponse.json({ error: 'subscription_duration_days must be a positive integer' }, { status: 400 })
    }
    updates.subscription_duration_days = body.subscription_duration_days
  }

  if (body.trial_period_days !== undefined) {
    if (!Number.isInteger(body.trial_period_days) || body.trial_period_days < 0) {
      return NextResponse.json({ error: 'trial_period_days must be a non-negative integer' }, { status: 400 })
    }
    updates.trial_period_days = body.trial_period_days
  }

  if (body.delivery_fee !== undefined) {
    if (typeof body.delivery_fee !== 'number' || body.delivery_fee < 0) {
      return NextResponse.json({ error: 'delivery_fee must be 0 or greater' }, { status: 400 })
    }
    updates.delivery_fee = body.delivery_fee
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No settings provided' }, { status: 400 })
  }

  const supabase = createAdminClient()
  const { error } = await supabase
    .from('platform_settings')
    .update({ ...updates, updated_at: new Date().toISOString(), updated_by: profile.id })
    .eq('id', true)

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ success: true })
}
