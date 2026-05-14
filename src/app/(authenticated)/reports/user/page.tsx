"use client"

import React from "react"
import { AlertCircle, Award, BarChart3, Bell, Calendar, CheckCircle2, Filter, RefreshCw, Search, UserRound } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

const ALL_VALUE = "all"

interface OptionItem {
  id: string
  name: string
}

interface UserReportKPIs {
  totalEnrollments: number
  completedCourses: number
  inProgressCourses: number
  pendingCourses: number
  expiredCourses: number
  averageProgress: number
  averageScore: number
  passRate: number
  reportedHours: number
  openAlerts: number
  validCertificates: number
  lastActivityAt: string | null
}

interface UserReportRecord {
  collaboratorId: string
  dni: string
  fullName: string
  email: string
  status: string
  entryDate: string
  site: string | null
  area: string | null
  position: string | null
  kpis: UserReportKPIs
}

interface UserReportSummary {
  totalUsers: number
  usersOnPage: number
  totalEnrollments: number
  completedCourses: number
  expiredCourses: number
  averageProgress: number
  averageScore: number
  openAlerts: number
}

interface UserReportData {
  records: UserReportRecord[]
  total: number
  page: number
  pageSize: number
  summary: UserReportSummary
}

interface UserCourseDetail {
  enrollmentId: string
  courseId: string
  courseCode: string | null
  courseName: string
  courseDuration: number | null
  enrollmentStatus: string
  enrolledAt: string
  progressStatus: string
  effectiveStatus: string
  progressPercent: number
  startedAt: string | null
  completedAt: string | null
  passedAt: string | null
  expiresAt: string | null
  daysUntilExpiration: number | null
  attended: boolean
  reportedHours: number
  bestScore: number | null
  attemptsCount: number
  latestAttemptStatus: string | null
  lastActivityAt: string | null
}

interface UserAttemptDetail {
  attemptId: string
  courseId: string
  courseName: string
  quizId: string
  quizTitle: string
  attemptNumber: number
  status: string
  score: number | null
  pointsEarned: number | null
  pointsTotal: number | null
  timeSpent: number | null
  startedAt: string
  submittedAt: string | null
}

interface UserCertificationDetail {
  id: string
  courseId: string
  courseName: string
  certificateNumber: string
  issuedAt: string
  expiresAt: string | null
  isValid: boolean
}

interface UserAlertDetail {
  id: string
  courseId: string
  courseName: string
  type: string
  severity: number
  title: string
  dueDate: string | null
  triggeredAt: string
}

interface UserReportDetail {
  collaborator: UserReportRecord
  courses: UserCourseDetail[]
  attempts: UserAttemptDetail[]
  certifications: UserCertificationDetail[]
  alerts: UserAlertDetail[]
}

interface FilterState {
  q: string
  areaId: string
  siteId: string
  positionId: string
  courseId: string
  status: string
  startDate: string
  endDate: string
  page: number
  pageSize: number
}

const initialFilters: FilterState = {
  q: "",
  areaId: ALL_VALUE,
  siteId: ALL_VALUE,
  positionId: ALL_VALUE,
  courseId: ALL_VALUE,
  status: ALL_VALUE,
  startDate: "",
  endDate: "",
  page: 1,
  pageSize: 20,
}

const statusLabels: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  NOT_STARTED: { label: "No iniciado", variant: "outline" },
  IN_PROGRESS: { label: "En progreso", variant: "secondary" },
  PENDING_EVALUATION: { label: "Pendiente eval.", variant: "secondary" },
  PASSED: { label: "Aprobado", variant: "default" },
  FAILED: { label: "Reprobado", variant: "destructive" },
  EXPIRED: { label: "Vencido", variant: "destructive" },
  EXEMPTED: { label: "Exonerado", variant: "default" },
}

function getStatusBadge(status: string) {
  const config = statusLabels[status] ?? { label: status, variant: "outline" as const }
  return <Badge variant={config.variant}>{config.label}</Badge>
}

