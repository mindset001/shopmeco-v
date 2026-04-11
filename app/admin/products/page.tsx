import { Suspense } from 'react'
import { createAdminClient } from '@/lib/supabase/admin'
import { formatDate } from '@/lib/utils/helpers'
import ProductToggle from './ProductToggle'
import AdminSearchInput from '@/components/admin/AdminSearchInput'
import AdminPagination from '@/components/admin/AdminPagination'

const PAGE_SIZE = 20

interface PageProps {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>
}

export default async function AdminProductsPage({ searchParams }: PageProps) {
  const { q, status, page } = await searchParams
  const supabase = createAdminClient()

  const currentPage = Math.max(1, parseInt(page ?? '1'))
  const from = (currentPage - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  let query = supabase.from('products').select('*, profiles(full_name)', { count: 'exact' })
  if (q) query = query.ilike('name', `%${q}%`)
  if (status === 'active') query = query.eq('is_active', true)
  else if (status === 'hidden') query = query.eq('is_active', false)
  const { data: products, count } = await query.order('created_at', { ascending: false }).range(from, to)

  const baseParams = new URLSearchParams()
  if (q) baseParams.set('q', q)
  if (status) baseParams.set('status', status)
  const baseQuery = baseParams.size ? `?${baseParams.toString()}` : ''

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Product Management</h1>
        <p className="page-subtitle">{count ?? 0} listed products</p>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap', marginBottom: 'var(--space-5)', alignItems: 'center' }}>
        <Suspense>
          <AdminSearchInput placeholder="Search by product name…" />
        </Suspense>
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          {([['', 'All'], ['active', 'Active'], ['hidden', 'Hidden']] as const).map(([val, label]) => {
            const params = new URLSearchParams()
            if (q) params.set('q', q)
            if (val) params.set('status', val)
            return (
              <a key={val || 'all'} href={`?${params.toString()}`} className={`btn btn--sm ${status === val || (!status && !val) ? 'btn--secondary' : 'btn--ghost'}`}>
                {label}
              </a>
            )
          })}
        </div>
      </div>

      <div className="card">
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Seller</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Status</th>
                <th>Listed</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {(products ?? []).map((p: any) => (
                <tr key={p.id}>
                  <td style={{ fontWeight: 600 }}>{p.name}</td>
                  <td style={{ color: 'var(--color-text-300)' }}>{p.profiles?.full_name ?? '—'}</td>
                  <td>₦{Number(p.price).toLocaleString()}</td>
                  <td>{p.stock_quantity}</td>
                  <td>
                    <span className={`badge ${p.is_active ? 'badge--success' : 'badge--danger'}`}>
                      {p.is_active ? 'Active' : 'Hidden'}
                    </span>
                  </td>
                  <td style={{ color: 'var(--color-text-300)' }}>{formatDate(p.created_at)}</td>
                  <td>
                    <ProductToggle productId={p.id} isActive={p.is_active} />
                  </td>
                </tr>
              ))}
              {(products ?? []).length === 0 && (
                <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--color-text-400)', padding: '2rem' }}>No products found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <AdminPagination currentPage={currentPage} totalCount={count ?? 0} pageSize={PAGE_SIZE} baseQuery={baseQuery} />
      </div>
    </div>
  )
}
