import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'
import Badge from '@/components/ui/Badge'
import { formatDate } from '@/lib/utils/helpers'
import CreateFieldAgentForm from './CreateFieldAgentForm'

type FieldAgent = {
  id: string
  full_name: string | null
  phone: string | null
  created_at: string
  is_suspended: boolean
  field_agent_allowed_roles: string[] | null
}

type CreatedAccount = {
  created_by: string | null
  role: string
}

const ROLE_LABELS: Record<string, string> = {
  repairer: 'Repairers',
  parts_seller: 'Parts sellers',
}

export default async function AdminFieldAgentsPage() {
  const supabase = createAdminClient()

  const [{ data: agents }, { data: createdAccounts }, { count: totalCreated }] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, full_name, phone, created_at, is_suspended, field_agent_allowed_roles')
      .eq('role', 'field_agent')
      .order('created_at', { ascending: false }),
    supabase
      .from('profiles')
      .select('created_by, role')
      .not('created_by', 'is', null)
      .in('role', ['repairer', 'parts_seller']),
    supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .not('created_by', 'is', null)
      .in('role', ['repairer', 'parts_seller']),
  ])

  const countsByAgent = new Map<string, { total: number; repairer: number; parts_seller: number }>()
  for (const account of (createdAccounts ?? []) as CreatedAccount[]) {
    if (!account.created_by) continue
    const current = countsByAgent.get(account.created_by) ?? { total: 0, repairer: 0, parts_seller: 0 }
    current.total += 1
    if (account.role === 'repairer') current.repairer += 1
    if (account.role === 'parts_seller') current.parts_seller += 1
    countsByAgent.set(account.created_by, current)
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Field Agents</h1>
        <p className="page-subtitle">{agents?.length ?? 0} agents · {totalCreated ?? 0} registered business accounts</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 360px) 1fr', gap: 'var(--space-5)', alignItems: 'start' }}>
        <CreateFieldAgentForm />

        <div className="card">
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Agent</th>
                  <th>Assigned Types</th>
                  <th>Accounts Created</th>
                  <th>Status</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {((agents ?? []) as FieldAgent[]).map((agent) => {
                  const counts = countsByAgent.get(agent.id) ?? { total: 0, repairer: 0, parts_seller: 0 }
                  return (
                    <tr key={agent.id}>
                      <td>
                        <Link href={`/admin/users/${agent.id}`} style={{ color: 'inherit', fontWeight: 600, textDecoration: 'none' }} className="hover-underline">
                          {agent.full_name ?? 'Unnamed agent'}
                        </Link>
                        <div style={{ color: 'var(--color-text-300)', fontSize: '0.8rem' }}>{agent.phone ?? 'No phone'}</div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          {(agent.field_agent_allowed_roles ?? []).map((role) => (
                            <Badge key={role} variant={role === 'repairer' ? 'accent' : 'success'}>
                              {ROLE_LABELS[role] ?? role.replace('_', ' ')}
                            </Badge>
                          ))}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 800 }}>{counts.total}</div>
                        <div style={{ color: 'var(--color-text-300)', fontSize: '0.78rem' }}>
                          {counts.repairer} repairers · {counts.parts_seller} sellers
                        </div>
                      </td>
                      <td>
                        {agent.is_suspended ? <Badge variant="danger">Suspended</Badge> : <Badge variant="success">Active</Badge>}
                      </td>
                      <td style={{ color: 'var(--color-text-300)' }}>{formatDate(agent.created_at)}</td>
                    </tr>
                  )
                })}
                {(agents ?? []).length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', color: 'var(--color-text-400)', padding: '2rem' }}>
                      No field agents yet.
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