function formatDate(value: string | null) {
  if (!value) return "-"
  return new Intl.DateTimeFormat("es-PE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value))
}

function formatNumber(value: number, decimals = 1) {
  return new Intl.NumberFormat("es-PE", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value)
}

function appendReportParams(params: URLSearchParams, filters: FilterState, includePagination: boolean) {
  if (filters.q.trim()) params.set("q", filters.q.trim())
  if (filters.areaId !== ALL_VALUE) params.set("areaId", filters.areaId)
  if (filters.siteId !== ALL_VALUE) params.set("siteId", filters.siteId)
  if (filters.positionId !== ALL_VALUE) params.set("positionId", filters.positionId)
  if (filters.courseId !== ALL_VALUE) params.set("courseId", filters.courseId)
  if (filters.status !== ALL_VALUE) params.set("status", filters.status)
  if (filters.startDate) params.set("startDate", filters.startDate)
  if (filters.endDate) params.set("endDate", filters.endDate)
  if (includePagination) {
    params.set("page", String(filters.page))
    params.set("pageSize", String(filters.pageSize))
  }
}

function isOptionItem(value: unknown): value is OptionItem {
  return (
    typeof value === "object" &&
    value !== null &&
    "id" in value &&
    "name" in value &&
    typeof (value as { id: unknown }).id === "string" &&
    typeof (value as { name: unknown }).name === "string"
  )
}

function toOptions(data: unknown): OptionItem[] {
  if (!Array.isArray(data)) return []
  return data.filter(isOptionItem).map((item) => ({ id: item.id, name: item.name }))
}

export default function UserReportPage() {
  const [filters, setFilters] = React.useState<FilterState>(initialFilters)
  const [appliedFilters, setAppliedFilters] = React.useState<FilterState>(initialFilters)
  const [report, setReport] = React.useState<UserReportData | null>(null)
  const [selectedId, setSelectedId] = React.useState<string | null>(null)
  const [detail, setDetail] = React.useState<UserReportDetail | null>(null)
  const [areas, setAreas] = React.useState<OptionItem[]>([])
  const [sites, setSites] = React.useState<OptionItem[]>([])
  const [positions, setPositions] = React.useState<OptionItem[]>([])
  const [courses, setCourses] = React.useState<OptionItem[]>([])
  const [loading, setLoading] = React.useState(true)
  const [detailLoading, setDetailLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const loadReport = React.useCallback(async (activeFilters: FilterState) => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      appendReportParams(params, activeFilters, true)
      const response = await fetch(`/api/reports/user?${params}`)
      if (!response.ok) throw new Error("Error al cargar el reporte por usuario")
      const data = (await response.json()) as UserReportData
      setReport(data)
      setSelectedId((current) => {
        if (current && data.records.some((record) => record.collaboratorId === current)) {
          return current
        }
        return data.records[0]?.collaboratorId ?? null
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido")
      setReport(null)
    } finally {
      setLoading(false)
    }
  }, [])

  const loadDetail = React.useCallback(async (collaboratorId: string, activeFilters: FilterState) => {
    setDetailLoading(true)
    try {
      const params = new URLSearchParams()
      appendReportParams(params, activeFilters, false)
      const response = await fetch(`/api/reports/user/${collaboratorId}?${params}`)
      if (!response.ok) throw new Error("Error al cargar el detalle del usuario")
      const data = (await response.json()) as UserReportDetail
      setDetail(data)
    } catch (err) {
      console.error("Error loading user report detail:", err)
      setDetail(null)
    } finally {
      setDetailLoading(false)
    }
  }, [])

  React.useEffect(() => {
    const loadFilterOptions = async () => {
      try {
        const [areasRes, sitesRes, positionsRes, coursesRes] = await Promise.all([
          fetch("/api/areas"),
          fetch("/api/sites"),
          fetch("/api/positions"),
          fetch("/api/courses?status=PUBLISHED"),
        ])

        if (areasRes.ok) setAreas(toOptions(await areasRes.json()))
        if (sitesRes.ok) setSites(toOptions(await sitesRes.json()))
        if (positionsRes.ok) setPositions(toOptions(await positionsRes.json()))
        if (coursesRes.ok) setCourses(toOptions(await coursesRes.json()))
      } catch (err) {
        console.error("Error loading user report filters:", err)
      }
    }

    void loadFilterOptions()
  }, [])

  React.useEffect(() => {
    void loadReport(appliedFilters)
  }, [appliedFilters, loadReport])

  React.useEffect(() => {
    if (!selectedId) {
      setDetail(null)
      return
    }
    void loadDetail(selectedId, appliedFilters)
  }, [selectedId, appliedFilters, loadDetail])

  const applyFilters = () => {
    const nextFilters = { ...filters, page: 1 }
    setFilters(nextFilters)
    setAppliedFilters(nextFilters)
  }

  const resetFilters = () => {
    setFilters(initialFilters)
    setAppliedFilters(initialFilters)
  }

  const changePage = (page: number) => {
    const nextFilters = { ...appliedFilters, page }
    setFilters(nextFilters)
    setAppliedFilters(nextFilters)
  }

  const changePageSize = (pageSizeText: string) => {
    const nextFilters = { ...appliedFilters, page: 1, pageSize: Number(pageSizeText) }
    setFilters(nextFilters)
    setAppliedFilters(nextFilters)
  }

  const totalPages = report ? Math.max(1, Math.ceil(report.total / report.pageSize)) : 1
  const summary = report?.summary

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reporte por Usuario</h1>
          <p className="text-muted-foreground mt-1">
            KPIs de avance, evaluaciones, vencimientos y alertas por colaborador
          </p>
        </div>
        <Button variant="outline" onClick={() => loadReport(appliedFilters)} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Actualizar
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>Segmenta colaboradores por datos organizacionales y estado de curso</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <div className="xl:col-span-2">
              <label className="text-sm font-medium mb-2 block">Buscar</label>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  value={filters.q}
                  onChange={(event) => setFilters((current) => ({ ...current, q: event.target.value }))}
                  placeholder="DNI, nombre o email"
                  className="pl-9"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Área</label>
              <Select value={filters.areaId} onValueChange={(value) => setFilters((current) => ({ ...current, areaId: value }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_VALUE}>Todas las áreas</SelectItem>
                  {areas.map((area) => <SelectItem key={area.id} value={area.id}>{area.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Sede</label>
              <Select value={filters.siteId} onValueChange={(value) => setFilters((current) => ({ ...current, siteId: value }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_VALUE}>Todas las sedes</SelectItem>
                  {sites.map((site) => <SelectItem key={site.id} value={site.id}>{site.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Puesto</label>
              <Select value={filters.positionId} onValueChange={(value) => setFilters((current) => ({ ...current, positionId: value }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_VALUE}>Todos los puestos</SelectItem>
                  {positions.map((position) => <SelectItem key={position.id} value={position.id}>{position.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Curso</label>
              <Select value={filters.courseId} onValueChange={(value) => setFilters((current) => ({ ...current, courseId: value }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_VALUE}>Todos los cursos</SelectItem>
                  {courses.map((course) => <SelectItem key={course.id} value={course.id}>{course.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Estado</label>
              <Select value={filters.status} onValueChange={(value) => setFilters((current) => ({ ...current, status: value }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_VALUE}>Todos los estados</SelectItem>
                  {Object.entries(statusLabels).map(([value, config]) => (
                    <SelectItem key={value} value={value}>{config.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Desde</label>
              <Input
                type="date"
                value={filters.startDate}
                onChange={(event) => setFilters((current) => ({ ...current, startDate: event.target.value }))}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Hasta</label>
              <Input
                type="date"
                value={filters.endDate}
                onChange={(event) => setFilters((current) => ({ ...current, endDate: event.target.value }))}
              />
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <Button onClick={applyFilters}>
              <Filter className="h-4 w-4 mr-2" />
              Aplicar filtros
            </Button>
            <Button variant="outline" onClick={resetFilters}>
              Limpiar
            </Button>
          </div>
        </CardContent>
      </Card>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {loading && !summary ? (
          Array.from({ length: 5 }).map((_, index) => (
            <Card key={index}>
              <CardHeader className="pb-2"><Skeleton className="h-4 w-24" /></CardHeader>
              <CardContent><Skeleton className="h-8 w-20" /></CardContent>
            </Card>
          ))
        ) : (
          <>
            <MetricCard icon={UserRound} label="Usuarios" value={String(summary?.totalUsers ?? 0)} hint={`${summary?.usersOnPage ?? 0} visibles`} />
            <MetricCard icon={BarChart3} label="Inscripciones" value={String(summary?.totalEnrollments ?? 0)} hint="en la página actual" />
            <MetricCard icon={CheckCircle2} label="Completados" value={String(summary?.completedCourses ?? 0)} hint={`${summary?.expiredCourses ?? 0} vencidos`} />
            <MetricCard icon={Award} label="Avance prom." value={`${formatNumber(summary?.averageProgress ?? 0)}%`} hint={`${formatNumber(summary?.averageScore ?? 0, 2)} pts prom.`} />
            <MetricCard icon={Bell} label="Alertas" value={String(summary?.openAlerts ?? 0)} hint="abiertas" />
          </>
        )}
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(420px,0.9fr)]">
        <Card>
          <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle>Usuarios</CardTitle>
              <CardDescription>{report?.total ?? 0} colaboradores encontrados</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Select value={String(appliedFilters.pageSize)} onValueChange={changePageSize}>
                <SelectTrigger className="w-[110px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10 filas</SelectItem>
                  <SelectItem value="20">20 filas</SelectItem>
                  <SelectItem value="50">50 filas</SelectItem>
                  <SelectItem value="100">100 filas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>DNI</TableHead>
                    <TableHead>Usuario</TableHead>
                    <TableHead>Área</TableHead>
                    <TableHead className="text-right">Inscr.</TableHead>
                    <TableHead className="text-right">Comp.</TableHead>
                    <TableHead className="text-right">Venc.</TableHead>
                    <TableHead className="min-w-[140px]">Avance</TableHead>
                    <TableHead className="text-right">Nota</TableHead>
                    <TableHead className="text-right">Alertas</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    Array.from({ length: 6 }).map((_, index) => (
                      <TableRow key={index}>
                        <TableCell colSpan={9}><Skeleton className="h-6 w-full" /></TableCell>
                      </TableRow>
                    ))
                  ) : report?.records.length ? (
                    report.records.map((record) => (
                      <TableRow
                        key={record.collaboratorId}
                        className={`cursor-pointer ${selectedId === record.collaboratorId ? "bg-muted/70" : ""}`}
                        onClick={() => setSelectedId(record.collaboratorId)}
                      >
                        <TableCell className="font-mono text-xs">{record.dni}</TableCell>
                        <TableCell>
                          <div className="font-medium">{record.fullName}</div>
                          <div className="text-xs text-muted-foreground">{record.email}</div>
                        </TableCell>
                        <TableCell>
                          <div>{record.area || "-"}</div>
                          <div className="text-xs text-muted-foreground">{record.position || "-"}</div>
                        </TableCell>
                        <TableCell className="text-right">{record.kpis.totalEnrollments}</TableCell>
                        <TableCell className="text-right">{record.kpis.completedCourses}</TableCell>
                        <TableCell className="text-right">{record.kpis.expiredCourses}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress value={record.kpis.averageProgress} className="h-2" />
                            <span className="w-12 text-right text-xs tabular-nums">{formatNumber(record.kpis.averageProgress)}%</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right tabular-nums">{formatNumber(record.kpis.averageScore, 2)}</TableCell>
                        <TableCell className="text-right">{record.kpis.openAlerts}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={9} className="h-24 text-center text-muted-foreground">
                        Sin resultados
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground">
                Página {appliedFilters.page} de {totalPages}
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={appliedFilters.page <= 1 || loading} onClick={() => changePage(appliedFilters.page - 1)}>
                  Anterior
                </Button>
                <Button variant="outline" size="sm" disabled={appliedFilters.page >= totalPages || loading} onClick={() => changePage(appliedFilters.page + 1)}>
                  Siguiente
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Detalle</CardTitle>
            <CardDescription>{detail?.collaborator.fullName ?? "Selecciona un usuario"}</CardDescription>
          </CardHeader>
          <CardContent>
            {detailLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-60 w-full" />
              </div>
            ) : detail ? (
              <UserDetail detail={detail} />
            ) : (
              <div className="flex h-48 flex-col items-center justify-center text-center text-muted-foreground">
                <AlertCircle className="mb-2 h-8 w-8" />
                <p>No hay detalle cargado</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function MetricCard({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: React.ElementType
  label: string
  value: string
  hint: string
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{label}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold tabular-nums">{value}</div>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </CardContent>
    </Card>
  )
}

function UserDetail({ detail }: { detail: UserReportDetail }) {
  const { collaborator } = detail

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">{collaborator.fullName}</h2>
            <p className="text-sm text-muted-foreground">{collaborator.email}</p>
          </div>
          <Badge variant="outline">{collaborator.dni}</Badge>
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
          <span className="text-muted-foreground">Área</span><span>{collaborator.area || "-"}</span>
          <span className="text-muted-foreground">Puesto</span><span>{collaborator.position || "-"}</span>
          <span className="text-muted-foreground">Sede</span><span>{collaborator.site || "-"}</span>
          <span className="text-muted-foreground">Ingreso</span><span>{formatDate(collaborator.entryDate)}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <MiniMetric label="Inscripciones" value={String(collaborator.kpis.totalEnrollments)} />
        <MiniMetric label="Completados" value={String(collaborator.kpis.completedCourses)} />
        <MiniMetric label="Avance" value={`${formatNumber(collaborator.kpis.averageProgress)}%`} />
        <MiniMetric label="Horas" value={formatNumber(collaborator.kpis.reportedHours, 2)} />
        <MiniMetric label="Nota" value={`${formatNumber(collaborator.kpis.averageScore, 2)} pts`} />
        <MiniMetric label="Aprobación" value={`${formatNumber(collaborator.kpis.passRate)}%`} />
      </div>

      <Tabs defaultValue="courses">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="courses">Cursos</TabsTrigger>
          <TabsTrigger value="attempts">Intentos</TabsTrigger>
          <TabsTrigger value="certs">Cert.</TabsTrigger>
          <TabsTrigger value="alerts">Alertas</TabsTrigger>
        </TabsList>
        <TabsContent value="courses" className="mt-3">
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Curso</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Avance</TableHead>
                  <TableHead className="text-right">Horas</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {detail.courses.length ? detail.courses.map((course) => (
                  <TableRow key={course.enrollmentId}>
                    <TableCell>
                      <div className="font-medium">{course.courseName}</div>
                      <div className="text-xs text-muted-foreground">
                        {course.courseCode || "Sin código"} · {formatDate(course.enrolledAt)}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(course.effectiveStatus)}</TableCell>
                    <TableCell className="text-right">{formatNumber(course.progressPercent)}%</TableCell>
                    <TableCell className="text-right">{formatNumber(course.reportedHours, 2)}</TableCell>
                  </TableRow>
                )) : (
                  <TableRow><TableCell colSpan={4} className="h-20 text-center text-muted-foreground">Sin cursos</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
        <TabsContent value="attempts" className="mt-3">
          <CompactList
            items={detail.attempts.map((attempt) => ({
              id: attempt.attemptId,
              title: attempt.quizTitle,
              meta: `${attempt.courseName} · intento ${attempt.attemptNumber}`,
              right: attempt.pointsEarned !== null ? `${attempt.pointsEarned} pts` : "-",
            }))}
            empty="Sin intentos"
          />
        </TabsContent>
        <TabsContent value="certs" className="mt-3">
          <CompactList
            items={detail.certifications.map((certification) => ({
              id: certification.id,
              title: certification.certificateNumber,
              meta: `${certification.courseName} · emitido ${formatDate(certification.issuedAt)}`,
              right: certification.isValid ? "Vigente" : "No vigente",
            }))}
            empty="Sin certificaciones"
          />
        </TabsContent>
        <TabsContent value="alerts" className="mt-3">
          <CompactList
            items={detail.alerts.map((alert) => ({
              id: alert.id,
              title: alert.title,
              meta: `${alert.courseName} · ${formatDate(alert.triggeredAt)}`,
              right: `S${alert.severity}`,
            }))}
            empty="Sin alertas abiertas"
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-lg font-semibold tabular-nums">{value}</div>
    </div>
  )
}

function CompactList({
  items,
  empty,
}: {
  items: Array<{ id: string; title: string; meta: string; right: string }>
  empty: string
}) {
  if (items.length === 0) {
    return <div className="rounded-md border py-8 text-center text-sm text-muted-foreground">{empty}</div>
  }

  return (
    <div className="rounded-md border divide-y">
      {items.slice(0, 12).map((item) => (
        <div key={item.id} className="flex items-start justify-between gap-3 p-3">
          <div className="min-w-0">
            <div className="truncate text-sm font-medium">{item.title}</div>
            <div className="truncate text-xs text-muted-foreground">{item.meta}</div>
          </div>
          <Badge variant="outline" className="shrink-0">{item.right}</Badge>
        </div>
      ))}
    </div>
  )
}
