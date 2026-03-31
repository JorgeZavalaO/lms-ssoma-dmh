"use client"

import React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import {
  Download,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  RefreshCw,
  FileText,
  TrendingUp,
  Users,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ShieldCheck,
  Target
} from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"

interface ComplianceMatrixRecord {
  collaboratorId: string
  fullName: string
  position: string | null
  area: string | null
  courses: Array<{
    courseId: string
    courseName: string
    isRequired: boolean
    status: "COMPLIANT" | "EXPIRING_SOON" | "EXPIRED" | "NOT_ENROLLED"
    expiresAt: Date | null
    daysUntilExpiration: number | null
  }>
}

type OkrStatus = "cumplido" | "en riesgo" | "crítico"

function getOkrStatus(value: number, goodThreshold: number, riskThreshold: number, higherIsBetter = true): OkrStatus {
  if (higherIsBetter) {
    if (value >= goodThreshold) return "cumplido"
    if (value >= riskThreshold) return "en riesgo"
    return "crítico"
  } else {
    if (value <= goodThreshold) return "cumplido"
    if (value <= riskThreshold) return "en riesgo"
    return "crítico"
  }
}

const OKR_STYLES: Record<OkrStatus, { badge: string; bar: string }> = {
  "cumplido": { badge: "bg-emerald-100 text-emerald-700", bar: "bg-emerald-400" },
  "en riesgo": { badge: "bg-amber-100 text-amber-700", bar: "bg-amber-400" },
  "crítico": { badge: "bg-red-100 text-red-700", bar: "bg-red-400" },
}

