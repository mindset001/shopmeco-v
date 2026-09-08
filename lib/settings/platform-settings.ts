import { createClient } from '@/lib/supabase/server'
import type { PlatformSettings } from '@/types'

export async function getPlatformSettings(): Promise<PlatformSettings> {
  const supabase = await createClient()
  const { data } = await supabase.from('platform_settings').select('*').single()
  return (
    data ?? {
      id: true,
      commission_rate: 0.05,
      featured_listing_price: 5000,
      featured_listing_duration_days: 7,
      subscription_price: 3000,
      subscription_duration_days: 30,
      trial_period_days: 30,
      delivery_fee: 1500,
      updated_at: '',
      updated_by: null,
    }
  )
}
