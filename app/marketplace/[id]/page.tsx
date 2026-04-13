import { notFound } from 'next/navigation'
import Link from 'next/link'
import { MapPin, ShoppingBag } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getCurrentProfile } from '@/lib/utils/profile'
import Navbar from '@/components/nav/Navbar'
import { formatDate } from '@/lib/utils/helpers'
import OrderButton from './OrderButton'
import type { Metadata } from 'next'
import LocationMapClient from '@/components/ui/LocationMapClient'

interface PageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const { data: product } = await supabase
    .from('products')
    .select('name, description, images, category, brand')
    .eq('id', id)
    .single()
  if (!product) return { title: 'Product not found — ShopMecko' }
  return {
    title: `${product.name} — ShopMecko Marketplace`,
    description: product.description ?? `Buy ${product.name}${product.brand ? ` by ${product.brand}` : ''} on ShopMecko.`,
    openGraph: {
      title: product.name,
      description: product.description ?? undefined,
      images: product.images?.[0] ? [{ url: product.images[0] }] : [],
    },
  }
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { id } = await params
  const profile = await getCurrentProfile()
  const supabase = await createClient()

  const { data: product } = await supabase
    .from('products')
    .select('*, profiles(id, full_name, avatar_url, city, state, latitude, longitude)')
    .eq('id', id)
    .single()

  if (!product) notFound()

  return (
    <>
      <Navbar profile={profile} />
      <div className="container section">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 420px', gap: 'var(--space-12)', alignItems: 'flex-start' }}>
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
              <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
                {(product.images as string[]).slice(1).map((src, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={i} src={src} alt={`${product.name} ${i + 2}`}
                    style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div>
            <div style={{ marginBottom: 'var(--space-2)', display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
              {product.category && <span className="badge badge--info">{product.category}</span>}
              {product.brand && <span className="badge badge--default">{product.brand}</span>}
              {product.stock_quantity > 0
                ? <span className="badge badge--success">{product.stock_quantity} in stock</span>
                : <span className="badge badge--danger">Out of stock</span>}
            </div>

            <h1 style={{ fontSize: '1.75rem', fontWeight: 900, marginBottom: 'var(--space-3)' }}>
              {product.name}
            </h1>

            <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--color-accent)', marginBottom: 'var(--space-6)' }}>
              ₦{Number(product.price).toLocaleString()}
            </div>

            {product.description && (
              <p style={{ color: 'var(--color-text-300)', lineHeight: 1.7, marginBottom: 'var(--space-6)' }}>
                {product.description}
              </p>
            )}

            {product.compatible_cars?.length > 0 && (
              <div style={{ marginBottom: 'var(--space-6)' }}>
                <div style={{ fontWeight: 600, marginBottom: 'var(--space-2)' }}>Compatible with</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
                  {(product.compatible_cars as string[]).map((car) => (
                    <span key={car} className="badge badge--default">{car}</span>
                  ))}
                </div>
              </div>
            )}

            <div className="card" style={{ padding: 'var(--space-5)', marginBottom: 'var(--space-6)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
                <span className="avatar avatar--md avatar--fallback" style={{ fontSize: 14 }}>
                  {((product as any).profiles?.full_name ?? '?')[0]}
                </span>
                <div>
                  <div style={{ fontWeight: 600 }}>{(product as any).profiles?.full_name ?? 'Seller'}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-300)' }}>
                    <MapPin size={11} style={{ display: 'inline', marginRight: 3 }} />
                    {(product as any).profiles?.city ?? ''} {(product as any).profiles?.state ?? ''}
                  </div>
                </div>
                <Link href={`/profile/${(product as any).profiles?.id}`} className="btn btn--ghost btn--sm" style={{ marginLeft: 'auto' }}>
                  View profile
                </Link>
              </div>
            </div>

            {profile && profile.id !== product.seller_id && (
              <OrderButton product={product} buyerId={profile.id} />
            )}
            {!profile && (
              <Link href="/login" className="btn btn--primary btn--lg btn--full">
                Sign in to Order
              </Link>
            )}

            {(product as any).profiles?.latitude && (product as any).profiles?.longitude && (
              <div style={{ marginTop: 'var(--space-6)', paddingTop: 'var(--space-6)', borderTop: '1px solid var(--color-border)' }}>
                <div style={{ fontWeight: 600, marginBottom: 'var(--space-3)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <MapPin size={15} /> Seller Location
                </div>
                <LocationMapClient
                  lat={(product as any).profiles.latitude}
                  lng={(product as any).profiles.longitude}
                  label={(product as any).profiles?.full_name ?? 'Seller'}
                  height={220}
                />
              </div>
            )}

            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-400)', marginTop: 'var(--space-4)' }}>
              Listed on {formatDate(product.created_at)}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
