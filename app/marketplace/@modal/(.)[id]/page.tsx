import { notFound } from 'next/navigation'
import Link from 'next/link'
import { MapPin, ShoppingBag, MessageSquare } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getCurrentProfile } from '@/lib/utils/profile'
import { formatDate } from '@/lib/utils/helpers'
import OrderButton from '@/app/marketplace/[id]/OrderButton'
import ChatButton from '@/app/marketplace/[id]/ChatButton'
import ReportButton from '@/components/ui/ReportButton'
import LocationMapClient from '@/components/ui/LocationMapClient'
import RouteModal from '@/components/ui/RouteModal'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function ProductModalPage({ params }: PageProps) {
  const { id } = await params
  const profile = await getCurrentProfile()
  const supabase = await createClient()

  const { data: product } = await supabase
    .from('products')
    .select('id, name, description, images, category, brand, condition, stock_quantity, price, seller_id, compatible_cars, created_at, street, city, state, profiles(id, full_name, avatar_url, city, state, latitude, longitude)')
    .eq('id', id)
    .single()

  if (!product) notFound()

  return (
    <RouteModal>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-6)', alignItems: 'flex-start' }}>
        {/* Images */}
        <div>
          <div style={{ background: 'var(--color-surface-800)', borderRadius: 'var(--radius-xl)', overflow: 'hidden', aspectRatio: '4/3', marginBottom: 'var(--space-4)' }}>
            {product.images?.[0] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={product.images[0]} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-surface-600)' }}>
                <ShoppingBag size={72} />
              </div>
            )}
          </div>
          {product.images?.length > 1 && (
            <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
              {(product.images as string[]).slice(1).map((src, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={i} src={src} alt={`${product.name} ${i + 2}`}
                  style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div style={{ maxHeight: '70vh', overflowY: 'auto', paddingRight: 'var(--space-2)' }}>
          <div style={{ marginBottom: 'var(--space-2)', display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
            {product.condition && <span className="badge badge--warning">{product.condition}</span>}
            {product.category && <span className="badge badge--info">{product.category}</span>}
            {product.brand && <span className="badge badge--default">{product.brand}</span>}
            {product.stock_quantity > 0
              ? <span className="badge badge--success">{product.stock_quantity} in stock</span>
              : <span className="badge badge--danger">Out of stock</span>}
          </div>

          <h1 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: 'var(--space-2)' }}>
            {product.name}
          </h1>

          <div style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--color-accent)', marginBottom: 'var(--space-4)' }}>
            ₦{Number(product.price).toLocaleString()}
          </div>

          {product.description && (
            <p style={{ color: 'var(--color-text-300)', lineHeight: 1.6, marginBottom: 'var(--space-4)', fontSize: '0.9rem' }}>
              {product.description}
            </p>
          )}

          {(product.city || product.state || product.street) && (
            <div style={{ marginBottom: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)', color: 'var(--color-text-300)', fontSize: '0.85rem' }}>
              <MapPin size={16} />
              <span>{[product.street, product.city, product.state].filter(Boolean).join(', ')}</span>
            </div>
          )}

          {product.compatible_cars?.length > 0 && (
            <div style={{ marginBottom: 'var(--space-4)' }}>
              <div style={{ fontWeight: 600, marginBottom: 'var(--space-2)', fontSize: '0.9rem' }}>Compatible with</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
                {(product.compatible_cars as string[]).map((car) => (
                  <span key={car} className="badge badge--default" style={{ fontSize: '0.75rem' }}>{car}</span>
                ))}
              </div>
            </div>
          )}

          <div className="card" style={{ padding: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
              <span className="avatar avatar--md avatar--fallback" style={{ fontSize: 14 }}>
                {((product as any).profiles?.full_name ?? '?')[0]}
              </span>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{(product as any).profiles?.full_name ?? 'Seller'}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-300)' }}>
                  <MapPin size={11} style={{ display: 'inline', marginRight: 3 }} />
                  {(product as any).profiles?.city ?? ''} {(product as any).profiles?.state ?? ''}
                </div>
              </div>
              <Link href={`/profile/${(product as any).profiles?.id}`} className="btn btn--ghost btn--sm" style={{ marginLeft: 'auto' }}>
                Profile
              </Link>
            </div>
          </div>

          {profile && profile.id !== product.seller_id && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              <OrderButton product={product} buyerId={profile.id} />
              <ChatButton
                sellerId={product.seller_id}
                sellerName={(product as any).profiles?.full_name}
                productName={product.name}
                buyerId={profile.id}
              />
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: 'var(--space-2)' }}>
                <ReportButton
                  reporterId={profile.id}
                  reportType="product"
                  reportedProductId={product.id}
                  reportedUserId={product.seller_id}
                />
              </div>
            </div>
          )}
          {!profile && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              <Link href="/login" className="btn btn--primary btn--md btn--full">
                Sign in to Order
              </Link>
              <Link href="/login" className="btn btn--ghost btn--md btn--full" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
                <MessageSquare size={16} />
                Sign in to Chat
              </Link>
            </div>
          )}

          {(product as any).profiles?.latitude && (product as any).profiles?.longitude && (
            <div style={{ marginTop: 'var(--space-4)', paddingTop: 'var(--space-4)', borderTop: '1px solid var(--color-border)' }}>
              <div style={{ fontWeight: 600, marginBottom: 'var(--space-3)', display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.9rem' }}>
                <MapPin size={15} /> Seller Location
              </div>
              <LocationMapClient
                lat={(product as any).profiles.latitude}
                lng={(product as any).profiles.longitude}
                label={(product as any).profiles?.full_name ?? 'Seller'}
                height={160}
              />
            </div>
          )}

          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-400)', marginTop: 'var(--space-3)' }}>
            Listed on {formatDate(product.created_at)}
          </div>
        </div>
      </div>
    </RouteModal>
  )
}
