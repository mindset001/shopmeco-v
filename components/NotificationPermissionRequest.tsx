'use client'

import { useEffect } from 'react'

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)))
}

export default function NotificationPermissionRequest({ userId }: { userId: string }) {
  useEffect(() => {
    const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
    if (!userId || !vapidPublicKey) return
    if (!('Notification' in window) || !('serviceWorker' in navigator) || !('PushManager' in window)) return

    async function subscribe() {
      if (Notification.permission === 'default') {
        const permission = await Notification.requestPermission().catch(() => 'denied')
        if (permission !== 'granted') return
      }
      if (Notification.permission !== 'granted') return

      const registration = await navigator.serviceWorker.ready
      let subscription = await registration.pushManager.getSubscription()

      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidPublicKey!),
        })
      }

      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscription.toJSON()),
      }).catch(() => {})
    }

    subscribe()
  }, [userId])

  return null
}
