'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from '@/components/ui/Toaster'

interface Props {
  reportId: string
  currentStatus: string
}

export default function ReportActions({ reportId, currentStatus }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleStatusChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newStatus = e.target.value
    if (newStatus === currentStatus) return
    
    setLoading(true)
    const supabase = createClient()
    
    const { error } = await supabase
      .from('reports')
      .update({ 
        status: newStatus,
        resolved_at: newStatus === 'resolved' || newStatus === 'dismissed' ? new Date().toISOString() : null
      })
      .eq('id', reportId)

    if (error) {
      toast(error.message, 'error')
    } else {
      toast('Report status updated', 'success')
      router.refresh()
    }
    setLoading(false)
  }

  return (
    <select 
      className="input" 
      style={{ padding: '0.2rem 0.5rem', fontSize: '0.85rem', height: 'auto', minWidth: 130 }}
      value={currentStatus}
      onChange={handleStatusChange}
      disabled={loading}
    >
      <option value="open">Open</option>
      <option value="investigating">Investigating</option>
      <option value="resolved">Resolved</option>
      <option value="dismissed">Dismissed</option>
    </select>
  )
}
