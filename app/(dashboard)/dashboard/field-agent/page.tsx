import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCurrentProfile } from '@/lib/utils/profile'
import Badge from '@/components/ui/Badge'
import { formatDate } from '@/lib/utils/helpers'
import RegisterBusinessForm from './RegisterBusinessForm'

type RegistrableRole = 'repairer' | 'parts_seller'

type CreatedProfile = {
  id: string
  full_name: string | null
  phone: string | null
  role: RegistrableRole
  created_at: string
  is_verified: boolean
}

const ROLE_LABELS: Record<RegistrableRole, string> = {
  repairer: 'Repairer',
  parts_seller: 'Parts seller',
}

export default async function FieldAgentDashboardPage() {
  const profile = await getCurrentProfile()
  if (!profile) redirect('/login')
  if (profile.role !== 'field_agent' && profile.role !== 'admin') redirect('/dashboard')

  const supabase = await createClient()
  const allowedRoles = profile.role === 'admin'
    ? ['repairer', 'parts_seller'] as RegistrableRole[]
    : ((profile.field_agent_allowed_roles ?? []) as string[])
      .filter((role): role is RegistrableRole => role === 'repairer' || role === 'parts_seller')

  const [
    { data: createdProfiles },
    { count: repairerCount },
    { count: sellerCount },
  ] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, full_name, phone, role, created_at, is_verified')
      .eq('created_by', profile.id)
      .in('role', ['repairer', 'parts_seller'])
      .order('created_at', { ascending: false }),
    supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('created_by', profile.id)
      .eq('role', 'repairer'),
    supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('created_by', profile.id)
      .eq('role', 'parts_seller'),
  ])

  const accounts = (createdProfiles ?? []) as CreatedProfile[]
  const totalCount = (repairerCount ?? 0) + (sellerCount ?? 0)

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Field Agent Desk</h1>
        <p className="page-subtitle">Create assigned business accounts and track your registrations.</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-card__label">Accounts Created</div>
          <div className="stat-card__value">{totalCount}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card__label">Repairers</div>
          <div className="stat-card__value">{repairerCount ?? 0}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card__label">Parts Sellers</div>
          <div className="stat-card__value">{sellerCount ?? 0}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 360px) 1fr', gap: 'var(--space-5)', alignItems: 'start' }}>
        <RegisterBusinessForm allowedRoles={allowedRoles} />

        <div className="card">
          <div className="section-header" style={{ marginBottom: 'var(--space-4)' }}>
            <div>
              <h2 className="section-title">All Accounts</h2>
              <p style={{ color: 'var(--color-text-300)', fontSize: '0.875rem' }}>
                All repairers and parts sellers you have registered.
              </p>
            </div>
          </div>

          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {accounts.map((account) => (
                  <tr key={account.id}>
                    <td>
                      {profile.role === 'admin' ? (
                        <Link href={`/admin/users/${account.id}`} style={{ color: 'inherit', fontWeight: 600, textDecoration: 'none' }} className="hover-underline">
                          {account.full_name ?? 'Unnamed account'}
                        </Link>
                      ) : (
                        <span style={{ fontWeight: 600 }}>{account.full_name ?? 'Unnamed account'}</span>
                      )}
                      <div style={{ color: 'var(--color-text-300)', fontSize: '0.8rem' }}>{account.phone ?? 'No phone'}</div>
                    </td>
                    <td>
                      <Badge variant={account.role === 'repairer' ? 'accent' : 'success'}>
                        {ROLE_LABELS[account.role]}
                      </Badge>
                    </td>
                    <td>
                      {account.is_verified ? <Badge variant="success">Verified</Badge> : <Badge variant="default">Active</Badge>}
                    </td>
                    <td style={{ color: 'var(--color-text-300)' }}>{formatDate(account.created_at)}</td>
                  </tr>
                ))}
                {accounts.length === 0 && (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', color: 'var(--color-text-400)', padding: '2rem' }}>
                      No accounts created yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
