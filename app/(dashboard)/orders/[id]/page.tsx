import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { getCurrentProfile } from '@/lib/utils/profile'
import { createClient } from '@/lib/supabase/server'
import Badge from '@/components/ui/Badge'
import OrderActions from '../OrderActions'
import DisputeButton from '@/components/ui/DisputeButton'
import { formatDate } from '@/lib/utils/helpers'
import type { OrderStatus } from '@/types'

const statusVariant: Record<OrderStatus, 'default' | 'warning' | 'success' | 'danger' | 'info'> = {
  pending: 'warning', confirmed: 'info', shipped: 'info', delivered: 'success', cancelled: 'danger',
}

const timeline: OrderStatus[] = ['pending', 'confirmed', 'shipped', 'delivered']

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const profile = await getCurrentProfile()
  if (!profile) redirect('/login')

  const supabase = await createClient()

  const { data: order } = await supabase
    .from('orders')
    .select('*, products(id, name, description, images, price, category, brand), buyer:profiles!orders_buyer_id_fkey(id, full_name, phone, city, address), seller:profiles!orders_seller_id_fkey(id, full_name, phone, city)')
    .eq('id', id)
    .single()

  if (!order) notFound()

  // Only buyer, seller, or admin can view
  const canView =
    profile.id === order.buyer_id ||
    profile.id === order.seller_id ||
    profile.role === 'admin'
  if (!canView) redirect('/orders')

  const isSeller = profile.id === order.seller_id

  return (
    <div className="animate-fade-in">
      {/* Back + header */}
      <div className="page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <Link href="/orders" className="btn btn--ghost btn--sm" style={{ marginBottom: 8 }}>
            ← Back to Orders
          </Link>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            Order Details
            <Badge variant={statusVariant[order.status as OrderStatus]}>{order.status}</Badge>
          </h1>
          <p className="page-subtitle" style={{ fontFamily: 'monospace', fontSize: '0.8125rem' }}>
            {order.id}
          </p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-accent)' }}>
            ₦{Number(order.total_price).toLocaleString()}
          </div>
          <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-300)' }}>
            Placed {formatDate(order.created_at)}
          </div>
          {!isSeller && (
            <div style={{ marginTop: 4 }}>
              <DisputeButton
                customerId={profile.id}
                serviceProviderId={order.seller_id}
                relatedType="order"
                relatedId={order.id}
              />
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>

        {/* Product */}
        <div className="card">
          <h2 style={{ fontWeight: 700, marginBottom: 16, fontSize: '1rem' }}>Product</h2>
          <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
            {order.products?.images?.[0] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={order.products.images[0]}
                alt={order.products.name}
                style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--color-border)', flexShrink: 0 }}
              />
            ) : (
              <div style={{ width: 80, height: 80, background: 'var(--color-surface-700)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '2rem' }}>
                📦
              </div>
            )}
            <div>
              <div style={{ fontWeight: 700, marginBottom: 4 }}>{order.products?.name ?? '—'}</div>
              {order.products?.category && (
                <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-300)', marginBottom: 2 }}>{order.products.category}</div>
              )}
              {order.products?.brand && (
                <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-300)', marginBottom: 2 }}>Brand: {order.products.brand}</div>
              )}
              <div style={{ fontSize: '0.875rem', marginTop: 6 }}>
                ₦{Number(order.products?.price).toLocaleString()} × {order.quantity}
              </div>
            </div>
          </div>
          {order.products?.description && (
            <p style={{ marginTop: 16, fontSize: '0.875rem', color: 'var(--color-text-300)', lineHeight: 1.6, borderTop: '1px solid var(--color-border)', paddingTop: 12 }}>
              {order.products.description}
            </p>
          )}
        </div>

        {/* Buyer */}
        <div className="card">
          <h2 style={{ fontWeight: 700, marginBottom: 16, fontSize: '1rem' }}>Buyer</h2>
          <dl style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '8px 16px' }}>
            <dt style={{ color: 'var(--color-text-300)', fontSize: '0.8125rem' }}>Name</dt>
            <dd style={{ margin: 0, fontWeight: 500, fontSize: '0.875rem' }}>{order.buyer?.full_name ?? '—'}</dd>
            {order.buyer?.phone && (
              <>
                <dt style={{ color: 'var(--color-text-300)', fontSize: '0.8125rem' }}>Phone</dt>
                <dd style={{ margin: 0, fontWeight: 500, fontSize: '0.875rem' }}>{order.buyer.phone}</dd>
              </>
            )}
            {order.buyer?.city && (
              <>
                <dt style={{ color: 'var(--color-text-300)', fontSize: '0.8125rem' }}>City</dt>
                <dd style={{ margin: 0, fontWeight: 500, fontSize: '0.875rem' }}>{order.buyer.city}</dd>
              </>
            )}
            {order.delivery_address && (
              <>
                <dt style={{ color: 'var(--color-text-300)', fontSize: '0.8125rem' }}>Delivery&nbsp;Address</dt>
                <dd style={{ margin: 0, fontWeight: 500, fontSize: '0.875rem' }}>{order.delivery_address}</dd>
              </>
            )}
          </dl>
        </div>

        {/* Seller */}
        <div className="card">
          <h2 style={{ fontWeight: 700, marginBottom: 16, fontSize: '1rem' }}>Seller</h2>
          <dl style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '8px 16px' }}>
            <dt style={{ color: 'var(--color-text-300)', fontSize: '0.8125rem' }}>Name</dt>
            <dd style={{ margin: 0, fontWeight: 500, fontSize: '0.875rem' }}>{order.seller?.full_name ?? '—'}</dd>
            {order.seller?.phone && (
              <>
                <dt style={{ color: 'var(--color-text-300)', fontSize: '0.8125rem' }}>Phone</dt>
                <dd style={{ margin: 0, fontWeight: 500, fontSize: '0.875rem' }}>{order.seller.phone}</dd>
              </>
            )}
            {order.seller?.city && (
              <>
                <dt style={{ color: 'var(--color-text-300)', fontSize: '0.8125rem' }}>City</dt>
                <dd style={{ margin: 0, fontWeight: 500, fontSize: '0.875rem' }}>{order.seller.city}</dd>
              </>
            )}
          </dl>
        </div>
      </div>

      {/* Status timeline */}
      {order.status !== 'cancelled' && (
        <div className="card" style={{ marginTop: 20 }}>
          <h2 style={{ fontWeight: 700, marginBottom: 16, fontSize: '1rem' }}>Status Timeline</h2>
          <div style={{ display: 'flex', gap: 0 }}>
            {timeline.map((step, i) => {
              const currentIdx = timeline.indexOf(order.status as OrderStatus)
              const isDone = i < currentIdx
              const isActive = i === currentIdx
              const isLast = i === timeline.length - 1
              return (
                <div key={step} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, position: 'relative' }}>
                  {!isLast && (
                    <div style={{
                      position: 'absolute', top: 7, left: '50%', right: '-50%', height: 2,
                      background: isDone ? 'var(--color-success)' : 'var(--color-surface-600)',
                      zIndex: 0,
                    }} />
                  )}
                  <div style={{
                    width: 16, height: 16, borderRadius: '50%', zIndex: 1,
                    background: isDone ? 'var(--color-success)' : isActive ? 'var(--color-accent)' : 'var(--color-surface-600)',
                    border: isActive ? '2px solid var(--color-accent)' : '2px solid transparent',
                    flexShrink: 0,
                  }} />
                  <div style={{ fontSize: '0.75rem', textTransform: 'capitalize', color: isActive ? 'var(--color-text-100)' : isDone ? 'var(--color-success)' : 'var(--color-text-400)', fontWeight: isActive ? 700 : 400 }}>
                    {step}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Actions */}
      {(isSeller && order.status !== 'delivered' && order.status !== 'cancelled') ||
       (!isSeller && order.status === 'pending') ? (
        <div className="card" style={{ marginTop: 20 }}>
          <h2 style={{ fontWeight: 700, marginBottom: 16, fontSize: '1rem' }}>Actions</h2>
          <OrderActions orderId={order.id} currentStatus={order.status} isSeller={isSeller} />
        </div>
      ) : null}
    </div>
  )
}
