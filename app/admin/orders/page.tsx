import { createAdminClient } from '@/lib/supabase/admin'
import Badge from '@/components/ui/Badge'
import { formatDate } from '@/lib/utils/helpers'
import type { OrderStatus } from '@/types'

const statusVariant: Record<OrderStatus, 'default' | 'warning' | 'success' | 'danger' | 'info'> = {
  pending: 'warning', confirmed: 'info', shipped: 'info', delivered: 'success', cancelled: 'danger',
}

export default async function AdminOrdersPage() {
  const supabase = createAdminClient()
  const { data: orders } = await supabase
    .from('orders')
    .select('*, products(name), buyer:profiles!orders_buyer_id_fkey(full_name), seller:profiles!orders_seller_id_fkey(full_name)')
    .order('created_at', { ascending: false })
    .limit(100)

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Orders Overview</h1>
        <p className="page-subtitle">{orders?.length ?? 0} orders total</p>
      </div>

      <div className="card">
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Buyer</th>
                <th>Seller</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {(orders ?? []).map((o: any) => (
                <tr key={o.id}>
                  <td style={{ fontWeight: 600 }}>{o.products?.name ?? '—'}</td>
                  <td style={{ color: 'var(--color-text-300)' }}>{o.buyer?.full_name ?? '—'}</td>
                  <td style={{ color: 'var(--color-text-300)' }}>{o.seller?.full_name ?? '—'}</td>
                  <td>₦{Number(o.total_price).toLocaleString()}</td>
                  <td><Badge variant={statusVariant[o.status as OrderStatus]}>{o.status}</Badge></td>
                  <td style={{ color: 'var(--color-text-300)' }}>{formatDate(o.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
