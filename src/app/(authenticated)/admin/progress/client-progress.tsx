"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CheckCircle, Clock, AlertCircle, Search, Download, RefreshCw, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { normalizeProgressStatus } from "@/lib/progress-status"

interface CourseProgress {
  id: string
  collaborator: {
    id: string
    firstName: string
    lastName: string
    email: string
    dni: string
  }
  course: {
    id: string
    name: string
    code: string | null
  }
  status:
    | "NOT_STARTED"
    | "IN_PROGRESS"
    | "COMPLETED"
    | "FAILED"
    | "EXEMPT"
    | "EXPIRED"
  progress: number
  startedAt: string | null
  completedAt: string | null
  exemptReason: string | null
  certified: boolean
}

interface ProgressStats {
  total: number
  inProgress: number
  completed: number
  notStarted: number
  failed: number
  exempt: number
  expired: number
}

const statusConfig = {
  NOT_STARTED: { label: "No Iniciado", color: "bg-slate-500", icon: Clock },
  IN_PROGRESS: { label: "En Progreso", color: "bg-blue-500", icon: Clock },
  COMPLETED: { label: "Completado", color: "bg-emerald-500", icon: CheckCircle },
  FAILED: { label: "Fallido", color: "bg-red-500", icon: AlertCircle },
  EXEMPT: { label: "Exento", color: "bg-purple-500", icon: CheckCircle },
  EXPIRED: { label: "Vencido", color: "bg-amber-600", icon: AlertCircle },
}

type StatusKey = keyof typeof statusConfig

const PAGE_SIZE_OPTIONS = [10, 20, 50]

