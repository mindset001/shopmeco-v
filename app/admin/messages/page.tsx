import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'
import Avatar from '@/components/ui/Avatar'
import { formatDate } from '@/lib/utils/helpers'
import AdminSearchInput from '@/components/admin/AdminSearchInput'

interface PageProps {
  searchParams: Promise<{ conv?: string; q?: string }>
}

export default async function AdminMessagesPage({ searchParams }: PageProps) {
  const { conv, q } = await searchParams
  const supabase = createAdminClient()

  // Load all conversations with participant profiles
  const { data: conversations } = await supabase
    .from('conversations')
    .select(
      '*, p1:profiles!conversations_participant_1_fkey(id,full_name,avatar_url,role), p2:profiles!conversations_participant_2_fkey(id,full_name,avatar_url,role)'
    )
    .order('created_at', { ascending: false })

  // Filter by search query (match either participant name)
  const filtered = (conversations ?? []).filter((c: any) => {
    if (!q) return true
    const lower = q.toLowerCase()
    return (
      c.p1?.full_name?.toLowerCase().includes(lower) ||
      c.p2?.full_name?.toLowerCase().includes(lower)
    )
  })

  // Load messages for selected conversation
  let messages: any[] = []
  let activeConv: any = null
  if (conv) {
    activeConv = (conversations ?? []).find((c: any) => c.id === conv)
    const { data } = await supabase
      .from('messages')
      .select('*, sender:profiles!messages_sender_id_fkey(id,full_name,avatar_url)')
      .eq('conversation_id', conv)
      .order('created_at', { ascending: true })
    messages = data ?? []
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Message Oversight</h1>
        <p className="page-subtitle">
          Read-only view of all user conversations for security moderation.
        </p>
      </div>

      <div style={{ display: 'flex', gap: 'var(--space-4)', height: 'calc(100vh - 220px)', minHeight: 400 }}>
        {/* Conversation list */}
        <div className="card" style={{ width: 300, flexShrink: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: 0 }}>
          <div style={{ padding: 'var(--space-3) var(--space-4)', borderBottom: '1px solid var(--color-border)' }}>
            <AdminSearchInput placeholder="Search by name…" />
          </div>
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {filtered.length === 0 ? (
              <div style={{ padding: 'var(--space-6)', color: 'var(--color-text-300)', fontSize: '0.9rem', textAlign: 'center' }}>
                No conversations found.
              </div>
            ) : (
              filtered.map((c: any) => {
                const isActive = c.id === conv
                return (
                  <Link
                    key={c.id}
                    href={`?${q ? `q=${encodeURIComponent(q)}&` : ''}conv=${c.id}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--space-3)',
                      padding: 'var(--space-3) var(--space-4)',
                      borderBottom: '1px solid var(--color-border)',
                      background: isActive ? 'var(--color-surface-hover)' : 'transparent',
                      textDecoration: 'none',
                      color: 'inherit',
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
                      <span style={{ fontWeight: 600, fontSize: '0.875rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {c.p1?.full_name ?? 'Unknown'} &amp; {c.p2?.full_name ?? 'Unknown'}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-text-300)' }}>
                        {formatDate(c.created_at)}
                      </span>
                    </div>
                  </Link>
                )
              })
            )}
          </div>
        </div>

        {/* Message view */}
        <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: 0 }}>
          {activeConv ? (
            <>
              {/* Header */}
              <div style={{
                padding: 'var(--space-4) var(--space-5)',
                borderBottom: '1px solid var(--color-border)',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-4)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <Avatar src={activeConv.p1?.avatar_url} name={activeConv.p1?.full_name} size="sm" />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{activeConv.p1?.full_name ?? 'Unknown'}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-300)', textTransform: 'capitalize' }}>
                      {activeConv.p1?.role?.replace('_', ' ')}
                    </div>
                  </div>
                </div>
                <span style={{ color: 'var(--color-text-300)' }}>↔</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <Avatar src={activeConv.p2?.avatar_url} name={activeConv.p2?.full_name} size="sm" />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{activeConv.p2?.full_name ?? 'Unknown'}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-300)', textTransform: 'capitalize' }}>
                      {activeConv.p2?.role?.replace('_', ' ')}
                    </div>
                  </div>
                </div>
                <div style={{ marginLeft: 'auto', fontSize: '0.75rem', color: 'var(--color-text-300)' }}>
                  {messages.length} message{messages.length !== 1 ? 's' : ''}
                </div>
              </div>

              {/* Messages */}
              <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                {messages.length === 0 ? (
                  <div style={{ textAlign: 'center', color: 'var(--color-text-400)', fontSize: '0.9rem', margin: 'auto' }}>
                    No messages in this conversation.
                  </div>
                ) : (
                  messages.map((m: any) => (
                    <div key={m.id} style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'flex-start' }}>
                      <Avatar src={m.sender?.avatar_url} name={m.sender?.full_name} size="sm" />
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 4 }}>
                          <span style={{ fontWeight: 600, fontSize: '0.8rem' }}>{m.sender?.full_name ?? 'Unknown'}</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-300)' }}>{formatDate(m.created_at)}</span>
                        </div>
                        <div style={{
                          background: 'var(--color-surface-raised)',
                          borderRadius: 'var(--radius-md)',
                          padding: 'var(--space-3) var(--space-4)',
                          fontSize: '0.875rem',
                          lineHeight: 1.5,
                          maxWidth: 600,
                          wordBreak: 'break-word',
                        }}>
                          {m.content}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, color: 'var(--color-text-400)', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <span style={{ fontSize: '2rem' }}>💬</span>
              <span>Select a conversation to view messages.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
