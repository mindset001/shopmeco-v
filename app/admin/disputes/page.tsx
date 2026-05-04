import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentProfile } from '@/lib/utils/profile'
import { formatDate } from '@/lib/utils/helpers'
import Badge from '@/components/ui/Badge'
import DisputeActions from './DisputeActions'

export default async function AdminDisputesPage() {
  const profile = await getCurrentProfile()
  if (!profile || profile.role !== 'admin') redirect('/dashboard')

  const supabase = createAdminClient()

  // Fetch disputes with related customer and service provider details
  const { data: disputes } = await supabase
    .from('disputes')
    .select(`
      *,
      customer:profiles!customer_id(full_name, email),
      service_provider:profiles!service_provider_id(full_name, email)
    `)
    .order('created_at', { ascending: false })

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Disputes & Support</h1>
        <p className="page-subtitle">Manage transaction and service disputes</p>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Dispute details</th>
                <th>Parties Involved</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {!disputes?.length ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
                    No disputes found.
                  </td>
                </tr>
              ) : (
                disputes.map((dispute: any) => (
                  <tr key={dispute.id}>
                    <td style={{ maxWidth: 250 }}>
                      <div style={{ fontWeight: 600 }}>{dispute.title}</div>
                      <Badge variant="info" style={{ marginTop: 4, display: 'inline-block' }}>{dispute.type}</Badge>
                      <div style={{ fontSize: '0.8rem', color: 'var(--color-text-300)', marginTop: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {dispute.description}
                      </div>
                    </td>
                    <td>
                      <div style={{ marginBottom: 8 }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-text-400)' }}>Customer</span>
                        <div style={{ fontWeight: 600 }}>{dispute.customer?.full_name}</div>
                      </div>
                      <div>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-text-400)' }}>Provider</span>
                        <div style={{ fontWeight: 600 }}>{dispute.service_provider?.full_name}</div>
                      </div>
                    </td>
                    <td>
                      <Badge
                        variant={
                          dispute.status === 'open' ? 'danger' :
                          dispute.status === 'in_review' ? 'warning' :
                          dispute.status === 'resolved' ? 'success' : 'default'
                        }
                      >
                        {dispute.status}
                      </Badge>
                    </td>
                    <td style={{ fontSize: '0.85rem', color: 'var(--color-text-300)' }}>
                      {formatDate(dispute.created_at)}
                    </td>
                    <td>
                      <DisputeActions disputeId={dispute.id} currentStatus={dispute.status} resolution={dispute.resolution} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
