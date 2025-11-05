"use client"

import { useEffect, useState, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Info, CheckCircle, Clock, Search, RefreshCw, Eye, EyeOff, X } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { toast } from "sonner"

interface ProgressAlert {
  id: string
  collaborator: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
  course: {
    id: string
    name: string
    code: string
  } | null
  type: "COURSE_EXPIRING" | "COURSE_EXPIRED" | "RECERTIFICATION_REQUIRED" | "CUSTOM"
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"
  message: string
  isRead: boolean
  isDismissed: boolean
  createdAt: string
  readAt: string | null
  dismissedAt: string | null
}

interface AlertStats {
  critical: number
  high: number
  medium: number
  low: number
  unread: number
}

const severityConfig = {
  CRITICAL: { label: "Crítica", color: "bg-red-600 text-white", borderColor: "border-red-200" },
  HIGH: { label: "Alta", color: "bg-orange-600 text-white", borderColor: "border-orange-200" },
  MEDIUM: { label: "Media", color: "bg-amber-600 text-white", borderColor: "border-amber-200" },
  LOW: { label: "Baja", color: "bg-blue-600 text-white", borderColor: "border-blue-200" },
}

const typeConfig = {
  COURSE_EXPIRING: { label: "Curso Por Vencer", icon: Clock },
  COURSE_EXPIRED: { label: "Curso Vencido", icon: AlertCircle },
  RECERTIFICATION_REQUIRED: { label: "Recertificación Requerida", icon: AlertCircle },
  CUSTOM: { label: "Personalizada", icon: Info },
}

