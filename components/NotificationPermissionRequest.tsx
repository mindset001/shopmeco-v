'use client'

import { useEffect } from 'react'

export default function NotificationPermissionRequest() {
  useEffect(() => {
    // Request notification permission if not already granted
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {
        // User denied or dismissed the request
      })
    }
  }, [])

  return null
}
