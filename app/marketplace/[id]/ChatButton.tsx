'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MessageSquare } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from '@/components/ui/Toaster'
import Button from '@/components/ui/Button'

interface Props {
  sellerId: string
  sellerName?: string
  productName?: string
  buyerId: string
}

export default function ChatButton({ sellerId, sellerName, productName, buyerId }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleChat() {
    setLoading(true)
    const supabase = createClient()

    // Find or create conversation
    const { data: existing } = await supabase
      .from('conversations')
      .select('id')
      .or(`participant_1.eq.${buyerId},participant_2.eq.${buyerId}`)
      .or(`participant_1.eq.${sellerId},participant_2.eq.${sellerId}`)
      .limit(1)
      .single()

    let convId = existing?.id

    if (!convId) {
      // Create new conversation
      const { data, error } = await supabase
        .from('conversations')
        .insert({
          participant_1: buyerId,
          participant_2: sellerId,
        })
        .select('id')
        .single()

      if (error) {
        toast('Could not start conversation', 'error')
        setLoading(false)
        return
      }
      convId = data.id
    }

    // Navigate to chat
    router.push(`/chat?conv=${convId}`)
    setLoading(false)
  }

  return (
    <Button
      fullWidth
      size="lg"
      variant="ghost"
      onClick={handleChat}
      disabled={loading}
      style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
    >
      <MessageSquare size={18} />
      {loading ? 'Opening chat...' : 'Chat with Seller'}
    </Button>
  )
}
