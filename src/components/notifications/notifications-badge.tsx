"use client"

import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"

export function NotificationsBadge() {
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  const loadUnreadCount = async () => {
    try {
      const res = await fetch("/api/notifications/unread-count")
      if (!res.ok) throw new Error("Error loading unread count")
      const data = await res.json()
      setUnreadCount(data.count || 0)
    } catch (error) {
      console.error("Error loading unread count:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    // Load initial count
    loadUnreadCount()

    // Refresh every 10 seconds
    const interval = setInterval(loadUnreadCount, 10000)

    // Also listen for custom events (if notifications are marked as read elsewhere)
    const handleNotificationUpdate = () => {
      loadUnreadCount()
    }

    window.addEventListener("notificationUpdate", handleNotificationUpdate)

    return () => {
      clearInterval(interval)
      window.removeEventListener("notificationUpdate", handleNotificationUpdate)
    }
  }, [])

  if (isLoading || unreadCount === 0) {
    return null
  }

  return (
    <Badge 
      variant="destructive" 
      className="ml-auto h-6 w-6 rounded-full p-0 flex items-center justify-center text-xs font-bold"
    >
      {unreadCount > 99 ? "99+" : unreadCount}
    </Badge>
  )
}
