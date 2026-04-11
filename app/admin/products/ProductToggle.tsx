'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from '@/components/ui/Toaster'

export default function ProductToggle({ productId, isActive }: { productId: string; isActive: boolean }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function toggle() {
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.from('products').update({ is_active: !isActive }).eq('id', productId)
    if (error) { toast(error.message, 'error') }
    else { toast(isActive ? 'Product hidden.' : 'Product activated.', 'success'); router.refresh() }
    setLoading(false)
  }

  return (
    <button
      className={`btn btn--sm ${isActive ? 'btn--danger' : 'btn--secondary'}`}
      onClick={toggle}
      disabled={loading}
    >
      {isActive ? 'Hide' : 'Activate'}
    </button>
  )
}
