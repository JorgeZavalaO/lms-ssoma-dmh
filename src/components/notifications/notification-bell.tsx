"use client"

import * as React from "react"
import { Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import Link from "next/link"

type Notification = {
  id: string
  subject: string
  bodyText: string
  createdAt: string
  isRead: boolean
  priority: string
  relatedCourseId?: string | null
}

export function NotificationBell() {
  const [unreadCount, setUnreadCount] = React.useState(0)
  const [notifications, setNotifications] = React.useState<Notification[]>([])
  const [isLoading, setIsLoading] = React.useState(false)

  // Cargar contador de no leídas
  const loadUnreadCount = React.useCallback(async () => {
    try {
      const res = await fetch("/api/notifications/unread-count")
      if (!res.ok) return
      const data = await res.json()
      setUnreadCount(data.count)
    } catch (error) {
      console.error("Error loading unread count:", error)
    }
  }, [])

  // Cargar notificaciones recientes
  const loadNotifications = React.useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await fetch("/api/notifications?pageSize=10&isArchived=false")
      if (!res.ok) return
      const data = await res.json()
      setNotifications(data.items)
    } catch (error) {
      console.error("Error loading notifications:", error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Marcar como leída
  const markAsRead = React.useCallback(async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isRead: true }),
      })
      await loadUnreadCount()
      await loadNotifications()
    } catch (error) {
      console.error("Error marking as read:", error)
    }
  }, [loadUnreadCount, loadNotifications])

  // Marcar todas como leídas
  const markAllAsRead = React.useCallback(async () => {
    try {
      await fetch("/api/notifications/mark-all-read", { method: "POST" })
      await loadUnreadCount()
      await loadNotifications()
    } catch (error) {
      console.error("Error marking all as read:", error)
    }
  }, [loadUnreadCount, loadNotifications])

  // Cargar datos al montar
  React.useEffect(() => {
    loadUnreadCount()
  }, [loadUnreadCount])

  // Actualizar cada 30 segundos
  React.useEffect(() => {
    const interval = setInterval(() => {
      loadUnreadCount()
    }, 30000)

    return () => clearInterval(interval)
  }, [loadUnreadCount])

  return (
    <DropdownMenu onOpenChange={(open) => open && loadNotifications()}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="size-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -right-1 -top-1 size-5 rounded-full p-0 flex items-center justify-center text-[10px]"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-96">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h3 className="font-semibold">Notificaciones</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="h-auto py-1 px-2 text-xs"
            >
              Marcar todas como leídas
            </Button>
          )}
        </div>

        <ScrollArea className="h-[400px]">
          {isLoading ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              Cargando...
            </div>
          ) : notifications.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No hay notificaciones
            </div>
          ) : (
            notifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className="cursor-pointer px-4 py-3 flex-col items-start gap-1"
                onClick={() => {
                  if (!notification.isRead) {
                    markAsRead(notification.id)
                  }
                }}
              >
                <div className="flex items-start gap-2 w-full">
                  {!notification.isRead && (
                    <div className="size-2 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm leading-tight truncate">
                      {notification.subject}
                    </p>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                      {notification.bodyText}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(notification.createdAt).toLocaleDateString("es", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              </DropdownMenuItem>
            ))
          )}
        </ScrollArea>

        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/notifications" className="w-full text-center py-2">
            Ver todas las notificaciones
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