export function ClientAlerts() {
  const [alerts, setAlerts] = useState<ProgressAlert[]>([])
  const [stats, setStats] = useState<AlertStats>({ critical: 0, high: 0, medium: 0, low: 0, unread: 0 })
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [severityFilter, setSeverityFilter] = useState<string>("all")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [showDismissed, setShowDismissed] = useState(false)
  const [processing, setProcessing] = useState(false)

  const loadAlerts = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/progress/alerts")
      if (response.ok) {
        const data = await response.json()
        setAlerts(data.alerts || [])
        calculateStats(data.alerts || [])
      }
    } catch (error) {
      console.error("Error loading alerts:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadAlerts()
  }, [loadAlerts])

  const calculateStats = (alertList: ProgressAlert[]) => {
    const activeAlerts = alertList.filter(a => !a.isDismissed)
    const stats: AlertStats = {
      critical: activeAlerts.filter(a => a.severity === "CRITICAL").length,
      high: activeAlerts.filter(a => a.severity === "HIGH").length,
      medium: activeAlerts.filter(a => a.severity === "MEDIUM").length,
      low: activeAlerts.filter(a => a.severity === "LOW").length,
      unread: activeAlerts.filter(a => !a.isRead).length,
    }
    setStats(stats)
  }

  const filteredAlerts = alerts.filter(alert => {
    if (!showDismissed && alert.isDismissed) return false

    const matchesSearch = 
      alert.collaborator.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alert.collaborator.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alert.collaborator.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alert.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (alert.course && (
        alert.course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        alert.course.code.toLowerCase().includes(searchTerm.toLowerCase())
      ))
    
    const matchesSeverity = severityFilter === "all" || alert.severity === severityFilter
    const matchesType = typeFilter === "all" || alert.type === typeFilter

    return matchesSearch && matchesSeverity && matchesType
  })

  const markAsRead = async (alertId: string) => {
    try {
      const response = await fetch(`/api/progress/alerts/${alertId}/read`, {
        method: "PUT",
      })

      if (response.ok) {
        setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, isRead: true, readAt: new Date().toISOString() } : a))
        calculateStats(alerts)
      }
    } catch (error) {
      console.error("Error marking alert as read:", error)
    }
  }

  const dismissAlert = async (alertId: string) => {
    try {
      setProcessing(true)
      const response = await fetch(`/api/progress/alerts/${alertId}/dismiss`, {
        method: "PUT",
      })

      if (response.ok) {
        toast.success("Alerta descartada")
        setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, isDismissed: true, dismissedAt: new Date().toISOString() } : a))
        calculateStats(alerts)
      } else {
        toast.error("No se pudo descartar la alerta")
      }
    } catch (error) {
      console.error("Error dismissing alert:", error)
      toast.error("Ocurrió un error al descartar la alerta")
    } finally {
      setProcessing(false)
    }
  }

  const generateAlerts = async () => {
    try {
      setProcessing(true)
      toast.info("Generando alertas automáticas...")
      const response = await fetch("/api/progress/alerts/generate", {
        method: "POST",
      })

      if (response.ok) {
        const data = await response.json()
        toast.success(`Se generaron ${data.generated} alertas`)
        loadAlerts()
      } else {
        toast.error("No se pudieron generar las alertas")
      }
    } catch (error) {
      console.error("Error generating alerts:", error)
      toast.error("Ocurrió un error al generar alertas")
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Alertas</h1>
        <p className="text-muted-foreground mt-2">
          Monitorea alertas de cumplimiento, vencimiento y recertificación
        </p>
      </div>
      <div className="flex gap-2">
        <Button onClick={loadAlerts} variant="outline" disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Actualizar
        </Button>
        <Button onClick={generateAlerts} disabled={processing}>
          <AlertCircle className="h-4 w-4 mr-2" />
          Generar Alertas
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card className="border-red-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Críticas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-red-600">{stats.critical}</div>
            <p className="text-xs text-muted-foreground mt-1">Urgente</p>
          </CardContent>
        </Card>

        <Card className="border-orange-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Altas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-orange-600">{stats.high}</div>
            <p className="text-xs text-muted-foreground mt-1">Importante</p>
          </CardContent>
        </Card>

        <Card className="border-amber-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Medias</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-amber-600">{stats.medium}</div>
            <p className="text-xs text-muted-foreground mt-1">Advertencia</p>
          </CardContent>
        </Card>

        <Card className="border-blue-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Bajas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-blue-600">{stats.low}</div>
            <p className="text-xs text-muted-foreground mt-1">Informativa</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">No Leídas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{stats.unread}</div>
            <p className="text-xs text-muted-foreground mt-1">Pendientes</p>
          </CardContent>
        </Card>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>Generación Automática de Alertas</AlertTitle>
        <AlertDescription>
          El sistema puede generar alertas automáticas para: cursos próximos a vencer (30 días), cursos vencidos, y recertificaciones requeridas (60 días). 
          Haz clic en &ldquo;Generar Alertas&rdquo; para crear alertas basadas en el estado actual del sistema.
        </AlertDescription>
      </Alert>

      {/* Alerts Table */}
      <Card>
        <CardHeader>
          <CardTitle>Centro de Alertas</CardTitle>
          <CardDescription>
            Todas las alertas de cumplimiento y vencimiento del sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 mb-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por colaborador, curso o mensaje..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              <Select value={severityFilter} onValueChange={setSeverityFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Severidad" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="CRITICAL">Crítica</SelectItem>
                  <SelectItem value="HIGH">Alta</SelectItem>
                  <SelectItem value="MEDIUM">Media</SelectItem>
                  <SelectItem value="LOW">Baja</SelectItem>
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los tipos</SelectItem>
                  <SelectItem value="COURSE_EXPIRING">Por Vencer</SelectItem>
                  <SelectItem value="COURSE_EXPIRED">Vencido</SelectItem>
                  <SelectItem value="RECERTIFICATION_REQUIRED">Recertificación</SelectItem>
                  <SelectItem value="CUSTOM">Personalizada</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDismissed(!showDismissed)}
              >
                {showDismissed ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
                {showDismissed ? "Ocultar Descartadas" : "Mostrar Descartadas"}
              </Button>
            </div>
          </div>

          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Estado</TableHead>
                  <TableHead>Colaborador</TableHead>
                  <TableHead>Curso</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Severidad</TableHead>
                  <TableHead>Mensaje</TableHead>
                  <TableHead>Fecha Creación</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">Cargando alertas...</p>
                    </TableCell>
                  </TableRow>
                ) : filteredAlerts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-500" />
                      <p className="text-sm text-muted-foreground">
                        {searchTerm || severityFilter !== "all" || typeFilter !== "all"
                          ? "No se encontraron alertas con los filtros aplicados"
                          : "No hay alertas activas. ¡Todo está en orden!"}
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAlerts.map((alert) => {
                    const severityConf = severityConfig[alert.severity]
                    const typeConf = typeConfig[alert.type]
                    const TypeIcon = typeConf.icon

                    return (
                      <TableRow 
                        key={alert.id} 
                        className={!alert.isRead ? "bg-blue-50/50" : alert.isDismissed ? "opacity-60" : ""}
                      >
                        <TableCell>
                          {alert.isDismissed ? (
                            <Badge variant="outline" className="bg-gray-100">
                              Descartada
                            </Badge>
                          ) : !alert.isRead ? (
                            <Badge className="bg-blue-500">
                              Nueva
                            </Badge>
                          ) : (
                            <Badge variant="outline">
                              Leída
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {alert.collaborator.firstName} {alert.collaborator.lastName}
                            </div>
                            <div className="text-xs text-muted-foreground">{alert.collaborator.email}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {alert.course ? (
                            <div>
                              <div className="font-medium">{alert.course.name}</div>
                              <div className="text-xs text-muted-foreground">{alert.course.code}</div>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <TypeIcon className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{typeConf.label}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={severityConf.color}>
                            {severityConf.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-md">
                          <p className="text-sm line-clamp-2">{alert.message}</p>
                        </TableCell>
                        <TableCell>
                          {format(new Date(alert.createdAt), "dd/MM/yyyy HH:mm", { locale: es })}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            {!alert.isRead && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => markAsRead(alert.id)}
                                disabled={processing}
                                title="Marcar como leído"
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                            )}
                            {!alert.isDismissed && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => dismissAlert(alert.id)}
                                disabled={processing}
                                title="Descartar"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
