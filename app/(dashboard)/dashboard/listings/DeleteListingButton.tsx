'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from '@/components/ui/Toaster'

export default function DeleteListingButton({ productId }: { productId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    const confirmed = window.confirm('Delete this listing? This cannot be undone.')
    if (!confirmed) return
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.from('products').delete().eq('id', productId)
    if (error) {
      toast(error.message, 'error')
    } else {
      toast('Listing deleted.', 'info')
      router.refresh()
    }
    setLoading(false)
  }

  return (
    <button
      className="btn btn--ghost btn--sm"
      onClick={handleDelete}
      disabled={loading}
      aria-label="Delete listing"
      style={{ color: 'var(--color-danger)' }}
    >
      <Trash2 size={16} />
    </button>
  )
}
