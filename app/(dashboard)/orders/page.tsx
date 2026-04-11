import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getCurrentProfile } from '@/lib/utils/profile'
import { createClient } from '@/lib/supabase/server'
import { formatDate } from '@/lib/utils/helpers'
import Badge from '@/components/ui/Badge'
import OrderActions from './OrderActions'
import type { OrderStatus } from '@/types'

const statusVariant: Record<OrderStatus, 'default' | 'warning' | 'success' | 'danger' | 'info'> = {
  pending: 'warning',
  confirmed: 'info',
  shipped: 'info',
  delivered: 'success',
  cancelled: 'danger',
}

const timeline: OrderStatus[] = ['pending', 'confirmed', 'shipped', 'delivered']

export default async function OrdersPage() {
  const profile = await getCurrentProfile()
  if (!profile) redirect('/login')

  const supabase = await createClient()

  let query = supabase
    .from('orders')
    .select('*, products(id, name, images, price), buyer:profiles!orders_buyer_id_fkey(id, full_name), seller:profiles!orders_seller_id_fkey(id, full_name)')
    .order('created_at', { ascending: false })

  if (profile.role === 'car_owner' || profile.role === 'repairer') {
    query = query.eq('buyer_id', profile.id)
  } else if (profile.role === 'parts_seller') {
    query = query.eq('seller_id', profile.id)
  } else {
    // admin sees all
  }

  const { data: orders } = await query.limit(60)

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Orders</h1>
        <p className="page-subtitle">
          {profile.role === 'parts_seller' ? 'Manage incoming orders' : 'Your order history'}
        </p>
      </div>

      {orders && orders.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
          {(orders as any[]).map((order) => (
            <div key={order.id} className="card" style={{ padding: 'var(--space-6)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-4)', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
                <div style={{ display: 'flex', gap: 'var(--space-4)', alignItems: 'center' }}>
                  {order.products?.images?.[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={order.products.images[0]}
                      alt={order.products.name}
                      style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}
                    />
                  ) : (
                    <div style={{ width: 64, height: 64, background: 'var(--color-surface-700)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-surface-600)' }}>📦</div>
                  )}
                  <div>
                    <div style={{ fontWeight: 700, marginBottom: 4 }}>{order.products?.name ?? '—'}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--color-text-300)' }}>
                      Qty: {order.quantity} · {formatDate(order.created_at)}
                    </div>
                    {order.delivery_address && (
                      <div style={{ fontSize: '0.8rem', color: 'var(--color-text-400)', marginTop: 2 }}>
                        📍 {order.delivery_address}
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-accent)', marginBottom: 6 }}>
                    ₦{Number(order.total_price).toLocaleString()}
                  </div>
                  <Badge variant={statusVariant[order.status as OrderStatus]}>
                    {order.status}
                  </Badge>
                </div>
              </div>

              {/* Status timeline */}
              {order.status !== 'cancelled' && (
                <div style={{ display: 'flex', gap: 0, marginBottom: 'var(--space-4)', borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-4)' }}>
                  {timeline.map((step, i) => {
                    const currentIdx = timeline.indexOf(order.status as OrderStatus)
                    const isDone = i < currentIdx
                    const isActive = i === currentIdx
                    return (
                      <div key={step} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                        <div style={{ width: 12, height: 12, borderRadius: '50%', background: isDone ? 'var(--color-success)' : isActive ? 'var(--color-accent)' : 'var(--color-surface-600)' }} />
                        <div style={{ fontSize: '0.7rem', textTransform: 'capitalize', color: isActive ? 'var(--color-text-100)' : 'var(--color-text-400)' }}>
                          {step}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Actions */}
              {profile.role === 'parts_seller' && order.status !== 'delivered' && order.status !== 'cancelled' && (
                <OrderActions orderId={order.id} currentStatus={order.status} isSeller />
              )}
              {profile.role !== 'parts_seller' && order.status === 'pending' && (
                <OrderActions orderId={order.id} currentStatus={order.status} isSeller={false} />
              )}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'var(--space-3)' }}>
                <Link href={`/orders/${order.id}`} className="btn btn--ghost btn--sm">
                  View Details →
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-state__icon" style={{ fontSize: '3rem' }}>📦</div>
          <div className="empty-state__title">No orders yet</div>
          <div className="empty-state__desc">
            {profile.role === 'parts_seller' ? 'Orders from buyers will appear here.' : 'Browse the marketplace to place your first order.'}
          </div>
        </div>
      )}
    </div>
  )
}