export function ClientProgress() {
  const [progressList, setProgressList] = useState<CourseProgress[]>([])
  const [stats, setStats] = useState<ProgressStats>({
    total: 0,
    inProgress: 0,
    completed: 0,
    notStarted: 0,
    failed: 0,
    exempt: 0,
    expired: 0,
  })
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [total, setTotal] = useState(0)

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const fromItem = total === 0 ? 0 : (page - 1) * pageSize + 1
  const toItem = Math.min(page * pageSize, total)

  const loadProgress = useCallback(async (
    currentPage: number,
    currentPageSize: number,
    currentSearch: string,
    currentStatus: string,
  ) => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      params.set("page", String(currentPage))
      params.set("pageSize", String(currentPageSize))
      if (currentSearch) params.set("search", currentSearch)
      if (currentStatus && currentStatus !== "all") params.set("status", currentStatus)

      const response = await fetch(`/api/progress/courses?${params}`)
      if (response.ok) {
        const data = await response.json()
        setProgressList(data.progress || [])
        setTotal(data.total || 0)
        if (data.stats) setStats(data.stats)
      }
    } catch (error) {
      console.error("Error loading progress:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  // Carga inicial y cuando cambia página / pageSize / statusFilter
  useEffect(() => {
    loadProgress(page, pageSize, searchTerm, statusFilter)
  }, [page, pageSize, statusFilter])

  // Debounce para búsqueda de texto
  const handleSearchChange = (value: string) => {
    setSearchTerm(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setPage(1)
      loadProgress(1, pageSize, value, statusFilter)
    }, 300)
  }

  const handleStatusChange = (value: string) => {
    setStatusFilter(value)
    setPage(1)
  }

  const handleRefresh = () => {
    loadProgress(page, pageSize, searchTerm, statusFilter)
  }

  const exportToExcel = async () => {
    try {
      const params = new URLSearchParams()
      if (searchTerm) params.set("search", searchTerm)
      if (statusFilter && statusFilter !== "all") params.set("status", statusFilter)

      const response = await fetch(`/api/progress/courses/export?${params}`)
      if (!response.ok) {
        console.error("Error al exportar:", await response.text())
        return
      }
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `Tracking_Avance_${format(new Date(), "yyyy-MM-dd")}.xlsx`
      link.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Error exporting Excel:", error)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Tracking de Avance</h1>
        <p className="text-muted-foreground mt-2">
          Monitorea el progreso de los colaboradores en sus cursos asignados
        </p>
      </div>

      {/* Botones de acción */}
      <div className="flex gap-2">
        <Button onClick={handleRefresh} variant="outline" disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Actualizar
        </Button>
        <Button onClick={exportToExcel} variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Exportar Excel
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-7">
        <Card className="border-slate-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{stats.total}</div>
            <p className="text-xs text-muted-foreground mt-1">Inscripciones</p>
          </CardContent>
        </Card>

        <Card className="border-blue-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">En Progreso</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-blue-600">{stats.inProgress}</div>
            <p className="text-xs text-muted-foreground mt-1">Activos</p>
          </CardContent>
        </Card>

        <Card className="border-emerald-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Completados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-emerald-600">{stats.completed}</div>
            <p className="text-xs text-muted-foreground mt-1">Finalizados</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">No Iniciados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-slate-600">{stats.notStarted}</div>
            <p className="text-xs text-muted-foreground mt-1">Pendientes</p>
          </CardContent>
        </Card>

        <Card className="border-red-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Fallidos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-red-600">{stats.failed}</div>
            <p className="text-xs text-muted-foreground mt-1">Reprobados</p>
          </CardContent>
        </Card>

        <Card className="border-purple-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Exentos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-purple-600">{stats.exempt}</div>
            <p className="text-xs text-muted-foreground mt-1">Dispensados</p>
          </CardContent>
        </Card>

        <Card className="border-amber-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Vencidos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-amber-700">{stats.expired}</div>
            <p className="text-xs text-muted-foreground mt-1">Requieren renovacion</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Progreso de Colaboradores</CardTitle>
          <CardDescription>
            Vista completa del progreso en todos los cursos asignados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por colaborador, DNI, email o curso..."
                  value={searchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={handleStatusChange}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Filtrar por estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="NOT_STARTED">No Iniciado</SelectItem>
                <SelectItem value="IN_PROGRESS">En Progreso</SelectItem>
                <SelectItem value="PASSED">Completado</SelectItem>
                <SelectItem value="FAILED">Fallido</SelectItem>
                <SelectItem value="EXEMPTED">Exento</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Colaborador</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Curso</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Progreso</TableHead>
                  <TableHead>Fecha Inicio</TableHead>
                  <TableHead>Fecha Completado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">Cargando progreso...</p>
                    </TableCell>
                  </TableRow>
                ) : progressList.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <p className="text-sm text-muted-foreground">
                        {searchTerm || statusFilter !== "all"
                          ? "No se encontraron resultados con los filtros aplicados"
                          : "No hay registros de progreso todavía"}
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  progressList.map((progress) => {
                    const key = normalizeProgressStatus(progress.status) as StatusKey
                    const config = statusConfig[key] ?? statusConfig.NOT_STARTED
                    const Icon = config.icon

                    return (
                      <TableRow key={progress.id}>
                        <TableCell className="font-medium">
                          <div>{progress.collaborator.firstName} {progress.collaborator.lastName}</div>
                          <div className="text-xs text-muted-foreground">{progress.collaborator.dni}</div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {progress.collaborator.email}
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{progress.course.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {progress.course.code || "Sin código"}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={`${config.color} text-white`}>
                            <Icon className="h-3 w-3 mr-1" />
                            {config.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <div className="w-24 bg-slate-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full transition-all ${config.color}`}
                                style={{ width: `${progress.progress}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium w-12 text-right">{progress.progress}%</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {progress.startedAt
                            ? format(new Date(progress.startedAt), "dd/MM/yyyy", { locale: es })
                            : "—"}
                        </TableCell>
                        <TableCell>
                          {progress.completedAt
                            ? format(new Date(progress.completedAt), "dd/MM/yyyy", { locale: es })
                            : "—"}
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination controls */}
          {!loading && total > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4 pt-4 border-t">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Mostrando {fromItem}–{toItem} de {total} registros</span>
                <Select
                  value={String(pageSize)}
                  onValueChange={(v) => {
                    setPageSize(Number(v))
                    setPage(1)
                  }}
                >
                  <SelectTrigger className="h-8 w-[80px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAGE_SIZE_OPTIONS.map(n => (
                      <SelectItem key={n} value={String(n)}>{n} / pág</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setPage(1)}
                  disabled={page === 1}
                  title="Primera página"
                >
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  title="Página anterior"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                {/* Page number pills */}
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                    .reduce<(number | "...")[]>((acc, p, idx, arr) => {
                      if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push("...")
                      acc.push(p)
                      return acc
                    }, [])
                    .map((p, idx) =>
                      p === "..." ? (
                        <span key={`ellipsis-${idx}`} className="px-1 text-muted-foreground text-sm">…</span>
                      ) : (
                        <Button
                          key={p}
                          variant={page === p ? "default" : "outline"}
                          size="icon"
                          className="h-8 w-8 text-xs"
                          onClick={() => setPage(p as number)}
                        >
                          {p}
                        </Button>
                      )
                    )}
                </div>

                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  title="Página siguiente"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setPage(totalPages)}
                  disabled={page === totalPages}
                  title="Última página"
                >
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
