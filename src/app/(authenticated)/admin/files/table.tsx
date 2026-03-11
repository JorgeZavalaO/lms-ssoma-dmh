"use client"

import * as React from "react"
import { ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Copy, Download, ExternalLink, FileArchive, FileSearch, FileText, FolderSearch, Layers3, ShieldAlert } from "lucide-react"
import { toast } from "sonner"
import { DataTable } from "@/components/common/data-table"
import { FileDetailDialog } from "@/components/admin/files/file-detail-dialog"
import { FileLifecycleBadge } from "@/components/admin/files/file-lifecycle-badge"
import { FileReviewBadge } from "@/components/admin/files/file-review-badge"
import { FileUsageBadge } from "@/components/admin/files/file-usage-badge"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { FileLifecycleStatus } from "@prisma/client"
import type { FileInventoryItem, FileInventoryListResponse, FileUsageState } from "@/lib/file-inventory"

type FileTypeFilter = "ALL" | "PDF" | "PPT" | "IMAGE" | "VIDEO" | "DOCUMENT" | "OTHER"
type UsageFilter = "ALL" | FileUsageState
type LifecycleFilter = "ALL" | FileLifecycleStatus

type InitialData = FileInventoryListResponse & {
  filters: {
    fileType: FileTypeFilter
    usageState: UsageFilter
    lifecycleStatus: LifecycleFilter
    tag: string
    q: string
  }
}

function formatBytes(bytes: number) {
  if (bytes === 0) return "0 B"
  const units = ["B", "KB", "MB", "GB"]
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  const value = bytes / Math.pow(1024, index)
  return `${value.toFixed(value >= 10 || index === 0 ? 0 : 1)} ${units[index]}`
}

function buildExportUrl(params: { q: string; fileType: FileTypeFilter; usageState: UsageFilter; lifecycleStatus: LifecycleFilter; tag: string; format: "csv" | "xlsx" }) {
  const searchParams = new URLSearchParams({ format: params.format })
  if (params.q.trim()) searchParams.set("q", params.q.trim())
  if (params.fileType !== "ALL") searchParams.set("fileType", params.fileType)
  if (params.usageState !== "ALL") searchParams.set("usageState", params.usageState)
  if (params.lifecycleStatus !== "ALL") searchParams.set("lifecycleStatus", params.lifecycleStatus)
  if (params.tag && params.tag !== "ALL") searchParams.set("tag", params.tag)
  return `/api/admin/files/export?${searchParams.toString()}`
}

function StatCard({ title, value, helper, icon: Icon }: { title: string; value: React.ReactNode; helper: string; icon: React.ElementType }) {
  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-medium text-slate-700">
          <Icon className="h-4 w-4 text-emerald-600" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-slate-900">{value}</div>
        <p className="mt-1 text-xs text-slate-500">{helper}</p>
      </CardContent>
    </Card>
  )
}

