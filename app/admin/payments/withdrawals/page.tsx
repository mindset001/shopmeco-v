import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentProfile } from '@/lib/utils/profile'
import { formatDate } from '@/lib/utils/helpers'
import Badge from '@/components/ui/Badge'
import WithdrawalActions from './WithdrawalActions'

export default async function AdminWithdrawalsPage() {
  const profile = await getCurrentProfile()
  if (!profile || profile.role !== 'admin') redirect('/dashboard')

  const supabase = createAdminClient()

  // Fetch withdrawal requests with user details
  const { data: requests } = await supabase
    .from('withdrawal_requests')
    .select('*, user:profiles!user_id(full_name, email, role)')
    .order('created_at', { ascending: false })

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Withdrawal Requests</h1>
        <p className="page-subtitle">Review and process seller and repairer payouts</p>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>User</th>
                <th>Amount</th>
                <th>Bank Details</th>
                <th>Status</th>
                <th>Date Requested</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {!requests?.length ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
                    No withdrawal requests found.
                  </td>
                </tr>
              ) : (
                requests.map((req: any) => (
                  <tr key={req.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{req.user?.full_name}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--color-text-300)' }}>
                        {req.user?.email} • <span style={{ textTransform: 'capitalize' }}>{req.user?.role?.replace('_', ' ')}</span>
                      </div>
                    </td>
                    <td style={{ fontWeight: 800, color: 'var(--color-accent)' }}>
                      ₦{Number(req.amount).toLocaleString()}
                    </td>
                    <td style={{ fontSize: '0.85rem' }}>
                      <div style={{ fontWeight: 600 }}>{req.bank_name}</div>
                      <div>{req.bank_account}</div>
                      <div style={{ color: 'var(--color-text-300)' }}>{req.account_holder}</div>
                    </td>
                    <td>
                      <Badge
                        variant={
                          req.status === 'pending' ? 'warning' :
                          req.status === 'approved' ? 'info' :
                          req.status === 'completed' ? 'success' : 'danger'
                        }
                      >
                        {req.status}
                      </Badge>
                    </td>
                    <td style={{ fontSize: '0.85rem', color: 'var(--color-text-300)' }}>
                      {formatDate(req.created_at)}
                    </td>
                    <td>
                      <WithdrawalActions 
                        requestId={req.id} 
                        userId={req.user_id}
                        amount={req.amount}
                        currentStatus={req.status} 
                      />
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
