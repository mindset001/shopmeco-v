import { redirect } from 'next/navigation'
import { getCurrentProfile } from '@/lib/utils/profile'
import { getPlatformSettings } from '@/lib/settings/platform-settings'
import { formatDate } from '@/lib/utils/helpers'
import SubscribeButton from './SubscribeButton'
import { CheckCircle2, AlertTriangle } from 'lucide-react'

export default async function SubscriptionPage() {
  const profile = await getCurrentProfile()
  if (!profile || (profile.role !== 'repairer' && profile.role !== 'parts_seller')) {
    redirect('/dashboard')
  }

  const settings = await getPlatformSettings()
  const isActive = Boolean(
    profile.subscription_expires_at && new Date(profile.subscription_expires_at).getTime() > Date.now()
  )

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Subscription</h1>
        <p className="page-subtitle">
          {profile.role === 'repairer'
            ? 'An active subscription is required to receive new booking requests.'
            : 'An active subscription is required to receive new orders.'}
        </p>
      </div>

      <div className="card" style={{ padding: 'var(--space-6)', maxWidth: 480 }}>
        {isActive ? (
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-3)', marginBottom: 'var(--space-5)' }}>
            <CheckCircle2 size={22} style={{ color: 'var(--color-success)', flexShrink: 0, marginTop: 2 }} />
            <div>
              <div style={{ fontWeight: 700 }}>Active</div>
              <div style={{ color: 'var(--color-text-300)', fontSize: '0.9rem' }}>
                Valid until {formatDate(profile.subscription_expires_at as string)}
              </div>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-3)', marginBottom: 'var(--space-5)' }}>
            <AlertTriangle size={22} style={{ color: '#f59e0b', flexShrink: 0, marginTop: 2 }} />
            <div>
              <div style={{ fontWeight: 700 }}>Not currently active</div>
              <div style={{ color: 'var(--color-text-300)', fontSize: '0.9rem' }}>
                Your profile stays visible, but customers can&apos;t {profile.role === 'repairer' ? 'book' : 'order from'} you until you subscribe.
              </div>
            </div>
          </div>
        )}

        <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-5)' }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--color-text-300)', marginBottom: 'var(--space-4)' }}>
            ₦{settings.subscription_price.toLocaleString()} for {settings.subscription_duration_days} days
          </div>
          <SubscribeButton label={isActive ? 'Renew Subscription' : 'Subscribe Now'} />
        </div>
      </div>
    </div>
  )
}
