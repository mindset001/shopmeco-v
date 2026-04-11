import { redirect } from 'next/navigation'
import { getCurrentProfile } from '@/lib/utils/profile'
import { createClient } from '@/lib/supabase/server'
import ChatClient from './ChatClient'

interface PageProps {
  searchParams: Promise<{ with?: string; conv?: string }>
}

export default async function ChatPage({ searchParams }: PageProps) {
  const sp = await searchParams
  const profile = await getCurrentProfile()
  if (!profile) redirect('/login')

  const supabase = await createClient()

  // Load conversations
  const { data: conversations } = await supabase
    .from('conversations')
    .select('*, participant_1_profile:profiles!conversations_participant_1_fkey(id,full_name,avatar_url,role), participant_2_profile:profiles!conversations_participant_2_fkey(id,full_name,avatar_url,role)')
    .or(`participant_1.eq.${profile.id},participant_2.eq.${profile.id}`)
    .order('created_at', { ascending: false })

  // If ?with= param, find or create conversation
  let selectedConvId = sp.conv ?? null
  if (sp.with && !selectedConvId) {
    const otherId = sp.with
    const existing = (conversations ?? []).find((c: any) =>
      (c.participant_1 === profile.id && c.participant_2 === otherId) ||
      (c.participant_2 === profile.id && c.participant_1 === otherId)
    )
    if (existing) {
      selectedConvId = existing.id
    } else {
      const { data: newConv } = await supabase
        .from('conversations')
        .insert({ participant_1: profile.id, participant_2: otherId })
        .select()
        .single()
      if (newConv) selectedConvId = newConv.id
    }
  }

  if (!selectedConvId && conversations?.length) {
    selectedConvId = conversations[0].id
  }

  let initialMessages: any[] = []
  if (selectedConvId) {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', selectedConvId)
      .order('created_at', { ascending: true })
      .limit(80)
    initialMessages = data ?? []
  }

  const convsMapped = (conversations ?? []).map((c: any) => ({
    ...c,
    other_user: c.participant_1 === profile.id ? c.participant_2_profile : c.participant_1_profile,
  }))

  return (
    <ChatClient
      profile={profile}
      conversations={convsMapped}
      selectedConvId={selectedConvId}
      initialMessages={initialMessages}
    />
  )
}
