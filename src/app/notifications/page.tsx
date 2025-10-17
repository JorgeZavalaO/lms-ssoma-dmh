"use client"

import * as React from "react"
import { Bell, Check, CheckCheck, Trash2, Archive, Settings, AlertCircle, Clock, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import Link from "next/link"

type Notification = {
  id: string
  subject: string
  bodyHtml: string
  bodyText: string
  createdAt: string
  isRead: boolean
  isArchived: boolean
  priority: string
  type: string
  relatedCourseId?: string | null
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = React.useState<Notification[]>([])
  const [loading, setLoading] = React.useState(true)
  const [activeTab, setActiveTab] = React.useState("all")

  const loadNotifications = React.useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (activeTab === "unread") params.set("isRead", "false")
      if (activeTab === "archived") params.set("isArchived", "true")
      
      const res = await fetch(`/api/notifications?pageSize=50&${params.toString()}`)
      if (!res.ok) throw new Error("Error loading notifications")
      const data = await res.json()
      setNotifications(data.items)
    } catch (error) {
      console.error("Error loading notifications:", error)
      toast.error("Error al cargar notificaciones")
    } finally {
      setLoading(false)
    }
  }, [activeTab])

  const markAsRead = async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isRead: true }),
      })
      await loadNotifications()
      toast.success("Notificación marcada como leída")
    } catch (error) {
      console.error("Error marking as read:", error)
      toast.error("Error al marcar como leída")
    }
  }

  const markAllAsRead = async () => {
    try {
      await fetch("/api/notifications/mark-all-read", { method: "POST" })
      await loadNotifications()
      toast.success("Todas las notificaciones marcadas como leídas")
    } catch (error) {
      console.error("Error marking all as read:", error)
      toast.error("Error al marcar todas como leídas")
    }
  }

  const archiveNotification = async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isArchived: true }),
      })
      await loadNotifications()
      toast.success("Notificación archivada")
    } catch (error) {
      console.error("Error archiving:", error)
      toast.error("Error al archivar")
    }
  }

  const deleteNotification = async (id: string) => {
    if (!confirm("¿Está seguro de eliminar esta notificación?")) return

    try {
      await fetch(`/api/notifications/${id}`, { method: "DELETE" })
      await loadNotifications()
      toast.success("Notificación eliminada")
    } catch (error) {
      console.error("Error deleting:", error)
      toast.error("Error al eliminar")
    }
  }

  React.useEffect(() => {
    loadNotifications()
  }, [loadNotifications])

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "URGENT":
        return "destructive"
      case "HIGH":
        return "default"
      case "MEDIUM":
        return "secondary"
      case "LOW":
        return "outline"
      default:
        return "secondary"
    }
  }

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      NEW_ENROLLMENT: "Nueva Asignación",
      REMINDER_30_DAYS: "Recordatorio 30 días",
      REMINDER_7_DAYS: "Recordatorio 7 días",
      REMINDER_1_DAY: "Recordatorio 1 día",
      COURSE_FAILED: "Evaluación Desaprobada",
      CERTIFICATE_READY: "Certificado Disponible",
      RECERTIFICATION_DUE: "Recertificación Próxima",
      TEAM_SUMMARY: "Resumen de Equipo",
    }
    return labels[type] || type
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "NEW_ENROLLMENT":
        return <Bell className="size-4 text-blue-500" />
      case "REMINDER_30_DAYS":
      case "REMINDER_7_DAYS":
      case "REMINDER_1_DAY":
        return <Clock className="size-4 text-orange-500" />
      case "COURSE_FAILED":
        return <AlertCircle className="size-4 text-red-500" />
      case "CERTIFICATE_READY":
        return <CheckCircle2 className="size-4 text-green-500" />
      case "RECERTIFICATION_DUE":
        return <Clock className="size-4 text-yellow-500" />
      default:
        return <Bell className="size-4 text-muted-foreground" />
    }
  }

  return (
    <div className="container mx-auto py-8 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Notificaciones</h1>
          <p className="text-muted-foreground">
            Gestiona tus notificaciones y recordatorios
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={markAllAsRead} variant="outline">
            <CheckCheck className="size-4 mr-2" />
            Marcar todas leídas
          </Button>
          <Button asChild variant="outline">
            <Link href="/notifications/preferences">
              <Settings className="size-4 mr-2" />
              Preferencias
            </Link>
          </Button>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardDescription>Total</CardDescription>
              <Bell className="size-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{notifications.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardDescription>No Leídas</CardDescription>
              <AlertCircle className="size-4 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {notifications.filter(n => !n.isRead).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardDescription>Leídas</CardDescription>
              <CheckCircle2 className="size-4 text-green-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {notifications.filter(n => n.isRead && !n.isArchived).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardDescription>Archivadas</CardDescription>
              <Archive className="size-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-muted-foreground">
              {notifications.filter(n => n.isArchived).length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all">Todas</TabsTrigger>
          <TabsTrigger value="unread">No Leídas</TabsTrigger>
          <TabsTrigger value="archived">Archivadas</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {loading ? (
            <div className="text-center py-12 text-muted-foreground">
              Cargando notificaciones...
            </div>
          ) : notifications.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <Bell className="size-12 mx-auto mb-4 opacity-50" />
                <p>No hay notificaciones {activeTab === "unread" ? "no leídas" : activeTab === "archived" ? "archivadas" : ""}</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {notifications.map((notification) => (
                <Card key={notification.id} className={!notification.isRead ? "border-l-4 border-l-blue-500" : ""}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <CardTitle className="text-base flex items-center gap-2">
                            {getTypeIcon(notification.type)}
                            {notification.subject}
                          </CardTitle>
                          {!notification.isRead && (
                            <Badge variant="default" className="text-xs">Nuevo</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant={getPriorityColor(notification.priority)} className="text-xs">
                            {notification.priority}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {getTypeLabel(notification.type)}
                          </Badge>
                          <CardDescription className="text-xs">
                            {new Date(notification.createdAt).toLocaleString("es", {
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {!notification.isRead && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => markAsRead(notification.id)}
                            title="Marcar como leída"
                          >
                            <Check className="size-4" />
                          </Button>
                        )}
                        {!notification.isArchived && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => archiveNotification(notification.id)}
                            title="Archivar"
                          >
                            <Archive className="size-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteNotification(notification.id)}
                          title="Eliminar"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div
                      className="prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: notification.bodyHtml }}
                    />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
