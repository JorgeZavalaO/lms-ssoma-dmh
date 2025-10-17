"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { X } from "lucide-react"

const formSchema = z.object({
  type: z.enum([
    "NEW_ENROLLMENT",
    "REMINDER_30_DAYS",
    "REMINDER_7_DAYS",
    "REMINDER_1_DAY",
    "COURSE_FAILED",
    "CERTIFICATE_READY",
    "RECERTIFICATION_DUE",
    "TEAM_SUMMARY",
  ]),
  name: z.string().min(1, "El nombre es requerido"),
  description: z.string().optional(),
  subject: z.string().min(1, "El asunto es requerido"),
  bodyHtml: z.string().min(1, "El cuerpo HTML es requerido"),
  bodyText: z.string().min(1, "El cuerpo en texto es requerido"),
  isActive: z.boolean(),
  defaultChannel: z.enum(["EMAIL", "IN_APP", "BOTH"]),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]),
})

type FormData = z.infer<typeof formSchema>

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

interface TemplateEditorDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  template: NotificationTemplate | null
  onSaved: () => void
}

const commonVariables = [
  "collaboratorName",
  "courseName",
  "courseCode",
  "dueDate",
  "daysRemaining",
  "score",
  "certificateNumber",
]

export function TemplateEditorDialog({
  open,
  onOpenChange,
  template,
  onSaved,
}: TemplateEditorDialogProps) {
  const [loading, setLoading] = React.useState(false)
  const [selectedVars, setSelectedVars] = React.useState<string[]>([])

  const form = useForm<FormData>({
    defaultValues: {
      type: "NEW_ENROLLMENT",
      name: "",
      description: "",
      subject: "",
      bodyHtml: "",
      bodyText: "",
      isActive: true,
      defaultChannel: "BOTH",
      priority: "MEDIUM",
    },
  })

  const validateForm = (data: FormData): boolean => {
    const result = formSchema.safeParse(data)
    if (!result.success) {
      result.error.issues.forEach((issue) => {
        const fieldName = issue.path[0] as keyof FormData
        form.setError(fieldName, { message: issue.message })
      })
      return false
    }
    return true
  }

  React.useEffect(() => {
    if (template) {
      form.reset({
        type: template.type as FormData["type"],
        name: template.name,
        description: template.description || "",
        subject: template.subject,
        bodyHtml: template.bodyHtml,
        bodyText: template.bodyText,
        isActive: template.isActive,
        defaultChannel: template.defaultChannel as FormData["defaultChannel"],
        priority: template.priority as FormData["priority"],
      })
      setSelectedVars(template.availableVars)
    } else {
      form.reset()
      setSelectedVars([])
    }
  }, [template, form])

  const onSubmit = async (data: FormData) => {
    // Validar manualmente
    if (!validateForm(data)) {
      return
    }

    setLoading(true)
    try {
      const payload = {
        ...data,
        availableVars: selectedVars,
      }

      const url = template
        ? `/api/notification-templates/${template.id}`
        : "/api/notification-templates"

      const method = template ? "PUT" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!res.ok) throw new Error("Error saving template")

      toast.success(template ? "Plantilla actualizada" : "Plantilla creada")
      onSaved()
    } catch (error) {
      console.error("Error saving template:", error)
      toast.error("Error al guardar plantilla")
    } finally {
      setLoading(false)
    }
  }

  const insertVariable = (variable: string) => {
    if (!selectedVars.includes(variable)) {
      setSelectedVars([...selectedVars, variable])
    }

    // Insertar en el campo activo
    const activeElement = document.activeElement as HTMLTextAreaElement | HTMLInputElement
    if (activeElement && (activeElement.name === "subject" || activeElement.name === "bodyHtml" || activeElement.name === "bodyText")) {
      const start = activeElement.selectionStart || 0
      const end = activeElement.selectionEnd || 0
      const text = activeElement.value
      const before = text.substring(0, start)
      const after = text.substring(end)
      const newText = before + `{{${variable}}}` + after

      form.setValue(activeElement.name as keyof FormData, newText as never)
      setTimeout(() => {
        activeElement.focus()
        activeElement.setSelectionRange(start + variable.length + 4, start + variable.length + 4)
      }, 0)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {template ? "Editar Plantilla" : "Nueva Plantilla"}
          </DialogTitle>
          <DialogDescription>
            Configura la plantilla de notificación. Usa variables entre llaves dobles: {"{{variable}}"}.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Notificación</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="NEW_ENROLLMENT">Nueva Asignación</SelectItem>
                      <SelectItem value="REMINDER_30_DAYS">Recordatorio 30 días</SelectItem>
                      <SelectItem value="REMINDER_7_DAYS">Recordatorio 7 días</SelectItem>
                      <SelectItem value="REMINDER_1_DAY">Recordatorio 1 día</SelectItem>
                      <SelectItem value="COURSE_FAILED">Curso Desaprobado</SelectItem>
                      <SelectItem value="CERTIFICATE_READY">Certificado Disponible</SelectItem>
                      <SelectItem value="RECERTIFICATION_DUE">Recertificación Próxima</SelectItem>
                      <SelectItem value="TEAM_SUMMARY">Resumen de Equipo</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Ej: Plantilla recordatorio 7 días" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="defaultChannel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Canal por Defecto</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="EMAIL">Email</SelectItem>
                        <SelectItem value="IN_APP">Bandeja Interna</SelectItem>
                        <SelectItem value="BOTH">Ambos</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prioridad</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="LOW">Baja</SelectItem>
                        <SelectItem value="MEDIUM">Media</SelectItem>
                        <SelectItem value="HIGH">Alta</SelectItem>
                        <SelectItem value="URGENT">Urgente</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel>Activa</FormLabel>
                      <FormDescription className="text-xs">
                        Plantilla habilitada para uso
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción (Opcional)</FormLabel>
                  <FormControl>
                    <Textarea {...field} rows={2} placeholder="Descripción de la plantilla" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="border rounded-lg p-3 bg-muted/30">
              <p className="text-sm font-medium mb-2">Variables Disponibles</p>
              <div className="flex flex-wrap gap-1">
                {commonVariables.map((v) => (
                  <Badge
                    key={v}
                    variant="secondary"
                    className="cursor-pointer hover:bg-secondary/80"
                    onClick={() => insertVariable(v)}
                  >
                    {"{{"}{v}{"}}"}
                  </Badge>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Haz clic para insertar en el campo activo
              </p>
            </div>

            {selectedVars.length > 0 && (
              <div className="border rounded-lg p-3">
                <p className="text-sm font-medium mb-2">Variables Usadas</p>
                <div className="flex flex-wrap gap-1">
                  {selectedVars.map((v) => (
                    <Badge key={v} variant="outline">
                      {"{{"}{v}{"}}"}
                      <button
                        type="button"
                        className="ml-1 hover:text-destructive"
                        onClick={() => setSelectedVars(selectedVars.filter((x) => x !== v))}
                      >
                        <X className="size-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <FormField
              control={form.control}
              name="subject"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Asunto</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Asunto del email o título de notificación" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="bodyHtml"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cuerpo HTML</FormLabel>
                  <FormControl>
                    <Textarea {...field} rows={6} placeholder="Contenido HTML del email" className="font-mono text-sm" />
                  </FormControl>
                  <FormDescription>
                    Usa HTML para formatear el email
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="bodyText"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cuerpo Texto Plano</FormLabel>
                  <FormControl>
                    <Textarea {...field} rows={6} placeholder="Versión en texto plano" />
                  </FormControl>
                  <FormDescription>
                    Versión sin formato para clientes que no soportan HTML
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Guardando..." : template ? "Actualizar" : "Crear"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