function OkrCard({ krLabel, label, actualDisplay, target, pct, status }: {
  krLabel: string; label: string; actualDisplay: string
  target: string; pct: number; status: OkrStatus
}) {
  const s = OKR_STYLES[status]
  return (
    <div className="rounded-xl border bg-card p-4 flex flex-col gap-2.5">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{krLabel}</span>
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${s.badge}`}>{status}</span>
      </div>
      <p className="text-xs font-medium text-foreground leading-tight">{label}</p>
      <div className="flex items-end justify-between">
        <span className="text-xl font-bold tabular-nums">{actualDisplay}</span>
        <span className="text-[10px] text-muted-foreground">meta {target}</span>
      </div>
      <div className="h-1 w-full rounded-full bg-muted overflow-hidden">
        <div className={`h-1 rounded-full ${s.bar} transition-all`} style={{ width: `${Math.min(100, Math.max(0, pct))}%` }} />
      </div>
    </div>
  )
}

type CellCfg = { bg: string; icon: React.ElementType | null; iconClass: string }
const CELL_CFG: Record<string, CellCfg> = {
  COMPLIANT:    { bg: "bg-emerald-50",  icon: CheckCircle2, iconClass: "text-emerald-500" },
  EXPIRING_SOON:{ bg: "bg-amber-50",    icon: Clock,        iconClass: "text-amber-500"   },
  EXPIRED:      { bg: "bg-red-50",      icon: XCircle,      iconClass: "text-red-500"     },
  NOT_ENROLLED: { bg: "bg-slate-100",   icon: null,         iconClass: "text-slate-400"   },
}

export default function ComplianceReportPage() {
  const [matrix, setMatrix] = React.useState<ComplianceMatrixRecord[]>([])
  const [filteredMatrix, setFilteredMatrix] = React.useState<ComplianceMatrixRecord[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [exporting, setExporting] = React.useState(false)
  const [summary, setSummary] = React.useState({
    totalCollaborators: 0,
    totalCourses: 0,
    compliant: 0,
    expiringSoon: 0,
    expired: 0,
  })

  const [searchTerm, setSearchTerm] = React.useState("")
  const [areaFilter, setAreaFilter] = React.useState<string>("all")
  const [statusFilter, setStatusFilter] = React.useState<string>("all")
  const [areas, setAreas] = React.useState<string[]>([])
  const [currentPage, setCurrentPage] = React.useState(1)
  const [itemsPerPage, setItemsPerPage] = React.useState(10)

  React.useEffect(() => { loadComplianceReport() }, [])
  React.useEffect(() => { applyFilters() }, [matrix, searchTerm, areaFilter, statusFilter]) // eslint-disable-line react-hooks/exhaustive-deps

  const loadComplianceReport = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/reports/compliance")
      if (!res.ok) throw new Error("Error al cargar el reporte de cumplimiento")
      const data = await res.json()
      setMatrix(data.matrix)
      setSummary(data.summary)
      const uniqueAreas = Array.from(
        new Set(data.matrix.map((r: ComplianceMatrixRecord) => r.area).filter(Boolean))
      ) as string[]
      setAreas(uniqueAreas.sort())
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido")
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = [...matrix]
    if (searchTerm) {
      const q = searchTerm.toLowerCase()
      filtered = filtered.filter(r =>
        r.fullName.toLowerCase().includes(q) ||
        r.position?.toLowerCase().includes(q) ||
        r.area?.toLowerCase().includes(q)
      )
    }
    if (areaFilter !== "all") filtered = filtered.filter(r => r.area === areaFilter)
    if (statusFilter !== "all") {
      filtered = filtered.filter(r => {
        if (statusFilter === "COMPLIANT") return r.courses.every(c => c.status === "COMPLIANT")
        if (statusFilter === "EXPIRING_SOON") return r.courses.some(c => c.status === "EXPIRING_SOON") && r.courses.every(c => c.status !== "EXPIRED" && c.status !== "NOT_ENROLLED")
        if (statusFilter === "non-compliant") return r.courses.some(c => c.status === "EXPIRED" || c.status === "NOT_ENROLLED")
        return true
      })
    }
    setFilteredMatrix(filtered)
    setCurrentPage(1)
  }

  const handleExportExcel = async () => {
    setExporting(true)
    try {
      const params = new URLSearchParams()
      if (areaFilter !== "all") params.set("area", areaFilter)
      const res = await fetch(`/api/reports/compliance/export?${params}`)
      if (!res.ok) throw new Error("Error exportando")
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `Cumplimiento_SSOMA_${new Date().toISOString().split("T")[0]}.xlsx`
      a.click()
      URL.revokeObjectURL(url)
    } catch { /* silent */ } finally {
      setExporting(false)
    }
  }

  // ── Computed ──────────────────────────────────────────────────────────────
  const total = summary.totalCollaborators
  const complianceRate = total > 0 ? (summary.compliant / total) * 100 : 0
  const expiringRate   = total > 0 ? (summary.expiringSoon / total) * 100 : 0
  const notEnrolledCount = matrix.filter(r => r.courses.some(c => c.status === "NOT_ENROLLED")).length
  const enrollmentCoverage = total > 0 ? ((total - notEnrolledCount) / total) * 100 : 100
  const criticalCount = matrix.filter(r => r.courses.some(c => c.status === "EXPIRED" || c.status === "NOT_ENROLLED")).length

  const fullyCompliant = matrix.filter(r => r.courses.every(c => c.status === "COMPLIANT")).length
  const expiringOnly   = matrix.filter(r => r.courses.some(c => c.status === "EXPIRING_SOON") && r.courses.every(c => c.status !== "EXPIRED" && c.status !== "NOT_ENROLLED")).length
  const pieData = [
    { name: "Cumplen",    value: fullyCompliant, color: "#10b981" },
    { name: "Por vencer", value: expiringOnly,   color: "#f59e0b" },
    { name: "Críticos",   value: criticalCount,  color: "#ef4444" },
  ].filter(d => d.value > 0)

  const areaChartData = areas.map(area => {
    const rec = matrix.filter(r => r.area === area)
    const comp = rec.filter(r => r.courses.every(c => c.status === "COMPLIANT")).length
    const rate = rec.length > 0 ? Math.round((comp / rec.length) * 100) : 0
    return { area: area.length > 14 ? area.slice(0, 13) + "…" : area, fullArea: area, compliance: rate, total: rec.length, compliant: comp }
  }).sort((a, b) => b.compliance - a.compliance)

  // KR statuses
  const kr1Status = getOkrStatus(complianceRate, 80, 60)
  const kr2Status = getOkrStatus(criticalCount, 0, 3, false)
  const kr3Status = getOkrStatus(expiringRate, 10, 25, false)
  const kr4Status = getOkrStatus(enrollmentCoverage, 95, 80)

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredMatrix.length / itemsPerPage))
  const startIdx = (currentPage - 1) * itemsPerPage
  const currentData = filteredMatrix.slice(startIdx, startIdx + itemsPerPage)
  const goTo = (p: number) => setCurrentPage(Math.max(1, Math.min(p, totalPages)))

  const pageRange = React.useMemo(() => {
    const pages: number[] = []
    const delta = 1
    for (let i = Math.max(1, currentPage - delta); i <= Math.min(totalPages, currentPage + delta); i++) pages.push(i)
    return pages
  }, [currentPage, totalPages])

  // ── Loading skeleton ───────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div><Skeleton className="h-8 w-80 mb-2" /><Skeleton className="h-4 w-96" /></div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-2xl border bg-card p-5 flex flex-col gap-3">
              <div className="flex items-center justify-between"><Skeleton className="h-3 w-28" /><Skeleton className="h-8 w-8 rounded-xl" /></div>
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-1 w-full rounded-full" />
            </div>
          ))}
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl border bg-card p-4"><Skeleton className="h-16 w-full" /></div>
          ))}
        </div>
        <Skeleton className="h-[480px] w-full rounded-xl" />
      </div>
    )
  }

  // ── Error state ────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Reporte de Cumplimiento SSOMA</h1>
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between flex-wrap gap-2">
            <span>{error}</span>
            <Button variant="ghost" size="sm" onClick={loadComplianceReport}>
              <RefreshCw className="h-4 w-4 mr-2" />Reintentar
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  // ── Main render ────────────────────────────────────────────────────────────
  const isCriticalBanner = criticalCount > 0 || complianceRate < 80
  return (
    <div className="container mx-auto p-6 space-y-6">

      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reporte de Cumplimiento SSOMA</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Matriz de cursos obligatorios · semáforo de vigencia
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button variant="outline" size="sm" onClick={loadComplianceReport}>
            <RefreshCw className="h-4 w-4 mr-2" />Actualizar
          </Button>
          <Button size="sm" onClick={handleExportExcel} disabled={exporting}>
            <Download className="h-4 w-4 mr-2" />
            {exporting ? "Exportando…" : "Exportar Excel"}
          </Button>
        </div>
      </div>

      {/* Banner diagnóstico */}
      <div className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium border ${isCriticalBanner ? "bg-red-50 border-red-200 text-red-800" : "bg-emerald-50 border-emerald-200 text-emerald-800"}`}>
        {isCriticalBanner
          ? <><AlertTriangle className="h-4 w-4 shrink-0" /><span>Se detectaron alertas críticas — {criticalCount} colaborador(es) requieren acción inmediata.</span></>
          : <><ShieldCheck className="h-4 w-4 shrink-0" /><span>Cumplimiento general en orden · tasa {complianceRate.toFixed(1)}% ≥ 80% objetivo.</span></>
        }
      </div>

      {/* KPI tiles */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {/* Tile 1 – Colaboradores */}
        <div className="rounded-2xl border bg-card p-5 flex flex-col gap-3 hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">Colaboradores</span>
            <div className="h-8 w-8 rounded-xl bg-blue-50 flex items-center justify-center">
              <Users className="h-4 w-4 text-blue-500" />
            </div>
          </div>
          <div>
            <p className="text-3xl font-semibold tabular-nums leading-none">{total}</p>
            <p className="text-xs text-muted-foreground mt-1">{summary.totalCourses} curso(s) obligatorio(s)</p>
          </div>
          <div className="h-1 w-full rounded-full bg-muted overflow-hidden">
            <div className="h-1 rounded-full bg-blue-400 transition-all" style={{ width: "100%" }} />
          </div>
        </div>

        {/* Tile 2 – Tasa cumplimiento */}
        <div className="rounded-2xl border bg-card p-5 flex flex-col gap-3 hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">Cumplimiento</span>
            <div className={`h-8 w-8 rounded-xl flex items-center justify-center ${complianceRate >= 80 ? "bg-emerald-50" : "bg-red-50"}`}>
              <ShieldCheck className={`h-4 w-4 ${complianceRate >= 80 ? "text-emerald-500" : "text-red-500"}`} />
            </div>
          </div>
          <div>
            <p className={`text-3xl font-semibold tabular-nums leading-none ${complianceRate >= 80 ? "text-emerald-600" : "text-red-600"}`}>
              {complianceRate.toFixed(1)}%
            </p>
            <p className="text-xs text-muted-foreground mt-1">{summary.compliant} de {total} colaboradores</p>
          </div>
          <div className="h-1 w-full rounded-full bg-muted overflow-hidden">
            <div className={`h-1 rounded-full transition-all ${complianceRate >= 80 ? "bg-emerald-400" : "bg-red-400"}`} style={{ width: `${complianceRate}%` }} />
          </div>
        </div>

        {/* Tile 3 – Por vencer */}
        <div className="rounded-2xl border bg-card p-5 flex flex-col gap-3 hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">Por Vencer</span>
            <div className="h-8 w-8 rounded-xl bg-amber-50 flex items-center justify-center">
              <Clock className="h-4 w-4 text-amber-500" />
            </div>
          </div>
          <div>
            <p className="text-3xl font-semibold tabular-nums leading-none text-amber-600">{summary.expiringSoon}</p>
            <p className="text-xs text-muted-foreground mt-1">en los próximos 30 días</p>
          </div>
          <div className="h-1 w-full rounded-full bg-muted overflow-hidden">
            <div className="h-1 rounded-full bg-amber-400 transition-all" style={{ width: `${expiringRate}%` }} />
          </div>
        </div>

        {/* Tile 4 – Críticos */}
        <div className="rounded-2xl border bg-card p-5 flex flex-col gap-3 hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">Críticos</span>
            <div className={`h-8 w-8 rounded-xl flex items-center justify-center ${criticalCount > 0 ? "bg-red-50" : "bg-emerald-50"}`}>
              <AlertTriangle className={`h-4 w-4 ${criticalCount > 0 ? "text-red-500" : "text-emerald-500"}`} />
            </div>
          </div>
          <div>
            <p className={`text-3xl font-semibold tabular-nums leading-none ${criticalCount > 0 ? "text-red-600" : "text-emerald-600"}`}>{criticalCount}</p>
            <p className="text-xs text-muted-foreground mt-1">vencidos o sin inscripción</p>
          </div>
          <div className="h-1 w-full rounded-full bg-muted overflow-hidden">
            <div className={`h-1 rounded-full transition-all ${criticalCount > 0 ? "bg-red-400" : "bg-emerald-400"}`} style={{ width: total > 0 ? `${(criticalCount / total) * 100}%` : "0%" }} />
          </div>
        </div>
      </div>

      {/* OKR strip */}
      <div>
        <div className="flex items-center gap-3 mb-3">
          <Target className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Objetivos de Cumplimiento</span>
          <div className="flex-1 h-px bg-border" />
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <OkrCard krLabel="KR 1" label="Tasa de cumplimiento general ≥80%" actualDisplay={`${complianceRate.toFixed(1)}%`} target="≥80%" pct={complianceRate / 80 * 100} status={kr1Status} />
          <OkrCard krLabel="KR 2" label="Sin colaboradores con alertas críticas" actualDisplay={String(criticalCount)} target="= 0" pct={criticalCount === 0 ? 100 : Math.max(5, 100 - criticalCount * 10)} status={kr2Status} />
          <OkrCard krLabel="KR 3" label="Colaboradores por vencer ≤10% del total" actualDisplay={`${expiringRate.toFixed(1)}%`} target="≤10%" pct={expiringRate <= 10 ? 100 : Math.max(5, 100 - (expiringRate - 10) * 5)} status={kr3Status} />
          <OkrCard krLabel="KR 4" label="Cobertura de inscripción ≥95%" actualDisplay={`${enrollmentCoverage.toFixed(1)}%`} target="≥95%" pct={enrollmentCoverage / 95 * 100} status={kr4Status} />
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="matrix" className="space-y-4">
        <TabsList>
          <TabsTrigger value="matrix" className="gap-2">
            <FileText className="h-4 w-4" />Matriz de Cumplimiento
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-2">
            <TrendingUp className="h-4 w-4" />Dashboard Analítico
          </TabsTrigger>
        </TabsList>

        {/* ── Pestaña: Matriz ─────────────────────────────────────────── */}
        <TabsContent value="matrix" className="space-y-4">
          {/* Filtros inline */}
          <div className="flex flex-wrap gap-3 items-end">
            <div className="relative flex-1 min-w-[180px]">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar colaborador…" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-8 h-9" />
            </div>
            <Select value={areaFilter} onValueChange={setAreaFilter}>
              <SelectTrigger className="h-9 w-[180px]"><SelectValue placeholder="Todas las áreas" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las áreas</SelectItem>
                {areas.map(area => <SelectItem key={area} value={area}>{area}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-9 w-[190px]"><SelectValue placeholder="Todos los estados" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="COMPLIANT">✅ Cumplen</SelectItem>
                <SelectItem value="EXPIRING_SOON">⏰ Por vencer</SelectItem>
                <SelectItem value="non-compliant">🔴 Vencidos / No inscritos</SelectItem>
              </SelectContent>
            </Select>
            {(searchTerm || areaFilter !== "all" || statusFilter !== "all") && (
              <Button variant="ghost" size="sm" className="h-9" onClick={() => { setSearchTerm(""); setAreaFilter("all"); setStatusFilter("all") }}>
                Limpiar
              </Button>
            )}
            <span className="text-xs text-muted-foreground ml-auto self-center">
              Mostrando <b>{Math.min(startIdx + 1, filteredMatrix.length)}–{Math.min(startIdx + itemsPerPage, filteredMatrix.length)}</b> de <b>{filteredMatrix.length}</b> colaboradores
            </span>
          </div>

          {/* Tabla */}
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40">
                      <TableHead className="min-w-[180px] font-semibold sticky left-0 bg-muted/40">Colaborador</TableHead>
                      <TableHead className="font-semibold">Área</TableHead>
                      <TableHead className="font-semibold">Cargo</TableHead>
                      {matrix[0]?.courses.map(c => (
                        <TableHead key={c.courseId} className="min-w-[110px] text-center font-semibold">
                          <div className="flex flex-col items-center gap-0.5">
                            <span className="text-[11px] leading-tight">{c.courseName}</span>
                            {c.isRequired && <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wide">obligatorio</span>}
                          </div>
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentData.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3 + (matrix[0]?.courses.length ?? 0)} className="py-16 text-center">
                          <div className="flex flex-col items-center gap-2 text-muted-foreground">
                            <Search className="h-8 w-8 opacity-40" />
                            <p className="text-sm">Sin resultados con los filtros aplicados</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      currentData.map(record => (
                        <TableRow key={record.collaboratorId} className="hover:bg-muted/30">
                          <TableCell className="font-medium sticky left-0 bg-card">{record.fullName}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{record.area ?? "—"}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{record.position ?? "—"}</TableCell>
                          {record.courses.map(course => {
                            const cfg = CELL_CFG[course.status] ?? CELL_CFG.NOT_ENROLLED
                            const Icon = cfg.icon
                            return (
                              <TableCell key={course.courseId} className={`text-center p-1.5 ${cfg.bg}`}>
                                <div className="flex flex-col items-center gap-0.5">
                                  {Icon
                                    ? <Icon className={`h-4 w-4 ${cfg.iconClass}`} />
                                    : <span className="text-slate-400 font-medium text-sm">—</span>
                                  }
                                  {course.status === "EXPIRING_SOON" && course.daysUntilExpiration !== null && (
                                    <span className="text-[9px] font-semibold text-amber-600">{course.daysUntilExpiration}d</span>
                                  )}
                                  {course.status === "EXPIRED" && (
                                    <span className="text-[9px] font-semibold text-red-600">Vencido</span>
                                  )}
                                  {course.status === "NOT_ENROLLED" && (
                                    <span className="text-[9px] font-medium text-slate-400">No inscrito</span>
                                  )}
                                </div>
                              </TableCell>
                            )
                          })}
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Paginación */}
          {totalPages > 1 && (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-1.5">
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => goTo(1)} disabled={currentPage === 1}><ChevronsLeft className="h-3.5 w-3.5" /></Button>
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => goTo(currentPage - 1)} disabled={currentPage === 1}><ChevronLeft className="h-3.5 w-3.5" /></Button>
                {currentPage > 2 && <><span className="text-xs px-1">1</span><span className="text-xs text-muted-foreground">…</span></>}
                {pageRange.map(p => (
                  <Button key={p} variant={p === currentPage ? "default" : "outline"} size="icon" className="h-8 w-8 text-xs" onClick={() => goTo(p)}>{p}</Button>
                ))}
                {currentPage < totalPages - 1 && <><span className="text-xs text-muted-foreground">…</span><span className="text-xs px-1">{totalPages}</span></>}
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => goTo(currentPage + 1)} disabled={currentPage === totalPages}><ChevronRight className="h-3.5 w-3.5" /></Button>
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => goTo(totalPages)} disabled={currentPage === totalPages}><ChevronsRight className="h-3.5 w-3.5" /></Button>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>Filas por página:</span>
                <Select value={String(itemsPerPage)} onValueChange={v => { setItemsPerPage(Number(v)); setCurrentPage(1) }}>
                  <SelectTrigger className="h-8 w-[70px] text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>{[5, 10, 20, 50].map(n => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
          )}
        </TabsContent>

        {/* ── Pestaña: Analítico ──────────────────────────────────────── */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">

            {/* BarChart por área */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Cumplimiento por Área</CardTitle>
                <CardDescription>% de colaboradores con todos los cursos vigentes</CardDescription>
              </CardHeader>
              <CardContent>
                {areaChartData.length === 0 ? (
                  <div className="flex items-center justify-center h-56 text-muted-foreground text-sm">Sin datos de áreas</div>
                ) : (
                  <ResponsiveContainer width="100%" height={Math.max(220, areaChartData.length * 36)}>
                    <BarChart layout="vertical" data={areaChartData} margin={{ left: 4, right: 16, top: 4, bottom: 4 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                      <XAxis type="number" domain={[0, 100]} tickFormatter={v => `${v}%`} tick={{ fontSize: 11 }} />
                      <YAxis type="category" dataKey="area" width={120} tick={{ fontSize: 11 }} />
                      <ReferenceLine x={80} stroke="#10b981" strokeDasharray="4 2" label={{ value: "80%", position: "top", fontSize: 10, fill: "#10b981" }} />
                      <Tooltip
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        formatter={(_value: any, _name: any, props: any) => [`${props.payload.compliance}% (${props.payload.compliant}/${props.payload.total})`, "Cumplimiento"]}
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        labelFormatter={(_label: any, payload: any[]) => payload?.[0]?.payload?.fullArea ?? _label}
                        contentStyle={{ fontSize: 12, borderRadius: 8 }}
                      />
                      <Bar dataKey="compliance" radius={[0, 4, 4, 0]} maxBarSize={22}>
                        {areaChartData.map((entry, i) => (
                          <Cell key={i} fill={entry.compliance >= 80 ? "#10b981" : entry.compliance >= 60 ? "#f59e0b" : "#ef4444"} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* PieChart distribución */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Distribución de Estados</CardTitle>
                <CardDescription>Por peor estado de cumplimiento por colaborador</CardDescription>
              </CardHeader>
              <CardContent>
                {pieData.length === 0 ? (
                  <div className="flex items-center justify-center h-56 text-muted-foreground text-sm">Sin datos</div>
                ) : (
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="45%" innerRadius={55} outerRadius={90} dataKey="value" paddingAngle={3}>
                        {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                      </Pie>
                      <Tooltip formatter={(v, name) => [`${v} colaboradores`, name]} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                      <Legend iconType="circle" iconSize={9} formatter={(v, entry) => {
                        const pct = total > 0 ? ((entry.payload as { value: number }).value / total * 100).toFixed(1) : "0"
                        return <span className="text-xs">{v} · {pct}%</span>
                      }} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Top críticos */}
          {criticalCount > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-red-500" />
                  Colaboradores con Alertas Críticas
                </CardTitle>
                <CardDescription>Requieren acción inmediata — cursos vencidos o sin inscripción</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {matrix.filter(r => r.courses.some(c => c.status === "EXPIRED" || c.status === "NOT_ENROLLED")).slice(0, 8).map(record => {
                    const critCourses = record.courses.filter(c => c.status === "EXPIRED" || c.status === "NOT_ENROLLED")
                    return (
                      <div key={record.collaboratorId} className="flex flex-wrap items-center gap-2 rounded-lg border border-red-100 bg-red-50/50 px-3 py-2">
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-medium">{record.fullName}</span>
                          <span className="text-xs text-muted-foreground ml-2">{record.area ?? ""}</span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {critCourses.map(c => (
                            <span key={c.courseId} className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${c.status === "EXPIRED" ? "bg-red-100 text-red-700" : "bg-slate-200 text-slate-600"}`}>
                              {c.status === "EXPIRED" ? "Vencido" : "No inscrito"}: {c.courseName}
                            </span>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                  {criticalCount > 8 && (
                    <p className="text-xs text-muted-foreground text-center pt-1">y {criticalCount - 8} más — usa la Matriz para ver todos</p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Leyenda compacta */}
      <div className="flex flex-wrap gap-3">
        {[
          { bg: "bg-emerald-50 border-emerald-200", icon: CheckCircle2, iconClass: "text-emerald-500", label: "Cumple", sub: "vigente y actualizada" },
          { bg: "bg-amber-50 border-amber-200",   icon: Clock,         iconClass: "text-amber-500",   label: "Por vencer", sub: "≤30 días, programar renovación" },
          { bg: "bg-red-50 border-red-200",        icon: XCircle,       iconClass: "text-red-500",     label: "Vencido",    sub: "acción inmediata" },
          { bg: "bg-slate-100 border-slate-200",   icon: AlertCircle,   iconClass: "text-slate-400",   label: "No inscrito", sub: "sin registro en el curso" },
        ].map(({ bg, icon: Icon, iconClass, label, sub }) => (
          <div key={label} className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs ${bg}`}>
            <Icon className={`h-3.5 w-3.5 ${iconClass} shrink-0`} />
            <span className="font-semibold">{label}</span>
            <span className="text-muted-foreground">{sub}</span>
          </div>
        ))}
      </div>

    </div>
  )
}

