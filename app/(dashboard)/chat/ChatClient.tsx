'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Send } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/types'
import Avatar from '@/components/ui/Avatar'
import { formatRelativeTime } from '@/lib/utils/helpers'
import Toaster from '@/components/ui/Toaster'

interface Props {
  profile: Profile
  conversations: any[]
  selectedConvId: string | null
  initialMessages: any[]
}

export default function ChatClient({ profile, conversations, selectedConvId: initConvId, initialMessages }: Props) {
  const router = useRouter()
  const [activeConvId, setActiveConvId] = useState<string | null>(initConvId)
  const [messages, setMessages] = useState<any[]>(initialMessages)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  const activeConv = conversations.find((c) => c.id === activeConvId)

  // Scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Realtime subscription
  useEffect(() => {
    if (!activeConvId) return
    const channel = supabase
      .channel(`messages:${activeConvId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${activeConvId}` },
        (payload) => {
          setMessages((prev) => [...prev, payload.new])
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeConvId])

  async function switchConv(convId: string) {
    setActiveConvId(convId)
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', convId)
      .order('created_at', { ascending: true })
      .limit(80)
    setMessages(data ?? [])
    router.replace(`/chat?conv=${convId}`)
  }

  async function sendMessage() {
    if (!text.trim() || !activeConvId || sending) return
    setSending(true)
    const content = text.trim()
    setText('')
    await supabase.from('messages').insert({
      conversation_id: activeConvId,
      sender_id: profile.id,
      content,
      is_read: false,
    })
    setSending(false)
  }

  return (
    <>
      <Toaster />
      <div className="chat-layout" style={{ height: 'calc(100vh - 64px)' }}>
        {/* Conversation list */}
        <div className="chat-sidebar">
          <div style={{ padding: 'var(--space-4)', borderBottom: '1px solid var(--color-border)', fontWeight: 700 }}>
            Messages
          </div>
          {conversations.length === 0 ? (
            <div style={{ padding: 'var(--space-6)', color: 'var(--color-text-300)', fontSize: '0.9rem' }}>
              No conversations yet. Message a repairer or seller to start.
            </div>
          ) : (
            conversations.map((c) => (
              <div
                key={c.id}
                className={`conv-item${c.id === activeConvId ? ' conv-item--active' : ''}`}
                onClick={() => switchConv(c.id)}
              >
                <Avatar src={c.other_user?.avatar_url} name={c.other_user?.full_name} size="md" />
                <div className="conv-item__info">
                  <div className="conv-item__name">{c.other_user?.full_name ?? 'User'}</div>
                  <div className="conv-item__preview" style={{ textTransform: 'capitalize' }}>
                    {c.other_user?.role?.replace('_', ' ')}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Chat area */}
        <div className="chat-main">
          {activeConv ? (
            <>
              {/* Header */}
              <div style={{ padding: 'var(--space-4) var(--space-6)', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                <Avatar src={activeConv.other_user?.avatar_url} name={activeConv.other_user?.full_name} size="md" />
                <div>
                  <div style={{ fontWeight: 700 }}>{activeConv.other_user?.full_name}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-300)', textTransform: 'capitalize' }}>
                    {activeConv.other_user?.role?.replace('_', ' ')}
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="chat-messages">
                {messages.length === 0 && (
                  <div style={{ textAlign: 'center', color: 'var(--color-text-400)', fontSize: '0.9rem', margin: 'auto' }}>
                    Start the conversation!
                  </div>
                )}
                {messages.map((m) => {
                  const isSent = m.sender_id === profile.id
                  return (
                    <div key={m.id} style={{ display: 'flex', flexDirection: 'column', alignItems: isSent ? 'flex-end' : 'flex-start' }}>
                      <div className={`chat-bubble ${isSent ? 'chat-bubble--sent' : 'chat-bubble--received'}`}>
                        {m.content}
                        <div className="chat-bubble__time">{formatRelativeTime(m.created_at)}</div>
                      </div>
                    </div>
                  )
                })}
                <div ref={bottomRef} />
              </div>

              {/* Input */}
              <div className="chat-input-bar">
                <input
                  className="input"
                  style={{ flex: 1 }}
                  placeholder="Type a message…"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
                />
                <button
                  className="btn btn--primary btn--md"
                  onClick={sendMessage}
                  disabled={!text.trim() || sending}
                >
                  <Send size={16} />
                </button>
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, color: 'var(--color-text-400)' }}>
              Select a conversation or message someone to get started.
            </div>
          )}
        </div>
      </div>
    </>
  )
}
