"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Pencil, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { TemplateEditorDialog } from "./template-editor-dialog"

type NotificationTemplate = {
  id: string
  type: string
  name: string
  description: string | null
  subject: string
  bodyHtml: string
  bodyText: string
  isActive: boolean
  defaultChannel: string
  priority: string
  availableVars: string[]
}

export default function NotificationTemplatesPage() {
  const [templates, setTemplates] = React.useState<NotificationTemplate[]>([])
  const [loading, setLoading] = React.useState(true)
  const [editingTemplate, setEditingTemplate] = React.useState<NotificationTemplate | null>(null)
  const [isDialogOpen, setIsDialogOpen] = React.useState(false)

  const loadTemplates = React.useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/notification-templates")
      if (!res.ok) throw new Error("Error loading templates")
      const data = await res.json()
      setTemplates(data)
    } catch (error) {
      console.error("Error loading templates:", error)
      toast.error("Error al cargar plantillas")
    } finally {
      setLoading(false)
    }
  }, [])

  const deleteTemplate = async (id: string) => {
    if (!confirm("¿Está seguro de eliminar esta plantilla?")) return

    try {
      await fetch(`/api/notification-templates/${id}`, { method: "DELETE" })
      await loadTemplates()
      toast.success("Plantilla eliminada")
    } catch (error) {
      console.error("Error deleting template:", error)
      toast.error("Error al eliminar plantilla")
    }
  }

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      NEW_ENROLLMENT: "Nueva Asignación",
      REMINDER_30_DAYS: "Recordatorio 30 días",
      REMINDER_7_DAYS: "Recordatorio 7 días",
      REMINDER_1_DAY: "Recordatorio 1 día",
      COURSE_FAILED: "Curso Desaprobado",
      CERTIFICATE_READY: "Certificado Disponible",
      RECERTIFICATION_DUE: "Recertificación Próxima",
      TEAM_SUMMARY: "Resumen de Equipo",
    }
    return labels[type] || type
  }

  React.useEffect(() => {
    loadTemplates()
  }, [loadTemplates])

  return (
    <div className="container mx-auto py-8 max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Plantillas de Notificaciones</h1>
          <p className="text-muted-foreground">
            Gestiona las plantillas de email y notificaciones internas
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingTemplate(null)
            setIsDialogOpen(true)
          }}
        >
          <Plus className="size-4 mr-2" />
          Nueva Plantilla
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">
          Cargando plantillas...
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {templates.map((template) => (
            <Card key={template.id} className={!template.isActive ? "opacity-60" : ""}>
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <CardTitle className="text-lg">{template.name}</CardTitle>
                      {template.isActive ? (
                        <Badge variant="default">Activa</Badge>
                      ) : (
                        <Badge variant="secondary">Inactiva</Badge>
                      )}
                    </div>
                    <Badge variant="outline" className="mb-2">
                      {getTypeLabel(template.type)}
                    </Badge>
                    {template.description && (
                      <CardDescription className="mt-2">
                        {template.description}
                      </CardDescription>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setEditingTemplate(template)
                        setIsDialogOpen(true)
                      }}
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteTemplate(template.id)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium">Asunto:</span>{" "}
                    <span className="text-muted-foreground">{template.subject}</span>
                  </div>
                  <div>
                    <span className="font-medium">Canal:</span>{" "}
                    <Badge variant="outline" className="text-xs">
                      {template.defaultChannel}
                    </Badge>
                  </div>
                  <div>
                    <span className="font-medium">Prioridad:</span>{" "}
                    <Badge variant="outline" className="text-xs">
                      {template.priority}
                    </Badge>
                  </div>
                  {template.availableVars.length > 0 && (
                    <div>
                      <span className="font-medium">Variables:</span>{" "}
                      <div className="flex flex-wrap gap-1 mt-1">
                        {template.availableVars.map((v) => (
                          <Badge key={v} variant="secondary" className="text-xs font-mono">
                            {"{{"}{v}{"}}"}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <TemplateEditorDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        template={editingTemplate}
        onSaved={() => {
          loadTemplates()
          setIsDialogOpen(false)
        }}
      />
    </div>
  )
}
