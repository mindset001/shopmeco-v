import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getCurrentProfile } from '@/lib/utils/profile'
import Badge from '@/components/ui/Badge'
import { ShoppingBag, Edit, Eye, EyeOff, Trash2 } from 'lucide-react'

export default async function MyListingsPage() {
  const profile = await getCurrentProfile()
  if (!profile || profile.role !== 'parts_seller') redirect('/dashboard')

  const supabase = await createClient()
  const { data: products } = await supabase
    .from('products')
    .select('*')
    .eq('seller_id', profile.id)
    .order('created_at', { ascending: false })

  return (
    <div className="animate-fade-in">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
        <div>
          <h1 className="page-title">My Listings</h1>
          <p className="page-subtitle">Manage your spare parts catalog and inventory.</p>
        </div>
        <Link href="/marketplace/new" className="btn btn--primary btn--md">
          + Add Listing
        </Link>
      </div>

      {products && products.length > 0 ? (
        <div className="card">
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {(products as any[]).map((p) => (
                  <tr key={p.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                        <div style={{ width: 40, height: 40, borderRadius: 8, background: 'var(--color-surface-600)', overflow: 'hidden', flexShrink: 0 }}>
                          {p.images?.[0] ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={p.images[0]} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <ShoppingBag size={16} />
                            </div>
                          )}
                        </div>
                        <div style={{ fontWeight: 600, maxWidth: 250, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {p.name}
                        </div>
                      </div>
                    </td>
                    <td style={{ fontWeight: 600 }}>₦{Number(p.price).toLocaleString()}</td>
                    <td>
                      <span className={`badge ${p.stock_quantity > 0 ? 'badge--default' : 'badge--danger'}`}>
                        {p.stock_quantity}
                      </span>
                    </td>
                    <td>
                      <Badge variant={p.is_active ? 'success' : 'warning'}>
                        {p.is_active ? 'Active' : 'Draft/Hidden'}
                      </Badge>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)' }}>
                        <Link href={`/marketplace/${p.id}`} target="_blank" className="btn btn--ghost btn--sm" aria-label="View public listing">
                          <Eye size={16} />
                        </Link>
                        <Link href={`/dashboard/listings/${p.id}/edit`} className="btn btn--ghost btn--sm" aria-label="Edit listing">
                          <Edit size={16} />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="empty-state">
          <ShoppingBag size={48} className="empty-state__icon" />
          <div className="empty-state__title">No listings yet</div>
          <div className="empty-state__desc">You haven't added any spare parts to the marketplace.</div>
          <Link href="/marketplace/new" className="btn btn--primary btn--md" style={{ marginTop: 12 }}>
            Add your first listing
          </Link>
        </div>
      )}
    </div>
  )
}
