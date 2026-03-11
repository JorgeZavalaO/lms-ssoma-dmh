"use client"

import * as React from "react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Copy, ExternalLink, Eye, Loader2, Link2, ShieldCheck, TriangleAlert } from "lucide-react"
import { toast } from "sonner"
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
import type { FileInventoryDetail } from "@/lib/file-inventory"
import { FileReviewBadge } from "@/components/admin/files/file-review-badge"
import { FileUsageBadge } from "@/components/admin/files/file-usage-badge"

function formatBytes(bytes: number) {
  if (bytes === 0) return "0 B"
  const units = ["B", "KB", "MB", "GB"]
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  const value = bytes / Math.pow(1024, index)
  return `${value.toFixed(value >= 10 || index === 0 ? 0 : 1)} ${units[index]}`
}

export function FileDetailDialog({ fileId, fileName }: { fileId: string; fileName: string }) {
  const [open, setOpen] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const [detail, setDetail] = React.useState<FileInventoryDetail | null>(null)

  const loadDetail = React.useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/admin/files/${fileId}`, { cache: "no-store" })
      if (!response.ok) throw new Error("No se pudo cargar el detalle del archivo")
      const json = await response.json()
      setDetail(json)
    } catch (error) {
      console.error(error)
      toast.error("No se pudo cargar el detalle del archivo")
    } finally {
      setLoading(false)
    }
  }, [fileId])

  React.useEffect(() => {
    if (open && !detail && !loading) {
      void loadDetail()
    }
  }, [detail, loadDetail, loading, open])

  const handleCopy = async (text: string, message: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success(message)
    } catch (error) {
      console.error(error)
      toast.error("No se pudo copiar al portapapeles")
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Eye className="h-4 w-4" />
          Detalle
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5 text-emerald-600" />
            {fileName}
          </DialogTitle>
          <DialogDescription>
            Trazabilidad del archivo, ubicaciones detectadas y nivel de confianza de cada referencia.
          </DialogDescription>
        </DialogHeader>

        {loading || !detail ? (
          <div className="flex min-h-[320px] items-center justify-center text-muted-foreground">
            <span className="inline-flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" /> Cargando detalle…
            </span>
          </div>
        ) : (
          <div className="space-y-6 overflow-y-auto pr-2">
            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-lg border bg-slate-50/70 p-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Estado</div>
                <div className="mt-3"><FileUsageBadge usageState={detail.item.usageState} /></div>
              </div>
              <div className="rounded-lg border bg-slate-50/70 p-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Tamaño</div>
                <div className="mt-3 text-sm font-semibold text-slate-900">{formatBytes(detail.item.size)}</div>
              </div>
              <div className="rounded-lg border bg-slate-50/70 p-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Subido</div>
                <div className="mt-3 text-sm font-semibold text-slate-900">
                  {format(new Date(detail.item.uploadedAt), "dd/MM/yyyy HH:mm", { locale: es })}
                </div>
              </div>
              <div className="rounded-lg border bg-slate-50/70 p-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Versionado</div>
                <div className="mt-3 text-sm font-semibold text-slate-900">v{detail.item.version}</div>
              </div>
            </section>

            <section className="grid gap-4 lg:grid-cols-[1.35fr_0.95fr]">
              <div className="rounded-lg border p-4 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">Archivo</h3>
                    <p className="text-sm text-slate-600">Información base del recurso cargado al blob.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="gap-2" onClick={() => handleCopy(detail.item.blobUrl, "URL copiada")}> 
                      <Copy className="h-4 w-4" /> Copiar URL
                    </Button>
                    <a href={detail.item.blobUrl} target="_blank" rel="noreferrer">
                      <Button variant="outline" size="sm" className="gap-2">
                        <ExternalLink className="h-4 w-4" /> Abrir
                      </Button>
                    </a>
                  </div>
                </div>

                <div className="space-y-3 text-sm">
                  <div>
                    <div className="font-medium text-slate-900">Nombre</div>
                    <div className="text-slate-600">{detail.item.name}</div>
                  </div>
                  <div>
                    <div className="font-medium text-slate-900">Descripción</div>
                    <div className="text-slate-600">{detail.item.description || "Sin descripción"}</div>
                  </div>
                  <div>
                    <div className="font-medium text-slate-900">URL Blob</div>
                    <div className="break-all text-slate-600">{detail.item.blobUrl}</div>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div>
                      <div className="font-medium text-slate-900">Tipo</div>
                      <div className="text-slate-600">{detail.item.fileType}</div>
                    </div>
                    <div>
                      <div className="font-medium text-slate-900">MIME</div>
                      <div className="text-slate-600 break-all">{detail.item.mimeType}</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border p-4 space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">Contexto de uso</h3>
                  <p className="text-sm text-slate-600">Resumen rápido para auditoría operativa.</p>
                </div>

                <div className="rounded-lg border bg-emerald-50/50 p-3">
                  <div className="flex items-center gap-2 text-sm font-medium text-emerald-800">
                    <ShieldCheck className="h-4 w-4" /> Nivel de confianza
                  </div>
                  <p className="mt-2 text-sm text-emerald-900">{detail.item.confidenceSummary}</p>
                </div>

                <div className="rounded-lg border bg-slate-50/70 p-3 text-sm">
                  <div className="font-medium text-slate-900">Ubicación principal</div>
                  <p className="mt-1 text-slate-600">{detail.item.primaryLocation}</p>
                </div>

                <div className="rounded-lg border bg-slate-50/70 p-3 text-sm">
                  <div className="font-medium text-slate-900">Cursos relacionados</div>
                  {detail.relatedCourses.length > 0 ? (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {detail.relatedCourses.map((course) => (
                        <Badge key={course.id} variant="outline" className="bg-white text-slate-700 border-slate-200">
                          {course.code ? `${course.code} · ` : ""}{course.name}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-1 text-slate-600">Sin curso asociado detectado.</p>
                  )}
                </div>

                <div className="rounded-lg border bg-slate-50/70 p-3 text-sm">
                  <div className="font-medium text-slate-900">Revisión sugerida</div>
                  <div className="mt-2"><FileReviewBadge priority={detail.item.reviewPriority} /></div>
                  <p className="mt-2 text-slate-600">{detail.item.reviewRecommendation}</p>
                  <p className="mt-2 text-xs text-slate-500">{detail.item.daysSinceUpload} días desde la carga.</p>
                </div>

                <div className="rounded-lg border bg-amber-50/50 p-3">
                  <div className="flex items-center gap-2 text-sm font-medium text-amber-800">
                    <TriangleAlert className="h-4 w-4" /> Nota operativa
                  </div>
                  <p className="mt-2 text-sm text-amber-900">
                    Las referencias heurísticas indican coincidencias por contenido embebido y deben revisarse antes de tomar decisiones de limpieza.
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-lg border p-4 space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Dónde se usa</h3>
                <p className="text-sm text-slate-600">Referencias directas e indirectas detectadas en el sistema.</p>
              </div>

              {detail.usages.length === 0 ? (
                <div className="rounded-lg border border-dashed p-8 text-center text-sm text-slate-600">
                  No se encontraron referencias activas para este archivo.
                </div>
              ) : (
                <div className="space-y-3">
                  {detail.usages.map((usage, index) => (
                    <div key={`${usage.source}-${usage.lessonId ?? usage.activityId ?? usage.certificationId ?? index}`} className="rounded-lg border bg-slate-50/50 p-4">
                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="outline" className={usage.confidence === "DIRECT" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-amber-200 bg-amber-50 text-amber-700"}>
                              {usage.confidence === "DIRECT" ? "Directo" : "Heurístico"}
                            </Badge>
                            <Badge variant="secondary">{usage.source}</Badge>
                          </div>
                          <div className="font-medium text-slate-900">{usage.title}</div>
                          <p className="text-sm text-slate-600">{usage.description}</p>
                        </div>
                        <div className="min-w-[200px] text-sm text-slate-600">
                          <div><span className="font-medium text-slate-900">Campo:</span> {usage.matchedField}</div>
                          {usage.courseName && <div><span className="font-medium text-slate-900">Curso:</span> {usage.courseName}</div>}
                          {usage.unitTitle && <div><span className="font-medium text-slate-900">Unidad:</span> {usage.unitTitle}</div>}
                          {usage.lessonTitle && <div><span className="font-medium text-slate-900">Lección:</span> {usage.lessonTitle}</div>}
                          {usage.collaboratorName && <div><span className="font-medium text-slate-900">Colaborador:</span> {usage.collaboratorName}</div>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
