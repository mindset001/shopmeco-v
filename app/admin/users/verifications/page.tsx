import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentProfile } from '@/lib/utils/profile'
import { formatDate } from '@/lib/utils/helpers'
import Badge from '@/components/ui/Badge'
import VerificationActions from './VerificationActions'
import SafeImage from '@/components/ui/SafeImage'

export default async function AdminVerificationsPage() {
  const profile = await getCurrentProfile()
  if (!profile || profile.role !== 'admin') redirect('/dashboard')

  const supabase = createAdminClient()

  const { data: verifications } = await supabase
    .from('id_verifications')
    .select('*, profile:profiles!user_id(full_name, email, role, is_verified)')
    .order('submitted_at', { ascending: false })

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Identity Verifications</h1>
        <p className="page-subtitle">Review and approve KYC submissions</p>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>User</th>
                <th>Document</th>
                <th>Status</th>
                <th>Submitted</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {!verifications?.length ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
                    No verifications found.
                  </td>
                </tr>
              ) : (
                verifications.map((v: any) => (
                  <tr key={v.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{v.profile?.full_name}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--color-text-300)' }}>{v.profile?.email} • {v.profile?.role}</div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                        <div style={{ width: 80, height: 50, borderRadius: 'var(--radius-sm)', overflow: 'hidden', background: 'var(--color-surface-700)' }}>
                          {v.id_image_url ? (
                            <SafeImage src={v.id_image_url} alt="ID Document" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem' }}>No Image</div>
                          )}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{v.id_type}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--color-text-300)' }}>{v.id_number}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <Badge variant={v.status === 'approved' ? 'success' : v.status === 'rejected' ? 'danger' : 'warning'}>
                        {v.status}
                      </Badge>
                    </td>
                    <td style={{ fontSize: '0.85rem', color: 'var(--color-text-300)' }}>
                      {formatDate(v.submitted_at)}
                    </td>
                    <td>
                      <VerificationActions verificationId={v.id} userId={v.user_id} status={v.status} />
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
