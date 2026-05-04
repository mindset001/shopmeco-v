import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentProfile } from '@/lib/utils/profile'
import { formatDate } from '@/lib/utils/helpers'
import Badge from '@/components/ui/Badge'
import ReportActions from './ReportActions'

export default async function AdminReportsPage() {
  const profile = await getCurrentProfile()
  if (!profile || profile.role !== 'admin') redirect('/dashboard')

  const supabase = createAdminClient()

  // Fetch reports with related reporter and reported user details
  const { data: reports } = await supabase
    .from('reports')
    .select(`
      *,
      reporter:profiles!reporter_id(full_name, email),
      reported_user:profiles!reported_user_id(full_name, email),
      reported_product:products!reported_product_id(name)
    `)
    .order('created_at', { ascending: false })

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Reports Management</h1>
        <p className="page-subtitle">Review user reports for inappropriate content or behavior</p>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Reported Target</th>
                <th>Reason</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {!reports?.length ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
                    No reports found.
                  </td>
                </tr>
              ) : (
                reports.map((report: any) => (
                  <tr key={report.id}>
                    <td>
                      <Badge variant="info" style={{ textTransform: 'capitalize' }}>
                        {report.report_type}
                      </Badge>
                    </td>
                    <td>
                      {report.report_type === 'user' && report.reported_user ? (
                        <div>
                          <div style={{ fontWeight: 600 }}>{report.reported_user.full_name}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--color-text-300)' }}>{report.reported_user.email}</div>
                        </div>
                      ) : report.report_type === 'product' && report.reported_product ? (
                        <div style={{ fontWeight: 600 }}>{report.reported_product.name}</div>
                      ) : (
                        <span style={{ color: 'var(--color-text-400)' }}>N/A</span>
                      )}
                    </td>
                    <td style={{ maxWidth: 200 }}>
                      <div style={{ fontWeight: 600 }}>{report.reason}</div>
                      {report.description && (
                        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-300)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {report.description}
                        </div>
                      )}
                    </td>
                    <td>
                      <Badge
                        variant={
                          report.status === 'open' ? 'danger' :
                          report.status === 'investigating' ? 'warning' :
                          report.status === 'resolved' ? 'success' : 'default'
                        }
                      >
                        {report.status}
                      </Badge>
                    </td>
                    <td style={{ fontSize: '0.85rem', color: 'var(--color-text-300)' }}>
                      {formatDate(report.created_at)}
                    </td>
                    <td>
                      <ReportActions reportId={report.id} currentStatus={report.status} />
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
