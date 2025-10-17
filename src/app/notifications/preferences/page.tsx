"use client"

import * as React from "react"
import { Bell, Mail, Smartphone, Save, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"

type NotificationType = 
  | "NEW_ENROLLMENT"
  | "REMINDER_30_DAYS"
  | "REMINDER_7_DAYS"
  | "REMINDER_1_DAY"
  | "COURSE_FAILED"
  | "CERTIFICATE_READY"
  | "RECERTIFICATION_DUE"
  | "TEAM_SUMMARY"

type NotificationPreference = {
  id: string
  userId: string
  type: NotificationType
  enableEmail: boolean
  enableInApp: boolean
  createdAt: string
  updatedAt: string
}

const notificationTypeLabels: Record<NotificationType, { label: string; description: string }> = {
  NEW_ENROLLMENT: {
    label: "Nueva Asignación de Curso",
    description: "Notificación cuando se te asigna un nuevo curso",
  },
  REMINDER_30_DAYS: {
    label: "Recordatorio 30 Días",
    description: "Recordatorio cuando faltan 30 días para el vencimiento del curso",
  },
  REMINDER_7_DAYS: {
    label: "Recordatorio 7 Días",
    description: "Recordatorio cuando faltan 7 días para el vencimiento del curso",
  },
  REMINDER_1_DAY: {
    label: "Recordatorio 1 Día",
    description: "Recordatorio cuando falta 1 día para el vencimiento del curso",
  },
  COURSE_FAILED: {
    label: "Evaluación Desaprobada",
    description: "Notificación cuando desapruebas una evaluación",
  },
  CERTIFICATE_READY: {
    label: "Certificado Disponible",
    description: "Notificación cuando tienes un nuevo certificado disponible",
  },
  RECERTIFICATION_DUE: {
    label: "Recertificación Próxima",
    description: "Recordatorio cuando se aproxima una recertificación",
  },
  TEAM_SUMMARY: {
    label: "Resumen de Equipo",
    description: "Resumen semanal para jefes de área (si aplica)",
  },
}

export default function NotificationPreferencesPage() {
  const [preferences, setPreferences] = React.useState<Map<NotificationType, NotificationPreference>>(new Map())
  const [loading, setLoading] = React.useState(true)
  const [saving, setSaving] = React.useState(false)
  const [hasChanges, setHasChanges] = React.useState(false)

  const loadPreferences = React.useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/notification-preferences")
      if (!res.ok) throw new Error("Error loading preferences")
      const data = await res.json()
      
      const prefsMap = new Map<NotificationType, NotificationPreference>()
      data.forEach((pref: NotificationPreference) => {
        prefsMap.set(pref.type, pref)
      })
      setPreferences(prefsMap)
    } catch (error) {
      console.error("Error loading preferences:", error)
      toast.error("Error al cargar preferencias")
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    loadPreferences()
  }, [loadPreferences])

  const updatePreference = (type: NotificationType, channel: "email" | "inApp", value: boolean) => {
    setPreferences((prev) => {
      const newMap = new Map(prev)
      const existing = newMap.get(type)
      
      if (existing) {
        newMap.set(type, {
          ...existing,
          enableEmail: channel === "email" ? value : existing.enableEmail,
          enableInApp: channel === "inApp" ? value : existing.enableInApp,
        })
      } else {
        // Create new preference with defaults
        newMap.set(type, {
          id: "",
          userId: "",
          type,
          enableEmail: channel === "email" ? value : true,
          enableInApp: channel === "inApp" ? value : true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
      }
      
      return newMap
    })
    setHasChanges(true)
  }

  const savePreferences = async () => {
    setSaving(true)
    try {
      // Save each preference
      const promises = Array.from(preferences.entries()).map(([type, pref]) =>
        fetch("/api/notification-preferences", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type,
            enableEmail: pref.enableEmail,
            enableInApp: pref.enableInApp,
          }),
        })
      )

      await Promise.all(promises)
      await loadPreferences()
      setHasChanges(false)
      toast.success("Preferencias guardadas correctamente")
    } catch (error) {
      console.error("Error saving preferences:", error)
      toast.error("Error al guardar preferencias")
    } finally {
      setSaving(false)
    }
  }

  const getPreference = (type: NotificationType) => {
    return preferences.get(type) || {
      id: "",
      userId: "",
      type,
      enableEmail: true,
      enableInApp: true,
      createdAt: "",
      updatedAt: "",
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8 max-w-4xl">
        <div className="text-center py-12 text-muted-foreground">
          <Loader2 className="size-8 mx-auto mb-4 animate-spin" />
          <p>Cargando preferencias...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Preferencias de Notificaciones</h1>
          <p className="text-muted-foreground mt-1">
            Configura cómo y cuándo deseas recibir notificaciones
          </p>
        </div>
        {hasChanges && (
          <Button onClick={savePreferences} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="size-4 mr-2 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="size-4 mr-2" />
                Guardar Cambios
              </>
            )}
          </Button>
        )}
      </div>

      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="size-5 text-primary" />
            <CardTitle>Canales de Notificación</CardTitle>
          </div>
          <CardDescription>
            Elige cómo deseas recibir cada tipo de notificación. Puedes activar o desactivar
            notificaciones por correo electrónico o en la bandeja interna de la aplicación.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="flex items-center gap-3 p-4 border rounded-lg">
              <Mail className="size-8 text-blue-500" />
              <div>
                <p className="font-medium">Correo Electrónico</p>
                <p className="text-xs text-muted-foreground">Envío a tu email</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 border rounded-lg">
              <Smartphone className="size-8 text-green-500" />
              <div>
                <p className="font-medium">Bandeja Interna</p>
                <p className="text-xs text-muted-foreground">En la aplicación</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 border rounded-lg bg-muted/50">
              <Bell className="size-8 text-orange-500" />
              <div>
                <p className="font-medium">Configurable</p>
                <p className="text-xs text-muted-foreground">Tú decides</p>
              </div>
            </div>
          </div>

          <Separator className="my-6" />

          <div className="space-y-6">
            {/* Asignaciones y Recordatorios */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Cursos y Recordatorios</h3>
              <div className="space-y-4">
                {(["NEW_ENROLLMENT", "REMINDER_30_DAYS", "REMINDER_7_DAYS", "REMINDER_1_DAY"] as NotificationType[]).map((type) => {
                  const pref = getPreference(type)
                  const { label, description } = notificationTypeLabels[type]
                  
                  return (
                    <Card key={type}>
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <Label className="text-base font-medium">{label}</Label>
                            <p className="text-sm text-muted-foreground mt-1">{description}</p>
                          </div>
                          <div className="flex items-center gap-6">
                            <div className="flex items-center gap-2">
                              <Mail className="size-4 text-muted-foreground" />
                              <Switch
                                checked={pref.enableEmail}
                                onCheckedChange={(checked) => updatePreference(type, "email", checked)}
                                aria-label={`Email para ${label}`}
                              />
                            </div>
                            <div className="flex items-center gap-2">
                              <Smartphone className="size-4 text-muted-foreground" />
                              <Switch
                                checked={pref.enableInApp}
                                onCheckedChange={(checked) => updatePreference(type, "inApp", checked)}
                                aria-label={`Bandeja interna para ${label}`}
                              />
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>

            {/* Evaluaciones y Certificados */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Evaluaciones y Certificados</h3>
              <div className="space-y-4">
                {(["COURSE_FAILED", "CERTIFICATE_READY", "RECERTIFICATION_DUE"] as NotificationType[]).map((type) => {
                  const pref = getPreference(type)
                  const { label, description } = notificationTypeLabels[type]
                  
                  return (
                    <Card key={type}>
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <Label className="text-base font-medium">{label}</Label>
                            <p className="text-sm text-muted-foreground mt-1">{description}</p>
                          </div>
                          <div className="flex items-center gap-6">
                            <div className="flex items-center gap-2">
                              <Mail className="size-4 text-muted-foreground" />
                              <Switch
                                checked={pref.enableEmail}
                                onCheckedChange={(checked) => updatePreference(type, "email", checked)}
                                aria-label={`Email para ${label}`}
                              />
                            </div>
                            <div className="flex items-center gap-2">
                              <Smartphone className="size-4 text-muted-foreground" />
                              <Switch
                                checked={pref.enableInApp}
                                onCheckedChange={(checked) => updatePreference(type, "inApp", checked)}
                                aria-label={`Bandeja interna para ${label}`}
                              />
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>

            {/* Gestión (para jefes) */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Gestión de Equipo</h3>
              <div className="space-y-4">
                {(["TEAM_SUMMARY"] as NotificationType[]).map((type) => {
                  const pref = getPreference(type)
                  const { label, description } = notificationTypeLabels[type]
                  
                  return (
                    <Card key={type}>
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <Label className="text-base font-medium">{label}</Label>
                            <p className="text-sm text-muted-foreground mt-1">{description}</p>
                          </div>
                          <div className="flex items-center gap-6">
                            <div className="flex items-center gap-2">
                              <Mail className="size-4 text-muted-foreground" />
                              <Switch
                                checked={pref.enableEmail}
                                onCheckedChange={(checked) => updatePreference(type, "email", checked)}
                                aria-label={`Email para ${label}`}
                              />
                            </div>
                            <div className="flex items-center gap-2">
                              <Smartphone className="size-4 text-muted-foreground" />
                              <Switch
                                checked={pref.enableInApp}
                                onCheckedChange={(checked) => updatePreference(type, "inApp", checked)}
                                aria-label={`Bandeja interna para ${label}`}
                              />
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Bell className="size-5 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                Importante
              </p>
              <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                Algunas notificaciones críticas (como recordatorios de 1 día) se enviarán aunque
                desactives los canales, para asegurar que no pierdas información importante.
                Las preferencias solo aplican a notificaciones opcionales.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
