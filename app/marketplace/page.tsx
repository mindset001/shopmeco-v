import { Suspense } from 'react'
import Link from 'next/link'
import { ShoppingBag } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import Navbar from '@/components/nav/Navbar'
import { getCurrentProfile } from '@/lib/utils/profile'
import MarketplaceFilters from './MarketplaceFilters'

interface PageProps {
  searchParams: Promise<{ category?: string; brand?: string; q?: string }>
}

export default async function MarketplacePage({ searchParams }: PageProps) {
  const { category, brand, q } = await searchParams
  const profile = await getCurrentProfile()
  const supabase = await createClient()

  let query = supabase
    .from('products')
    .select('*, profiles(id, full_name, city)')
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  if (category) query = query.eq('category', category)
  if (brand) query = query.eq('brand', brand)
  if (q) query = query.ilike('name', `%${q}%`)

  const { data: products } = await query.limit(48)

  // Unique categories and brands for filter
  const { data: allProducts } = await supabase
    .from('products')
    .select('category, brand')
    .eq('is_active', true)

  const categories = [...new Set((allProducts ?? []).map((p) => p.category).filter(Boolean))]
  const brands = [...new Set((allProducts ?? []).map((p) => p.brand).filter(Boolean))]

  return (
    <>
      <Navbar profile={profile} />
      <div className="container section">
        <div className="page-header">
          <h1 className="page-title">Spare Parts Marketplace</h1>
          <p className="page-subtitle">
            Browse {products?.length ?? 0} listings from verified sellers
          </p>
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-8)', alignItems: 'flex-start' }}>
          {/* Filters sidebar */}
          <div style={{ width: 220, flexShrink: 0 }}>
            <MarketplaceFilters
              categories={categories as string[]}
              brands={brands as string[]}
              current={{ category, brand, q }}
            />
          </div>

          {/* Product grid */}
          <div style={{ flex: 1 }}>
            {profile?.role === 'parts_seller' && (
              <div style={{ marginBottom: 'var(--space-6)' }}>
                <Link href="/marketplace/new" className="btn btn--primary btn--md">
                  + New Listing
                </Link>
              </div>
            )}

            {products && products.length > 0 ? (
              <div className="product-grid">
                {(products as any[]).map((p) => (
                  <Link key={p.id} href={`/marketplace/${p.id}`}>
                    <div className="card card--hover product-card">
                      <div className="product-card__image">
                        {p.images?.[0] ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={p.images[0]} alt={p.name} />
                        ) : (
                          <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-surface-600)' }}>
                            <ShoppingBag size={44} />
                          </div>
                        )}
                      </div>
                      <div className="product-card__body">
                        <div className="product-card__name">{p.name}</div>
                        <div className="product-card__meta">
                          {[p.brand, p.category].filter(Boolean).join(' · ')}
                        </div>
                        <div className="product-card__price">
                          ₦{Number(p.price).toLocaleString()}
                        </div>
                      </div>
                      <div className="product-card__footer">
                        <span style={{ fontSize: '0.8rem', color: 'var(--color-text-300)' }}>
                          {p.profiles?.city ?? ''}
                        </span>
                        <span className={`badge ${p.stock_quantity > 0 ? 'badge--success' : 'badge--danger'}`}>
                          {p.stock_quantity > 0 ? `${p.stock_quantity} in stock` : 'Out of stock'}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <ShoppingBag size={48} className="empty-state__icon" />
                <div className="empty-state__title">No products found</div>
                <div className="empty-state__desc">Try adjusting your search or filters.</div>
                <Link href="/marketplace" className="btn btn--ghost btn--md">Clear Filters</Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
