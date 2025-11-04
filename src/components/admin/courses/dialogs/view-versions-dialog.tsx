"use client"

import * as React from "react"
import { Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { CourseFormData } from "@/validations/courses"

type CourseStatus = CourseFormData["status"]
type CourseModality = CourseFormData["modality"]

interface CourseVersion {
  id: string
  version: number
  name: string
  objective?: string | null
  description?: string | null
  duration?: number | null
  validity?: number | null
  status: CourseStatus
  modality: CourseModality
  createdAt: string
}

interface CourseVersionsResponse {
  versions?: CourseVersion[]
}

const statusLabels: Record<CourseStatus, string> = {
  DRAFT: "Borrador",
  PUBLISHED: "Publicado",
  ARCHIVED: "Archivado",
}

const modalityLabels: Record<CourseModality, string> = {
  ASYNCHRONOUS: "Asíncrono",
  SYNCHRONOUS: "Síncrono",
  BLENDED: "Mixto",
}

interface ViewVersionsDialogProps {
  courseId: string
}

export function ViewVersionsDialog({ courseId }: ViewVersionsDialogProps) {
  const [open, setOpen] = React.useState(false)
  const [versions, setVersions] = React.useState<CourseVersion[]>([])
  const [loading, setLoading] = React.useState(false)

  const fetchVersions = React.useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/courses/${courseId}`)
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`)
      }

      const data = (await res.json().catch(() => ({}))) as CourseVersionsResponse
      if (Array.isArray(data.versions)) {
        setVersions(data.versions)
      } else {
        setVersions([])
      }
    } catch (error) {
      console.error("Error loading course versions", error)
      toast.error("Error al cargar versiones")
      setVersions([])
    } finally {
      setLoading(false)
    }
  }, [courseId])

  React.useEffect(() => {
    if (open) {
      void fetchVersions()
    }
  }, [open, fetchVersions])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-6 px-2">
          <Eye className="h-3 w-3" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Historial de Versiones</DialogTitle>
          <DialogDescription>
            Todas las versiones del curso con sus cambios
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="text-center py-8">Cargando versiones...</div>
        ) : versions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No hay versiones disponibles
          </div>
        ) : (
          <div className="space-y-4 max-h-[50vh] overflow-y-auto">
            {versions.map((version) => (
              <div key={version.id} className="border rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">v{version.version}</Badge>
                    <Badge variant="secondary">{statusLabels[version.status]}</Badge>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {new Date(version.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <div>
                  <div className="font-medium">{version.name}</div>
                  {version.objective && (
                    <div className="text-sm text-muted-foreground">{version.objective}</div>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Duración:</span>{" "}
                    {version.duration ? `${version.duration}h` : "-"}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Modalidad:</span>{" "}
                    {modalityLabels[version.modality]}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Vigencia:</span>{" "}
                    {version.validity ? `${version.validity}m` : "-"}
                  </div>
                </div>

                {version.description && (
                  <div className="text-sm text-muted-foreground">{version.description}</div>
                )}
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
