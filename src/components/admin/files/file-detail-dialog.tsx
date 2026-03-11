"use client"

import * as React from "react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import {
  BookOpen,
  Calendar,
  Copy,
  ExternalLink,
  Eye,
  File,
  FileImage,
  FileText,
  FileVideo,
  Link2,
  RefreshCw,
  ShieldCheck,
  TriangleAlert,
} from "lucide-react"
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
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import type { FileInventoryDetail } from "@/lib/file-inventory"
import { FileReviewBadge } from "@/components/admin/files/file-review-badge"
import { FileLifecycleActions } from "@/components/admin/files/file-lifecycle-actions"
import { FileLifecycleBadge } from "@/components/admin/files/file-lifecycle-badge"
import { FileUsageBadge } from "@/components/admin/files/file-usage-badge"
import type { FileType } from "@prisma/client"

// ─── helpers ─────────────────────────────────────────────────────────────────

function formatBytes(bytes: number) {
  if (bytes === 0) return "0 B"
  const units = ["B", "KB", "MB", "GB"]
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  const value = bytes / Math.pow(1024, index)
  return `${value.toFixed(value >= 10 || index === 0 ? 0 : 1)} ${units[index]}`
}

const FILE_TYPE_CONFIG: Record<FileType, { icon: typeof File; color: string; bg: string }> = {
  PDF:      { icon: FileText,  color: "text-rose-600",   bg: "bg-rose-50"   },
  PPT:      { icon: FileText,  color: "text-orange-600", bg: "bg-orange-50" },
  IMAGE:    { icon: FileImage, color: "text-violet-600", bg: "bg-violet-50" },
  VIDEO:    { icon: FileVideo, color: "text-blue-600",   bg: "bg-blue-50"   },
  DOCUMENT: { icon: FileText,  color: "text-slate-600",  bg: "bg-slate-100" },
  OTHER:    { icon: File,      color: "text-slate-500",  bg: "bg-slate-100" },
}

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[130px_1fr] gap-x-3 gap-y-0 py-2.5 text-sm">
      <dt className="font-medium text-slate-500 self-start pt-px">{label}</dt>
      <dd className="text-slate-800 break-all">{children}</dd>
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="animate-pulse space-y-3 pt-4">
      <div className="grid grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-14 rounded-xl bg-slate-100" />
        ))}
      </div>
      <div className="h-48 rounded-xl bg-slate-100" />
      <div className="h-64 rounded-xl bg-slate-100" />
    </div>
  )
}

// ─── component ───────────────────────────────────────────────────────────────

