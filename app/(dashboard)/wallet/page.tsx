import { redirect } from 'next/navigation'
import { getCurrentProfile } from '@/lib/utils/profile'
import { createClient } from '@/lib/supabase/server'
import { formatDate } from '@/lib/utils/helpers'
import Badge from '@/components/ui/Badge'
import type { TransactionType } from '@/types'

const typeLabel: Record<TransactionType, string> = {
  escrow_hold: 'Payment Sent',
  escrow_release: 'Payment Received',
  withdrawal: 'Withdrawal',
}

const typeVariant: Record<TransactionType, 'danger' | 'success' | 'warning'> = {
  escrow_hold: 'danger',
  escrow_release: 'success',
  withdrawal: 'warning',
}

export default async function WalletPage() {
  const profile = await getCurrentProfile()
  if (!profile) redirect('/login')
  if (profile.role === 'car_owner') redirect('/dashboard')

  const supabase = await createClient()

  const { data: wallet } = await supabase
    .from('wallets')
    .select('*')
    .eq('user_id', profile.id)
    .maybeSingle()

  const { data: transactions } = await supabase
    .from('wallet_transactions')
    .select('*')
    .eq('user_id', profile.id)
    .order('created_at', { ascending: false })
    .limit(50)

  const balance = wallet?.balance ?? 0

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">My Wallet</h1>
        <p className="page-subtitle">Your earnings and transaction history</p>
      </div>

      {/* Balance card */}
      <div className="card" style={{ padding: 'var(--space-8)', marginBottom: 'var(--space-6)', background: 'var(--color-accent)', color: '#fff', borderRadius: 'var(--radius-xl)' }}>
        <div style={{ fontSize: '0.9rem', opacity: 0.85, marginBottom: 'var(--space-2)' }}>Available Balance</div>
        <div style={{ fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-1px' }}>
          ₦{balance.toLocaleString()}
        </div>
        <div style={{ fontSize: '0.8rem', opacity: 0.7, marginTop: 'var(--space-2)' }}>
          Payments held in escrow are released by admin after job confirmation.
        </div>
      </div>

      {/* Incoming escrow (held, not yet released) */}
      <EscrowHeldSection userId={profile.id} supabase={supabase} />

      {/* Transaction history */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: 'var(--space-4) var(--space-5)', borderBottom: '1px solid var(--color-border)', fontWeight: 700 }}>
          Transaction History
        </div>
        {!transactions?.length ? (
          <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--color-text-300)' }}>
            No transactions yet.
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Description</th>
                  <th>Amount</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx: any) => (
                  <tr key={tx.id}>
                    <td>
                      <Badge variant={typeVariant[tx.type as TransactionType]}>
                        {typeLabel[tx.type as TransactionType] ?? tx.type}
                      </Badge>
                    </td>
                    <td style={{ color: 'var(--color-text-200)', fontSize: '0.875rem' }}>
                      {tx.description ?? '—'}
                    </td>
                    <td style={{ fontWeight: 700, color: tx.type === 'escrow_release' ? 'var(--color-success)' : 'var(--color-danger)' }}>
                      {tx.type === 'escrow_release' ? '+' : '-'}₦{Number(tx.amount).toLocaleString()}
                    </td>
                    <td style={{ color: 'var(--color-text-300)', fontSize: '0.85rem' }}>
                      {formatDate(tx.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

async function EscrowHeldSection({ userId, supabase }: { userId: string; supabase: any }) {
  const { data: held } = await supabase
    .from('escrow_payments')
    .select('*')
    .eq('payee_id', userId)
    .eq('status', 'held')
    .order('created_at', { ascending: false })

  if (!held?.length) return null

  const total = held.reduce((sum: number, p: any) => sum + Number(p.amount), 0)

  return (
    <div className="card" style={{ padding: 'var(--space-5)', marginBottom: 'var(--space-5)', border: '1px solid var(--color-warning)', background: 'color-mix(in srgb, var(--color-warning) 8%, transparent)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
        <div style={{ fontWeight: 700 }}>⏳ Pending Release</div>
        <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>₦{total.toLocaleString()}</div>
      </div>
      <div style={{ fontSize: '0.85rem', color: 'var(--color-text-300)' }}>
        {held.length} payment{held.length !== 1 ? 's' : ''} held in escrow, awaiting admin release after job completion.
      </div>
    </div>
  )
}
