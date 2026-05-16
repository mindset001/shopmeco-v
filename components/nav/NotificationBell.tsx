'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { Bell, Check, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type NotificationItem = {
  id: string
  type: string
  title: string
  body: string | null
  data: { link?: string } | null
  related_id: string | null
  is_read: boolean
  created_at: string
}

interface NotificationBellProps {
  userId: string
}

const typeLabels: Record<string, string> = {
  booking_request: 'Booking',
  booking_confirmed: 'Booking',
  booking_completed: 'Booking',
  message: 'Message',
  order_update: 'Order',
  payment_released: 'Payment',
  withdrawal_approved: 'Wallet',
  withdrawal_rejected: 'Wallet',
}

function formatTime(value: string) {
  const date = new Date(value)
  const diffMs = Date.now() - date.getTime()
  const diffMinutes = Math.floor(diffMs / 60000)

  if (diffMinutes < 1) return 'Just now'
  if (diffMinutes < 60) return `${diffMinutes}m ago`

  const diffHours = Math.floor(diffMinutes / 60)
  if (diffHours < 24) return `${diffHours}h ago`

  const diffDays = Math.floor(diffHours / 24)
  if (diffDays < 7) return `${diffDays}d ago`

  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function getNotificationHref(notification: NotificationItem) {
  if (notification.data?.link) return notification.data.link
  if (notification.type === 'message') return '/chat'
  if (notification.type.startsWith('booking')) {
    return notification.related_id ? `/bookings/${notification.related_id}` : '/bookings'
  }
  if (notification.type === 'order_update') {
    return notification.related_id ? `/orders/${notification.related_id}` : '/orders'
  }
  if (notification.type.startsWith('withdrawal') || notification.type === 'payment_released') return '/wallet'
  return '/dashboard'
}

export default function NotificationBell({ userId }: NotificationBellProps) {
  const [items, setItems] = useState<NotificationItem[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const rootRef = useRef<HTMLDivElement>(null)
  const supabase = useMemo(() => createClient(), [])

  const loadNotifications = useCallback(async () => {
    setLoading(true)

    const [{ data }, { count }] = await Promise.all([
      supabase
        .from('notifications')
        .select('id, type, title, body, data, related_id, is_read, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10),
      supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_read', false),
    ])

    setItems((data ?? []) as NotificationItem[])
    setUnreadCount(count ?? 0)
    setLoading(false)
  }, [supabase, userId])

  useEffect(() => {
    const refreshTimer = window.setTimeout(() => {
      loadNotifications()
    }, 0)

    const channel = supabase
      .channel(`navbar_notifications_${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setUnreadCount((current) => current + ((payload.new as NotificationItem).is_read ? 0 : 1))
            setItems((current) => [payload.new as NotificationItem, ...current].slice(0, 10))
            loadNotifications()
            return
          }

          if (payload.eventType === 'UPDATE') {
            loadNotifications()
            return
          }

          if (payload.eventType === 'DELETE') {
            loadNotifications()
          }
        }
      )
      .subscribe()

    return () => {
      window.clearTimeout(refreshTimer)
      supabase.removeChannel(channel)
    }
  }, [loadNotifications, supabase, userId])

  useEffect(() => {
    if (!open) return

    const refreshTimer = window.setTimeout(() => {
      loadNotifications()
    }, 0)

    return () => window.clearTimeout(refreshTimer)
  }, [loadNotifications, open])

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [])

  async function markAsRead(notificationId: string) {
    setUpdating(true)
    const supabase = createClient()
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId)
      .eq('user_id', userId)

    if (!error) {
      setItems((current) =>
        current.map((item) => item.id === notificationId ? { ...item, is_read: true } : item)
      )
      setUnreadCount((current) => Math.max(0, current - 1))
    }
    setUpdating(false)
  }

  async function markAllAsRead() {
    if (unreadCount === 0) return

    setUpdating(true)
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false)

    if (!error) {
      setItems((current) => current.map((item) => ({ ...item, is_read: true })))
      setUnreadCount(0)
      loadNotifications()
    }
    setUpdating(false)
  }

  return (
    <div className="notification-bell" ref={rootRef}>
      <button
        type="button"
        className="notification-bell__button"
        onClick={() => setOpen((value) => !value)}
        aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ''}`}
        aria-expanded={open}
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="notification-bell__badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
        )}
      </button>

      {open && (
        <div className="notification-bell__panel">
          <div className="notification-bell__header">
            <div>
              <div className="notification-bell__title">Notifications</div>
              <div className="notification-bell__subtitle">
                {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
              </div>
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                className="notification-bell__mark-all"
                onClick={markAllAsRead}
                disabled={updating}
              >
                {updating ? <Loader2 size={14} className="btn__spinner" /> : <Check size={14} />}
                <span>Read</span>
              </button>
            )}
          </div>

          <div className="notification-bell__list">
            {loading ? (
              <div className="notification-bell__empty">Loading notifications...</div>
            ) : items.length === 0 ? (
              <div className="notification-bell__empty">No notifications yet.</div>
            ) : (
              items.map((item) => (
                <div key={item.id} className={`notification-item${item.is_read ? '' : ' notification-item--unread'}`}>
                  <Link
                    href={getNotificationHref(item)}
                    className="notification-item__link"
                    onClick={() => {
                      setOpen(false)
                      if (!item.is_read) markAsRead(item.id)
                    }}
                  >
                    <div className="notification-item__topline">
                      <span>{typeLabels[item.type] ?? 'Update'}</span>
                      <time dateTime={item.created_at}>{formatTime(item.created_at)}</time>
                    </div>
                    <div className="notification-item__title">{item.title}</div>
                    {item.body && <div className="notification-item__body">{item.body}</div>}
                  </Link>
                  {!item.is_read && (
                    <button
                      type="button"
                      className="notification-item__read"
                      onClick={() => markAsRead(item.id)}
                      aria-label="Mark notification as read"
                    >
                      <Check size={13} />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