export function FileDetailDialog({
  fileId,
  fileName,
  onChanged,
}: {
  fileId: string
  fileName: string
  onChanged?: () => void
}) {
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
    if (open && !detail && !loading) void loadDetail()
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

  const ftCfg = detail ? FILE_TYPE_CONFIG[detail.item.fileType] : FILE_TYPE_CONFIG.OTHER
  const FileTypeIcon = ftCfg.icon

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Eye className="h-4 w-4" />
          Detalle
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-5xl! flex flex-col max-h-[88vh] gap-0 p-0 overflow-hidden">
        {/* ── header ─────────────────────────────────────────────────────── */}
        <div className="shrink-0 border-b bg-white px-6 pt-5 pb-4">
          <div className="flex items-start gap-3">
            {/* file type icon */}
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${ftCfg.bg}`}>
              <FileTypeIcon className={`h-5 w-5 ${ftCfg.color}`} />
            </div>

            {/* title */}
            <div className="min-w-0 flex-1">
              <DialogHeader className="space-y-0">
                <DialogTitle className="text-base font-semibold text-slate-900 truncate leading-snug">
                  {fileName}
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500 mt-0.5">
                  Trazabilidad, referencias y ciclo de vida del recurso.
                </DialogDescription>
              </DialogHeader>
            </div>

            {/* lifecycle badge + refresh */}
            <div className="flex shrink-0 items-center gap-2">
              {detail && <FileLifecycleBadge status={detail.item.lifecycleStatus} />}
              <TooltipProvider delayDuration={200}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-slate-400 hover:text-slate-700"
                      disabled={loading}
                      onClick={() => { setDetail(null); void loadDetail() }}
                    >
                      <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">Actualizar</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>

          {/* meta strip + actions */}
          {detail && (
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                <span className="inline-flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  {format(new Date(detail.item.uploadedAt), "dd MMM yyyy · HH:mm", { locale: es })}
                </span>
                <span className="text-slate-300">·</span>
                <span className="font-medium">{formatBytes(detail.item.size)}</span>
                <span className="text-slate-300">·</span>
                <span>v{detail.item.version}</span>
                <span className="text-slate-300">·</span>
                <FileUsageBadge usageState={detail.item.usageState} />
              </div>
              <FileLifecycleActions
                file={detail.item}
                onCompleted={() => {
                  setDetail(null)
                  void loadDetail()
                  onChanged?.()
                }}
              />
            </div>
          )}
        </div>

        {/* ── body ───────────────────────────────────────────────────────── */}
        {loading && !detail ? (
          <div className="flex-1 overflow-y-auto px-6 pb-6">
            <LoadingSkeleton />
          </div>
        ) : detail ? (
          <Tabs defaultValue="details" className="flex flex-col flex-1 min-h-0 gap-0">
            {/* tab bar */}
            <div className="shrink-0 px-6 pt-3 pb-0">
              <TabsList className="h-8">
                <TabsTrigger value="details" className="text-xs px-3 h-7">
                  Detalles
                </TabsTrigger>
                <TabsTrigger value="usages" className="text-xs px-3 h-7 gap-1.5">
                  Referencias
                  {detail.usages.length > 0 && (
                    <span className="inline-flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-slate-200 px-1 text-[10px] font-semibold text-slate-700">
                      {detail.usages.length}
                    </span>
                  )}
                </TabsTrigger>
              </TabsList>
            </div>

            {/* ── TAB: Detalles ── */}
            <TabsContent value="details" className="flex-1 min-h-0 overflow-y-auto mt-0">
              <div className="px-6 pt-4 pb-6">
                <div className="grid gap-4 lg:grid-cols-2">

                  {/* left — file info */}
                  <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50 border-b">
                      <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Información del archivo
                      </h3>
                      <div className="flex items-center gap-0.5">
                        <TooltipProvider delayDuration={200}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-slate-400 hover:text-slate-700"
                                onClick={() => handleCopy(detail.item.blobUrl, "URL copiada")}
                              >
                                <Copy className="h-3.5 w-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent side="bottom">Copiar URL del blob</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <TooltipProvider delayDuration={200}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <a href={detail.item.blobUrl} target="_blank" rel="noreferrer">
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-slate-700">
                                  <ExternalLink className="h-3.5 w-3.5" />
                                </Button>
                              </a>
                            </TooltipTrigger>
                            <TooltipContent side="bottom">Abrir en nueva pestaña</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </div>
                    <dl className="divide-y px-4">
                      <InfoRow label="Nombre">{detail.item.name}</InfoRow>
                      <InfoRow label="Descripción">
                        {detail.item.description ? (
                          detail.item.description
                        ) : (
                          <span className="italic text-slate-400">Sin descripción</span>
                        )}
                      </InfoRow>
                      <InfoRow label="Tipo">{detail.item.fileType}</InfoRow>
                      <InfoRow label="MIME">
                        <span className="font-mono text-xs text-slate-500">{detail.item.mimeType}</span>
                      </InfoRow>
                      <InfoRow label="URL Blob">
                        <span className="font-mono text-[11px] text-slate-500 leading-relaxed">
                          {detail.item.blobUrl}
                        </span>
                      </InfoRow>
                    </dl>
                  </div>

                  {/* right — audit context */}
                  <div className="space-y-3">
                    {/* confidence */}
                    <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 px-4 py-3 shadow-sm">
                      <div className="flex items-center gap-1.5 text-sm font-semibold text-emerald-800">
                        <ShieldCheck className="h-4 w-4" /> Nivel de confianza
                      </div>
                      <p className="mt-1.5 text-sm text-emerald-900">{detail.item.confidenceSummary}</p>
                    </div>

                    {/* primary location */}
                    <div className="rounded-xl border bg-white px-4 py-3 shadow-sm">
                      <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5">
                        <Link2 className="h-3.5 w-3.5" /> Ubicación principal
                      </div>
                      <p className="text-sm text-slate-700">{detail.item.primaryLocation}</p>
                    </div>

                    {/* operational state */}
                    <div className="rounded-xl border bg-white px-4 py-3 shadow-sm space-y-2">
                      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Estado operativo</div>
                      <p className="text-sm text-slate-700">{detail.item.lifecycleSummary}</p>
                      {detail.item.disableReason && (
                        <div className="rounded-lg bg-amber-50 border border-amber-100 px-3 py-2 text-xs text-amber-800">
                          <span className="font-semibold">Motivo de deshabilitado:</span> {detail.item.disableReason}
                        </div>
                      )}
                      {detail.item.deleteReason && (
                        <div className="rounded-lg bg-rose-50 border border-rose-100 px-3 py-2 text-xs text-rose-800">
                          <span className="font-semibold">Motivo de eliminación:</span> {detail.item.deleteReason}
                        </div>
                      )}
                    </div>

                    {/* related courses */}
                    <div className="rounded-xl border bg-white px-4 py-3 shadow-sm">
                      <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">
                        <BookOpen className="h-3.5 w-3.5" /> Cursos relacionados
                      </div>
                      {detail.relatedCourses.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {detail.relatedCourses.map((course) => (
                            <Badge key={course.id} variant="outline" className="bg-white text-slate-700 border-slate-200 text-xs">
                              {course.code ? `${course.code} · ` : ""}{course.name}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-slate-400 italic">Sin curso asociado detectado.</p>
                      )}
                    </div>

                    {/* review */}
                    <div className="rounded-xl border bg-white px-4 py-3 shadow-sm">
                      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">
                        Revisión sugerida
                      </div>
                      <FileReviewBadge priority={detail.item.reviewPriority} />
                      <p className="mt-2 text-sm text-slate-700">{detail.item.reviewRecommendation}</p>
                      <p className="mt-1 text-xs text-slate-400">{detail.item.daysSinceUpload} días desde la carga.</p>
                    </div>

                    {/* note */}
                    <div className="rounded-xl border border-amber-100 bg-amber-50/70 px-4 py-3 shadow-sm">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-800 mb-1.5">
                        <TriangleAlert className="h-3.5 w-3.5" /> Nota operativa
                      </div>
                      <p className="text-xs text-amber-800 leading-relaxed">
                        Las referencias heurísticas bloquean la eliminación física por diseño conservador.
                        Valida manualmente que no exista dependencia real antes de proceder.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* ── TAB: Referencias ── */}
            <TabsContent value="usages" className="flex-1 min-h-0 overflow-y-auto mt-0">
              <div className="px-6 pt-4 pb-6 space-y-3">
                {detail.usages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16 text-center gap-2">
                    <Link2 className="h-8 w-8 text-slate-300" />
                    <p className="text-sm font-medium text-slate-500">Sin referencias activas</p>
                    <p className="text-xs text-slate-400">No se detectaron usos de este archivo en el sistema.</p>
                  </div>
                ) : (
                  detail.usages.map((usage, index) => (
                    <div
                      key={`${usage.source}-${usage.lessonId ?? usage.activityId ?? usage.certificationId ?? index}`}
                      className={`rounded-xl border bg-white shadow-sm overflow-hidden border-l-[3px] ${
                        usage.confidence === "DIRECT" ? "border-l-emerald-400" : "border-l-amber-400"
                      }`}
                    >
                      <div className="flex flex-col gap-3 px-4 py-3.5 md:flex-row md:items-start md:justify-between">
                        <div className="space-y-1.5 flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <Badge
                              variant="outline"
                              className={
                                usage.confidence === "DIRECT"
                                  ? "border-emerald-200 bg-emerald-50 text-emerald-700 text-xs"
                                  : "border-amber-200 bg-amber-50 text-amber-700 text-xs"
                              }
                            >
                              {usage.confidence === "DIRECT" ? "Directo" : "Heurístico"}
                            </Badge>
                            <Badge variant="secondary" className="text-xs">{usage.source}</Badge>
                          </div>
                          <p className="font-medium text-sm text-slate-900 truncate">{usage.title}</p>
                          <p className="text-xs text-slate-500 line-clamp-2">{usage.description}</p>
                        </div>

                        <Separator orientation="vertical" className="hidden md:block self-stretch mx-1" />

                        <div className="md:min-w-[190px] md:max-w-[230px] text-xs text-slate-600 space-y-1 shrink-0">
                          <div>
                            <span className="font-semibold text-slate-700">Campo:</span>{" "}
                            <span className="font-mono text-[11px]">{usage.matchedField}</span>
                          </div>
                          {usage.courseName && (
                            <div><span className="font-semibold text-slate-700">Curso:</span> {usage.courseName}</div>
                          )}
                          {usage.unitTitle && (
                            <div><span className="font-semibold text-slate-700">Unidad:</span> {usage.unitTitle}</div>
                          )}
                          {usage.lessonTitle && (
                            <div><span className="font-semibold text-slate-700">Lección:</span> {usage.lessonTitle}</div>
                          )}
                          {usage.collaboratorName && (
                            <div><span className="font-semibold text-slate-700">Colaborador:</span> {usage.collaboratorName}</div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </TabsContent>
          </Tabs>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
