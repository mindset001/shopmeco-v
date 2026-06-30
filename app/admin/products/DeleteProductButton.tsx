'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from '@/components/ui/Toaster'

export default function DeleteProductButton({ productId }: { productId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    const confirmed = window.confirm('Permanently delete this product? This cannot be undone.')
    if (!confirmed) return
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.from('products').delete().eq('id', productId)
    if (error) {
      toast(error.message, 'error')
    } else {
      toast('Product deleted.', 'info')
      router.refresh()
    }
    setLoading(false)
  }

  return (
    <button
      className="btn btn--sm btn--ghost"
      onClick={handleDelete}
      disabled={loading}
      style={{ color: 'var(--color-danger)' }}
    >
      Delete
    </button>
  )
}
