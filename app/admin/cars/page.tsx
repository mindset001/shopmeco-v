import { createAdminClient } from '@/lib/supabase/admin'
import { formatDate } from '@/lib/utils/helpers'
import Badge from '@/components/ui/Badge'

export default async function AdminCarsPage() {
  const supabase = createAdminClient()
  const { data: cars } = await supabase
    .from('cars')
    .select('*, profiles(full_name, city)')
    .order('created_at', { ascending: false })

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Cars Directory</h1>
        <p className="page-subtitle">{cars?.length ?? 0} registered vehicles</p>
      </div>

      <div className="card">
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Vehicle</th>
                <th>Owner</th>
                <th>City</th>
                <th>Plate</th>
                <th>Visibility</th>
                <th>Added</th>
              </tr>
            </thead>
            <tbody>
              {(cars ?? []).map((c: any) => (
                <tr key={c.id}>
                  <td style={{ fontWeight: 600 }}>{c.year} {c.make} {c.model}</td>
                  <td style={{ color: 'var(--color-text-300)' }}>{c.profiles?.full_name ?? '—'}</td>
                  <td style={{ color: 'var(--color-text-300)' }}>{c.profiles?.city ?? '—'}</td>
                  <td>{c.plate_number ?? '—'}</td>
                  <td>
                    <Badge variant={c.is_public ? 'success' : 'warning'}>
                      {c.is_public ? 'Public' : 'Private'}
                    </Badge>
                  </td>
                  <td style={{ color: 'var(--color-text-300)' }}>{formatDate(c.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
