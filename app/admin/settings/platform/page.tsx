import { createAdminClient } from '@/lib/supabase/admin'
import PlatformSettingsForm from './PlatformSettingsForm'
import type { PlatformSettings } from '@/types'

export default async function PlatformSettingsPage() {
  const supabase = createAdminClient()
  const { data } = await supabase.from('platform_settings').select('*').single()
  const settings = (data as PlatformSettings) ?? {
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

  const { data: purchases } = await supabase
    .from('platform_purchases')
    .select('amount, type')

  const featuredPurchases = (purchases ?? []).filter((p) => p.type === 'featured_listing')
  const subscriptionPurchases = (purchases ?? []).filter((p) => p.type === 'subscription')
  const featuredRevenue = featuredPurchases.reduce((s, p) => s + Number(p.amount), 0)
  const subscriptionRevenue = subscriptionPurchases.reduce((s, p) => s + Number(p.amount), 0)

  const { data: deliveredOrders } = await supabase
    .from('orders')
    .select('delivery_fee')
    .eq('payment_status', 'released')
    .gt('delivery_fee', 0)
  const deliveryRevenue = (deliveredOrders ?? []).reduce((s, o) => s + Number(o.delivery_fee), 0)

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Platform Settings</h1>
        <p className="page-subtitle">Configure platform-wide monetization rates.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--space-6)', alignItems: 'start' }}>
        <div className="card" style={{ padding: 'var(--space-6)' }}>
          <PlatformSettingsForm settings={settings} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div className="card" style={{ padding: 'var(--space-5)' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-300)', marginBottom: 4 }}>Total Featured Listing Revenue</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-accent)' }}>₦{featuredRevenue.toLocaleString()}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-400)', marginTop: 2 }}>{featuredPurchases.length} boost{featuredPurchases.length !== 1 ? 's' : ''} purchased</div>
          </div>

          <div className="card" style={{ padding: 'var(--space-5)' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-300)', marginBottom: 4 }}>Total Subscription Revenue</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-accent)' }}>₦{subscriptionRevenue.toLocaleString()}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-400)', marginTop: 2 }}>{subscriptionPurchases.length} subscription{subscriptionPurchases.length !== 1 ? 's' : ''} purchased</div>
          </div>

          <div className="card" style={{ padding: 'var(--space-5)' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-300)', marginBottom: 4 }}>Total Delivery Fee Revenue</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-accent)' }}>₦{deliveryRevenue.toLocaleString()}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-400)', marginTop: 2 }}>{(deliveredOrders ?? []).length} delivered order{(deliveredOrders ?? []).length !== 1 ? 's' : ''}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