export default function ClientFiles({ initial }: { initial: InitialData }) {
  const [data, setData] = React.useState<FileInventoryItem[]>(initial.items)
  const [total, setTotal] = React.useState(initial.total)
  const [page, setPage] = React.useState(initial.page)
  const [pageSize] = React.useState(initial.pageSize)
  const [loading, setLoading] = React.useState(false)
  const [stats, setStats] = React.useState(initial.stats)
  const [availableTags, setAvailableTags] = React.useState(initial.availableTags)
  const [q, setQ] = React.useState(initial.filters.q)
  const [fileType, setFileType] = React.useState<FileTypeFilter>(initial.filters.fileType)
  const [usageState, setUsageState] = React.useState<UsageFilter>(initial.filters.usageState)
  const [lifecycleStatus, setLifecycleStatus] = React.useState<LifecycleFilter>(initial.filters.lifecycleStatus)
  const [tag, setTag] = React.useState(initial.filters.tag)

  const exportXlsxUrl = buildExportUrl({ q, fileType, usageState, lifecycleStatus, tag, format: "xlsx" })
  const exportCsvUrl = buildExportUrl({ q, fileType, usageState, lifecycleStatus, tag, format: "csv" })

  const load = React.useCallback(async ({ nextPage = page, nextQ = q, nextFileType = fileType, nextUsageState = usageState, nextLifecycleStatus = lifecycleStatus, nextTag = tag }: {
    nextPage?: number
    nextQ?: string
    nextFileType?: FileTypeFilter
    nextUsageState?: UsageFilter
    nextLifecycleStatus?: LifecycleFilter
    nextTag?: string
  } = {}) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: String(nextPage),
        pageSize: String(pageSize),
      })

      if (nextQ.trim()) params.set("q", nextQ.trim())
      if (nextFileType !== "ALL") params.set("fileType", nextFileType)
      if (nextUsageState !== "ALL") params.set("usageState", nextUsageState)
      if (nextLifecycleStatus !== "ALL") params.set("lifecycleStatus", nextLifecycleStatus)
      if (nextTag && nextTag !== "ALL") params.set("tag", nextTag)

      const response = await fetch(`/api/admin/files?${params.toString()}`, { cache: "no-store" })
      if (!response.ok) throw new Error("No se pudo cargar el repositorio de archivos")
      const json: FileInventoryListResponse = await response.json()
      setData(json.items)
      setTotal(json.total)
      setPage(json.page)
      setStats(json.stats)
      setAvailableTags(json.availableTags)
    } catch (error) {
      console.error(error)
      toast.error("No se pudo cargar el repositorio de archivos")
    } finally {
      setLoading(false)
    }
  }, [fileType, lifecycleStatus, page, pageSize, q, tag, usageState])

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success("URL copiada al portapapeles")
    } catch (error) {
      console.error(error)
      toast.error("No se pudo copiar la URL")
    }
  }

  const handleSearch = React.useCallback((query: string) => {
    setQ(query)
    void load({ nextPage: 1, nextQ: query })
  }, [load])

  const handleFileTypeChange = (value: FileTypeFilter) => {
    setFileType(value)
    void load({ nextPage: 1, nextFileType: value })
  }

  const handleUsageChange = (value: UsageFilter) => {
    setUsageState(value)
    void load({ nextPage: 1, nextUsageState: value })
  }

  const handleLifecycleChange = (value: LifecycleFilter) => {
    setLifecycleStatus(value)
    void load({ nextPage: 1, nextLifecycleStatus: value })
  }

  const handleTagChange = (value: string) => {
    setTag(value)
    void load({ nextPage: 1, nextTag: value })
  }

  const columns: ColumnDef<FileInventoryItem>[] = [
    {
      accessorKey: "name",
      header: "Archivo",
      cell: ({ row }) => (
        <div className="space-y-1">
          <div className="font-medium text-slate-900">{row.original.name}</div>
          <div className="text-xs text-slate-500 break-all">{row.original.blobUrl}</div>
        </div>
      ),
    },
    {
      accessorKey: "fileType",
      header: "Tipo",
      cell: ({ row }) => <Badge variant="outline">{row.original.fileType}</Badge>,
    },
    {
      accessorKey: "size",
      header: "Tamaño",
      cell: ({ row }) => <span className="text-slate-700">{formatBytes(row.original.size)}</span>,
    },
    {
      accessorKey: "lifecycleStatus",
      header: "Ciclo",
      cell: ({ row }) => <FileLifecycleBadge status={row.original.lifecycleStatus} />,
    },
    {
      accessorKey: "usageState",
      header: "Estado",
      cell: ({ row }) => <FileUsageBadge usageState={row.original.usageState} />, 
    },
    {
      accessorKey: "reviewPriority",
      header: "Revisión",
      cell: ({ row }) => (
        <div className="space-y-1">
          <FileReviewBadge priority={row.original.reviewPriority} />
          <div className="text-xs text-slate-500">{row.original.reviewRecommendation}</div>
        </div>
      ),
    },
    {
      accessorKey: "relatedCourseName",
      header: "Curso / contexto",
      cell: ({ row }) => (
        <div className="space-y-1">
          <div className="text-sm text-slate-900">{row.original.relatedCourseName || "Sin curso asociado"}</div>
          <div className="text-xs text-slate-500">{row.original.primaryLocation}</div>
        </div>
      ),
    },
    {
      accessorKey: "tags",
      header: "Etiquetas",
      cell: ({ row }) => (
        <div className="flex max-w-[220px] flex-wrap gap-1">
          {row.original.tags.length > 0 ? row.original.tags.slice(0, 3).map((tagValue) => (
            <Badge key={tagValue} variant="secondary" className="text-xs">{tagValue}</Badge>
          )) : <span className="text-xs text-slate-500">Sin etiquetas</span>}
          {row.original.tags.length > 3 ? <Badge variant="secondary" className="text-xs">+{row.original.tags.length - 3}</Badge> : null}
        </div>
      ),
    },
    {
      accessorKey: "uploadedAt",
      header: "Carga",
      cell: ({ row }) => (
        <div className="text-sm text-slate-700">
          {format(new Date(row.original.uploadedAt), "dd/MM/yyyy", { locale: es })}
        </div>
      ),
    },
    {
      header: "Acciones",
      cell: ({ row }) => (
        <div className="flex flex-wrap justify-end gap-2">
          <FileDetailDialog fileId={row.original.id} fileName={row.original.name} onChanged={() => void load()} />
          <a href={row.original.blobUrl} target="_blank" rel="noreferrer">
            <Button variant="outline" size="sm" className="gap-2">
              <ExternalLink className="h-4 w-4" /> Abrir
            </Button>
          </a>
          <Button variant="outline" size="sm" className="gap-2" onClick={() => handleCopy(row.original.blobUrl)}>
            <Copy className="h-4 w-4" /> URL
          </Button>
        </div>
      ),
    },
  ]

  const rightExtra = (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <Button variant="outline" className="gap-2" onClick={() => handleUsageChange("UNUSED")}>
        <ShieldAlert className="h-4 w-4" /> Candidatos
      </Button>

      <Select value={fileType} onValueChange={(value) => handleFileTypeChange(value as FileTypeFilter)}>
        <SelectTrigger className="w-[150px]">
          <SelectValue placeholder="Tipo" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">Todos los tipos</SelectItem>
          <SelectItem value="PDF">PDF</SelectItem>
          <SelectItem value="PPT">PPT</SelectItem>
          <SelectItem value="IMAGE">Imagen</SelectItem>
          <SelectItem value="VIDEO">Video</SelectItem>
          <SelectItem value="DOCUMENT">Documento</SelectItem>
          <SelectItem value="OTHER">Otro</SelectItem>
        </SelectContent>
      </Select>

      <Select value={usageState} onValueChange={(value) => handleUsageChange(value as UsageFilter)}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Estado de uso" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">Todos los estados</SelectItem>
          <SelectItem value="IN_USE">Uso directo</SelectItem>
          <SelectItem value="HEURISTIC_ONLY">Solo heurístico</SelectItem>
          <SelectItem value="UNUSED">Sin uso detectado</SelectItem>
        </SelectContent>
      </Select>

      <Select value={lifecycleStatus} onValueChange={(value) => handleLifecycleChange(value as LifecycleFilter)}>
        <SelectTrigger className="w-[190px]">
          <SelectValue placeholder="Ciclo de vida" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">Todos los ciclos</SelectItem>
          <SelectItem value="ACTIVE">Activos</SelectItem>
          <SelectItem value="DISABLED">Deshabilitados</SelectItem>
          <SelectItem value="DELETED">Eliminados</SelectItem>
        </SelectContent>
      </Select>

      <Select value={tag || "ALL"} onValueChange={handleTagChange}>
        <SelectTrigger className="w-[170px]">
          <SelectValue placeholder="Etiqueta" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">Todas las etiquetas</SelectItem>
          {availableTags.map((tagValue) => (
            <SelectItem key={tagValue} value={tagValue}>{tagValue}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <a href={exportXlsxUrl}>
        <Button variant="outline" className="gap-2">
          <Download className="h-4 w-4" /> XLSX
        </Button>
      </a>

      <a href={exportCsvUrl}>
        <Button variant="outline" className="gap-2">
          <Download className="h-4 w-4" /> CSV
        </Button>
      </a>
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total de archivos" value={stats.totalFiles} helper="Inventario visible con filtros actuales" icon={FileArchive} />
        <StatCard title="Activos" value={stats.activeFiles} helper="Disponibles para uso operativo" icon={Layers3} />
        <StatCard title="Deshabilitados" value={stats.disabledFiles} helper="Retirados sin borrar el blob" icon={FolderSearch} />
        <StatCard title="Eliminados" value={stats.deletedFiles} helper="Histórico auditado tras borrado físico" icon={FileText} />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <StatCard title="Candidatos de revisión" value={stats.reviewCandidates} helper="Archivos con prioridad media o alta" icon={FileSearch} />
        <StatCard title="Eliminables" value={stats.deletableFiles} helper="Deshabilitados y sin referencias detectadas" icon={ShieldAlert} />
        <StatCard title="Peso sin uso" value={formatBytes(stats.unusedBytes)} helper="Detectados sin referencias activas" icon={Layers3} />
      </div>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-slate-900">Inventario y trazabilidad</CardTitle>
          <p className="text-sm text-slate-600">
            Explora los archivos subidos al blob, identifica dónde se usan, deshabilítalos con trazabilidad y elimina físicamente solo cuando no exista riesgo detectable.
          </p>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={data}
            page={page}
            pageSize={pageSize}
            total={total}
            onPageChange={(nextPage) => void load({ nextPage })}
            onSearch={handleSearch}
            defaultSearch={q}
            rightExtra={rightExtra}
            isLoading={loading}
            emptyText="No encontramos archivos con ese criterio."
          />
        </CardContent>
      </Card>
    </div>
  )
}
