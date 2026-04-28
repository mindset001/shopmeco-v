import { createClient } from '@/lib/supabase/server'

export type NotificationType = 
  | 'booking_request'
  | 'booking_confirmed'
  | 'booking_completed'
  | 'message'
  | 'order_update'
  | 'payment_released'

export async function createNotification(
  userId: string,
  type: NotificationType,
  title: string,
  body?: string,
  relatedId?: string,
  data?: Record<string, any>
) {
  const supabase = await createClient()
  const { error } = await supabase.from('notifications').insert({
    user_id: userId,
    type,
    title,
    body,
    related_id: relatedId,
    data: data || {},
  })
  if (error) {
    console.error('Failed to create notification:', error)
  }
}

export async function getNotifications(userId: string, limit = 20) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)
  return data || []
}

export async function markNotificationsAsRead(notificationIds: string[]) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .in('id', notificationIds)
  return !error
}

export async function countUnreadNotifications(userId: string) {
  const supabase = await createClient()
  const { count } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_read', false)
  return count ?? 0
}
