"use client"

import * as React from "react"
import { ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Copy, ExternalLink, FileArchive, FileText, FolderSearch, Layers3 } from "lucide-react"
import { toast } from "sonner"
import { DataTable } from "@/components/common/data-table"
import { FileDetailDialog } from "@/components/admin/files/file-detail-dialog"
import { FileUsageBadge } from "@/components/admin/files/file-usage-badge"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { FileInventoryItem, FileInventoryListResponse, FileUsageState } from "@/lib/file-inventory"

type FileTypeFilter = "ALL" | "PDF" | "PPT" | "IMAGE" | "VIDEO" | "DOCUMENT" | "OTHER"
type UsageFilter = "ALL" | FileUsageState

type InitialData = FileInventoryListResponse & {
  filters: {
    fileType: FileTypeFilter
    usageState: UsageFilter
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

function StatCard({ title, value, helper, icon: Icon }: { title: string; value: number; helper: string; icon: React.ElementType }) {
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
  const [tag, setTag] = React.useState(initial.filters.tag)

  const load = React.useCallback(async ({ nextPage = page, nextQ = q, nextFileType = fileType, nextUsageState = usageState, nextTag = tag }: {
    nextPage?: number
    nextQ?: string
    nextFileType?: FileTypeFilter
    nextUsageState?: UsageFilter
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
  }, [fileType, page, pageSize, q, tag, usageState])

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
      accessorKey: "usageState",
      header: "Estado",
      cell: ({ row }) => <FileUsageBadge usageState={row.original.usageState} />, 
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
          <FileDetailDialog fileId={row.original.id} fileName={row.original.name} />
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
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total de archivos" value={stats.totalFiles} helper="Inventario visible con filtros actuales" icon={FileArchive} />
        <StatCard title="Uso directo" value={stats.inUseFiles} helper="Referencias confirmadas en el sistema" icon={Layers3} />
        <StatCard title="Sin uso detectado" value={stats.unusedFiles} helper="Candidatos a revisión manual" icon={FolderSearch} />
        <StatCard title="Heurísticos" value={stats.heuristicOnlyFiles} helper="Coincidencias indirectas embebidas" icon={FileText} />
      </div>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-slate-900">Inventario y trazabilidad</CardTitle>
          <p className="text-sm text-slate-600">
            Explora los archivos subidos al blob, identifica dónde se usan y revisa relaciones con cursos sin tocar la base de datos.
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
