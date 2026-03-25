"use client"

import React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  BookOpen, 
  GraduationCap,
  AlertTriangle,
  Clock,
  CheckCircle2,
  XCircle,
  BarChart3,
  Download,
  RefreshCw,
  Calendar,
  Activity,
  Award,
  Target
} from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Legend, Line, LineChart, Pie, PieChart, Cell, ReferenceLine, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts"
import { format, formatDistanceToNow, parseISO, subDays } from "date-fns"
import { es } from "date-fns/locale"

interface DashboardKPIs {
  totalCollaborators: number
  totalCourses: number
  totalEnrollments: number
  overallCompliance: number
  complianceByArea: Record<string, number>
  expiringIn7Days: number
  expiringIn30Days: number
  expired: number
  avgAttempts: number
  avgScore: number
  passRate: number
  activeUsers: number
  coursesInProgress: number
  coursesCompleted: number
  enrollmentsTrend: Array<{ date: string; count: number }>
  completionsTrend: Array<{ date: string; count: number }>
  topCriticalCourses: Array<{
    courseId: string
    courseName: string
    expiringCount: number
    expiredCount: number
  }>
}

const COLORS = {
  primary: "hsl(var(--primary))",
  success: "#10b981",
  warning: "#f59e0b",
  danger: "#ef4444",
  info: "#3b82f6",
}

export default function DashboardPage() {
  const [kpis, setKpis] = React.useState<DashboardKPIs | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [refreshing, setRefreshing] = React.useState(false)
  const [timeRange, setTimeRange] = React.useState("30")
  const [error, setError] = React.useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = React.useState<Date | null>(null)

  React.useEffect(() => {
    loadDashboard()
  }, [timeRange])

  const loadDashboard = async () => {
    setLoading(true)
    setRefreshing(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      
      if (timeRange !== "all") {
        const endDate = new Date()
        const startDate = subDays(endDate, parseInt(timeRange))
        params.append("startDate", startDate.toISOString())
        params.append("endDate", endDate.toISOString())
      }

      const res = await fetch(`/api/reports/dashboard?${params}`)
      if (!res.ok) throw new Error("Error al cargar el dashboard")
      
      const data = await res.json()
      setKpis(data)
      setLastUpdated(new Date())
    } catch (err) {
      console.error("Error loading dashboard:", err)
      setError(err instanceof Error ? err.message : "Error desconocido al cargar datos")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleExportPDF = async () => {
    try {
      setRefreshing(true)
      const response = await fetch("/api/reports/export-collaborators-excel")
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `Reporte_Colaboradores_SSOMA_${new Date()
          .toISOString()
          .split("T")[0]}.xlsx`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } else {
        alert("Error al generar el reporte")
      }
    } catch (error) {
      console.error("Error downloading Excel:", error)
      alert("Error al descargar el reporte")
    } finally {
      setRefreshing(false)
    }
  }

  const handleViewCourseDetails = (courseId: string) => {
    // Navegar a la página de detalles del curso
    window.location.href = `/admin/courses/${courseId}/content`
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard Ejecutivo SSOMA</h1>
            <p className="text-muted-foreground mt-1">Panel de control integral con métricas de cumplimiento normativo</p>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-2xl border bg-card p-5 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-8 w-8 rounded-xl" />
              </div>
              <div>
                <Skeleton className="h-8 w-20 mb-1" />
                <Skeleton className="h-3 w-32" />
              </div>
              <Skeleton className="h-1 w-full rounded-full" />
            </div>
          ))}
        </div>
        <div>
          <Skeleton className="h-3 w-48 mb-3" />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-xl border bg-card p-4 flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-3 w-10" />
                  <Skeleton className="h-4 w-14 rounded-full" />
                </div>
                <Skeleton className="h-3 w-36" />
                <div className="flex items-end justify-between">
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-3 w-16" />
                </div>
                <Skeleton className="h-1 w-full rounded-full" />
              </div>
            ))}
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-4 w-60" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-[320px] w-full rounded-md" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard Ejecutivo SSOMA</h1>
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>{error}</span>
            <Button variant="ghost" size="sm" onClick={loadDashboard} className="ml-4">
              <RefreshCw className="h-4 w-4 mr-2" />
              Reintentar
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  if (!kpis) return null

  // Preparar datos para gráficos
  const complianceData = Object.entries(kpis.complianceByArea).map(([area, value]) => ({
    area,
    compliance: value,
  }))

  const alertsData = [
    { name: "Próximos 7 días", value: kpis.expiringIn7Days, color: COLORS.warning },
    { name: "Próximos 30 días", value: kpis.expiringIn30Days, color: COLORS.info },
    { name: "Vencidos", value: kpis.expired, color: COLORS.danger },
  ]

  // Calcular porcentaje de cursos completados
  const completionRate = kpis.coursesInProgress + kpis.coursesCompleted > 0
    ? (kpis.coursesCompleted / (kpis.coursesInProgress + kpis.coursesCompleted)) * 100
    : 0

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard Ejecutivo SSOMA</h1>
          <p className="text-muted-foreground mt-1">
            Panel de control integral con métricas de cumplimiento normativo y rendimiento
          </p>
          {lastUpdated && (
            <p className="text-xs text-muted-foreground mt-0.5">
              Actualizado {formatDistanceToNow(lastUpdated, { addSuffix: true, locale: es })}
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px]">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Últimos 7 días</SelectItem>
              <SelectItem value="30">Últimos 30 días</SelectItem>
              <SelectItem value="90">Últimos 90 días</SelectItem>
              <SelectItem value="all">Todo el tiempo</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            variant="outline"
            onClick={loadDashboard}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
          <Button 
            variant="outline"
            onClick={handleExportPDF}
            disabled={refreshing}
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar Excel
          </Button>
        </div>
      </div>

      {/* Banner diagnóstico */}
      {(kpis.overallCompliance >= 80 && kpis.expired === 0) ? (
        <Alert className="border-green-200 bg-green-50 text-green-800">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription>
            <span className="font-medium">Cumplimiento óptimo:</span> El sistema opera en niveles normales. Cumplimiento general de {kpis.overallCompliance.toFixed(1)}% sin certificados vencidos.
          </AlertDescription>
        </Alert>
      ) : (
        <Alert variant="destructive" className="border-red-200 bg-red-50 text-red-800">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="flex flex-wrap items-center gap-3">
            <span className="font-medium">Atención requerida:</span>
            {kpis.overallCompliance < 80 && (
              <Badge variant="destructive" className="text-xs">
                Cumplimiento {kpis.overallCompliance.toFixed(1)}% — meta 80%
              </Badge>
            )}
            {kpis.expired > 0 && (
              <Badge variant="destructive" className="text-xs">
                {kpis.expired} certificado{kpis.expired !== 1 ? "s" : ""} vencido{kpis.expired !== 1 ? "s" : ""}
              </Badge>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* ── KPIs principales ─────────────────────────────────── */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">

        {/* Colaboradores */}
        {(() => {
          const pct = Math.round((kpis.activeUsers / (kpis.totalCollaborators || 1)) * 100)
          return (
            <div className="rounded-2xl border bg-card p-5 flex flex-col gap-3 hover:shadow-sm transition-shadow">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">Colaboradores</span>
                <div className="h-8 w-8 rounded-xl bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center">
                  <Users className="h-4 w-4 text-blue-500" />
                </div>
              </div>
              <div>
                <p className="text-3xl font-semibold tabular-nums leading-none">{kpis.totalCollaborators}</p>
                <p className="text-xs text-muted-foreground mt-1">{kpis.activeUsers} activos en 30 días</p>
              </div>
              <div className="space-y-1">
                <div className="h-1 w-full rounded-full bg-muted overflow-hidden">
                  <div className="h-1 rounded-full bg-blue-400 transition-all" style={{ width: `${pct}%` }} />
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Activity className="h-3 w-3" />
                  <span>{pct}% de participación</span>
                </div>
              </div>
            </div>
          )
        })()}

        {/* Cumplimiento general */}
        {(() => {
          const ok = kpis.overallCompliance >= 80
          const gap = Math.abs(kpis.overallCompliance - 80).toFixed(1)
          return (
            <div className="rounded-2xl border bg-card p-5 flex flex-col gap-3 hover:shadow-sm transition-shadow">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">Cumplimiento</span>
                <div className={`h-8 w-8 rounded-xl flex items-center justify-center ${ok ? "bg-emerald-50 dark:bg-emerald-950/50" : "bg-red-50 dark:bg-red-950/50"}`}>
                  <Target className={`h-4 w-4 ${ok ? "text-emerald-500" : "text-red-500"}`} />
                </div>
              </div>
              <div>
                <p className={`text-3xl font-semibold tabular-nums leading-none ${ok ? "text-emerald-600" : "text-red-500"}`}>
                  {kpis.overallCompliance.toFixed(1)}%
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {ok ? `+${gap}% sobre la meta` : `${gap}% bajo la meta`}
                </p>
              </div>
              <div className="space-y-1">
                <div className="h-1 w-full rounded-full bg-muted overflow-hidden">
                  <div className={`h-1 rounded-full transition-all ${ok ? "bg-emerald-400" : "bg-red-400"}`} style={{ width: `${kpis.overallCompliance}%` }} />
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  {ok
                    ? <TrendingUp className="h-3 w-3 text-emerald-500" />
                    : <TrendingDown className="h-3 w-3 text-red-500" />}
                  <span>Meta: 80%</span>
                </div>
              </div>
            </div>
          )
        })()}

        {/* Tasa de aprobación */}
        {(() => {
          const ok = kpis.passRate >= 90
          return (
            <div className="rounded-2xl border bg-card p-5 flex flex-col gap-3 hover:shadow-sm transition-shadow">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">Aprobación</span>
                <div className="h-8 w-8 rounded-xl bg-violet-50 dark:bg-violet-950/50 flex items-center justify-center">
                  <GraduationCap className="h-4 w-4 text-violet-500" />
                </div>
              </div>
              <div>
                <p className="text-3xl font-semibold tabular-nums leading-none text-violet-600">
                  {kpis.passRate.toFixed(1)}%
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Nota promedio: {kpis.avgScore.toFixed(1)} pts
                </p>
              </div>
              <div className="space-y-1">
                <div className="h-1 w-full rounded-full bg-muted overflow-hidden">
                  <div className="h-1 rounded-full bg-violet-400 transition-all" style={{ width: `${kpis.passRate}%` }} />
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Award className="h-3 w-3" />
                  <span>{kpis.avgAttempts.toFixed(1)} intentos promedio · meta ≥90%</span>
                </div>
              </div>
            </div>
          )
        })()}

        {/* Alertas de vencimiento */}
        {(() => {
          const critical = kpis.expired > 0
          return (
            <div className="rounded-2xl border bg-card p-5 flex flex-col gap-3 hover:shadow-sm transition-shadow">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">Vencimientos</span>
                <div className={`h-8 w-8 rounded-xl flex items-center justify-center ${critical ? "bg-red-50 dark:bg-red-950/50" : "bg-amber-50 dark:bg-amber-950/50"}`}>
                  <AlertTriangle className={`h-4 w-4 ${critical ? "text-red-500" : "text-amber-500"}`} />
                </div>
              </div>
              <div>
                <p className={`text-3xl font-semibold tabular-nums leading-none ${critical ? "text-red-500" : "text-amber-500"}`}>
                  {kpis.expired}
                </p>
                <p className="text-xs text-muted-foreground mt-1">certificados vencidos</p>
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <span className="inline-block h-2 w-2 rounded-full bg-amber-400" />
                  {kpis.expiringIn7Days} en 7 días
                </span>
                <span className="flex items-center gap-1">
                  <span className="inline-block h-2 w-2 rounded-full bg-orange-400" />
                  {kpis.expiringIn30Days} en 30 días
                </span>
              </div>
            </div>
          )
        })()}
      </div>

      {/* ── OKR — Objetivos clave de seguridad ───────────────── */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">OKR · Fuerza laboral certificada</span>
          <div className="flex-1 h-px bg-border" />
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">

          {/* KR1: Cumplimiento normativo ≥80% */}
          {(() => {
            const actual = kpis.overallCompliance
            const target = 80
            const pct = Math.min(100, Math.round((actual / target) * 100))
            const status = actual >= target ? "cumplido" : actual >= target * 0.75 ? "en riesgo" : "crítico"
            const colors = { cumplido: "bg-emerald-100 text-emerald-700", "en riesgo": "bg-amber-100 text-amber-700", crítico: "bg-red-100 text-red-700" }
            const bars = { cumplido: "bg-emerald-400", "en riesgo": "bg-amber-400", crítico: "bg-red-400" }
            return (
              <div className="rounded-xl border bg-card p-4 flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">KR 1</span>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${colors[status]}`}>{status}</span>
                </div>
                <p className="text-xs font-medium text-foreground leading-tight">Cumplimiento normativo</p>
                <div className="flex items-end justify-between">
                  <span className="text-xl font-bold tabular-nums">{actual.toFixed(1)}%</span>
                  <span className="text-[10px] text-muted-foreground">meta ≥{target}%</span>
                </div>
                <div className="h-1 w-full rounded-full bg-muted overflow-hidden">
                  <div className={`h-1 rounded-full ${bars[status]} transition-all`} style={{ width: `${pct}%` }} />
                </div>
              </div>
            )
          })()}

          {/* KR2: Tasa de aprobación ≥90% */}
          {(() => {
            const actual = kpis.passRate
            const target = 90
            const pct = Math.min(100, Math.round((actual / target) * 100))
            const status = actual >= target ? "cumplido" : actual >= target * 0.75 ? "en riesgo" : "crítico"
            const colors = { cumplido: "bg-emerald-100 text-emerald-700", "en riesgo": "bg-amber-100 text-amber-700", crítico: "bg-red-100 text-red-700" }
            const bars = { cumplido: "bg-emerald-400", "en riesgo": "bg-amber-400", crítico: "bg-red-400" }
            return (
              <div className="rounded-xl border bg-card p-4 flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">KR 2</span>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${colors[status]}`}>{status}</span>
                </div>
                <p className="text-xs font-medium text-foreground leading-tight">Tasa de aprobación</p>
                <div className="flex items-end justify-between">
                  <span className="text-xl font-bold tabular-nums">{actual.toFixed(1)}%</span>
                  <span className="text-[10px] text-muted-foreground">meta ≥{target}%</span>
                </div>
                <div className="h-1 w-full rounded-full bg-muted overflow-hidden">
                  <div className={`h-1 rounded-full ${bars[status]} transition-all`} style={{ width: `${pct}%` }} />
                </div>
              </div>
            )
          })()}

          {/* KR3: Cero certificados vencidos */}
          {(() => {
            const actual = kpis.expired
            const status = actual === 0 ? "cumplido" : actual <= 3 ? "en riesgo" : "crítico"
            const colors = { cumplido: "bg-emerald-100 text-emerald-700", "en riesgo": "bg-amber-100 text-amber-700", crítico: "bg-red-100 text-red-700" }
            const bars = { cumplido: "bg-emerald-400", "en riesgo": "bg-amber-400", crítico: "bg-red-400" }
            const pct = actual === 0 ? 100 : Math.max(5, 100 - Math.min(100, actual * 5))
            return (
              <div className="rounded-xl border bg-card p-4 flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">KR 3</span>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${colors[status]}`}>{status}</span>
                </div>
                <p className="text-xs font-medium text-foreground leading-tight">Sin certificados vencidos</p>
                <div className="flex items-end justify-between">
                  <span className="text-xl font-bold tabular-nums">{actual}</span>
                  <span className="text-[10px] text-muted-foreground">meta = 0</span>
                </div>
                <div className="h-1 w-full rounded-full bg-muted overflow-hidden">
                  <div className={`h-1 rounded-full ${bars[status]} transition-all`} style={{ width: `${pct}%` }} />
                </div>
              </div>
            )
          })()}

          {/* KR4: Participación activa ≥70% */}
          {(() => {
            const actual = Math.round((kpis.activeUsers / (kpis.totalCollaborators || 1)) * 100)
            const target = 70
            const pct = Math.min(100, Math.round((actual / target) * 100))
            const status = actual >= target ? "cumplido" : actual >= target * 0.75 ? "en riesgo" : "crítico"
            const colors = { cumplido: "bg-emerald-100 text-emerald-700", "en riesgo": "bg-amber-100 text-amber-700", crítico: "bg-red-100 text-red-700" }
            const bars = { cumplido: "bg-emerald-400", "en riesgo": "bg-amber-400", crítico: "bg-red-400" }
            return (
              <div className="rounded-xl border bg-card p-4 flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">KR 4</span>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${colors[status]}`}>{status}</span>
                </div>
                <p className="text-xs font-medium text-foreground leading-tight">Participación activa</p>
                <div className="flex items-end justify-between">
                  <span className="text-xl font-bold tabular-nums">{actual}%</span>
                  <span className="text-[10px] text-muted-foreground">meta ≥{target}%</span>
                </div>
                <div className="h-1 w-full rounded-full bg-muted overflow-hidden">
                  <div className={`h-1 rounded-full ${bars[status]} transition-all`} style={{ width: `${pct}%` }} />
                </div>
              </div>
            )
          })()}

        </div>
      </div>

      {/* Tabs para organizar contenido */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
          <TabsTrigger value="overview">Resumen</TabsTrigger>
          <TabsTrigger value="trends">Tendencias</TabsTrigger>
          <TabsTrigger value="details">Detalles</TabsTrigger>
        </TabsList>

        {/* Tab: Resumen */}
        <TabsContent value="overview" className="space-y-4">
          {/* Gráficos principales */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* Cumplimiento por Área */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Cumplimiento por Área</CardTitle>
                    <CardDescription>Porcentaje de cumplimiento por área organizacional</CardDescription>
                  </div>
                  <BarChart3 className="h-5 w-5 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                {complianceData.length === 0 ? (
                  <div className="h-[320px] flex items-center justify-center text-muted-foreground text-sm">
                    No hay datos de cumplimiento por área
                  </div>
                ) : (
                <div className="h-[320px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={complianceData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis 
                        dataKey="area" 
                        angle={-45}
                        textAnchor="end"
                        height={100}
                        interval={0}
                        tick={{ fontSize: 12 }}
                      />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '6px'
                        }}
                        formatter={(value: number) => [`${value.toFixed(1)}%`, "Cumplimiento"]}
                      />
                      <ReferenceLine y={80} stroke="#10b981" strokeDasharray="4 2" label={{ value: "Meta 80%", fontSize: 11, fill: "#10b981" }} />
                      <Bar 
                        dataKey="compliance" 
                        radius={[8, 8, 0, 0]}
                      >
                        {complianceData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={entry.compliance >= 80 ? COLORS.success : COLORS.danger}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                )}
              </CardContent>
            </Card>

            {/* Distribución de Alertas */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Vencimientos y Alertas</CardTitle>
                    <CardDescription>Distribución de cursos por estado de vigencia</CardDescription>
                  </div>
                  <AlertTriangle className="h-5 w-5 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                {alertsData.every(d => d.value === 0) ? (
                  <div className="h-[320px] flex flex-col items-center justify-center text-muted-foreground">
                    <CheckCircle2 className="h-12 w-12 mb-2 text-green-500 opacity-70" />
                    <p className="text-sm">Sin alertas de vencimiento activas</p>
                  </div>
                ) : (
                <div className="h-[320px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={alertsData.filter(d => d.value > 0)}
                        cx="50%"
                        cy="45%"
                        outerRadius={100}
                        dataKey="value"
                      >
                        {alertsData.filter(d => d.value > 0).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '6px'
                        }}
                        formatter={(value: number, name: string) => [value, name]}
                      />
                      <Legend
                        formatter={(value) => <span className="text-xs">{value}</span>}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Métricas adicionales */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">Cursos en Progreso</CardTitle>
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{kpis.coursesInProgress}</div>
                <Progress value={completionRate} className="mt-2 h-2" />
                <div className="text-xs text-muted-foreground mt-2">
                  {kpis.coursesCompleted} completados ({completionRate.toFixed(1)}%)
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">Total Inscripciones</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{kpis.totalEnrollments}</div>
                <div className="text-xs text-muted-foreground mt-2">
                  En {kpis.totalCourses} cursos activos
                </div>
                <Badge variant="secondary" className="mt-2">
                  {(kpis.totalEnrollments / (kpis.totalCourses || 1)).toFixed(1)} inscripciones/curso
                </Badge>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">Promedio de Intentos</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{kpis.avgAttempts.toFixed(2)}</div>
                <div className="text-xs text-muted-foreground mt-2">
                  Por evaluación realizada
                </div>
                {kpis.avgAttempts <= 2 && (
                  <Badge variant="outline" className="mt-2 text-green-600 border-green-600">
                    Excelente
                  </Badge>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab: Tendencias */}
        <TabsContent value="trends" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Inscripciones en el tiempo */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Tendencia de Inscripciones</CardTitle>
                    <CardDescription>Inscripciones diarias en el período seleccionado</CardDescription>
                  </div>
                  <TrendingUp className="h-5 w-5 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                {kpis.enrollmentsTrend.length === 0 ? (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground text-sm">
                    Sin datos de inscripciones en el período seleccionado
                  </div>
                ) : (
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={kpis.enrollmentsTrend}>
                      <defs>
                        <linearGradient id="enrollGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.35} />
                          <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 11 }}
                        tickFormatter={(d) => {
                          try { return format(parseISO(d), "d MMM", { locale: es }) } catch { return d }
                        }}
                      />
                      <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '6px'
                        }}
                        labelFormatter={(d) => {
                          try { return format(parseISO(d as string), "d 'de' MMMM yyyy", { locale: es }) } catch { return d }
                        }}
                        formatter={(value: number) => [value, "Inscripciones"]}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="count" 
                        stroke={COLORS.primary}
                        fill="url(#enrollGrad)"
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                )}
              </CardContent>
            </Card>

            {/* Completaciones en el tiempo */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Tendencia de Completaciones</CardTitle>
                    <CardDescription>Cursos completados diariamente</CardDescription>
                  </div>
                  <CheckCircle2 className="h-5 w-5 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                {kpis.completionsTrend.length === 0 ? (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground text-sm">
                    Sin datos de completaciones en el período seleccionado
                  </div>
                ) : (
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={kpis.completionsTrend}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 11 }}
                        tickFormatter={(d) => {
                          try { return format(parseISO(d), "d MMM", { locale: es }) } catch { return d }
                        }}
                      />
                      <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '6px'
                        }}
                        labelFormatter={(d) => {
                          try { return format(parseISO(d as string), "d 'de' MMMM yyyy", { locale: es }) } catch { return d }
                        }}
                        formatter={(value: number) => [value, "Completaciones"]}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="count" 
                        stroke={COLORS.success} 
                        strokeWidth={3}
                        dot={{ r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab: Detalles */}
        <TabsContent value="details" className="space-y-4">
          {/* Cursos Críticos */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Cursos Más Críticos</CardTitle>
                  <CardDescription>Cursos obligatorios con mayor cantidad de vencimientos</CardDescription>
                </div>
                <Badge variant="destructive">
                  {kpis.topCriticalCourses.length} cursos
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {kpis.topCriticalCourses.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle2 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No hay cursos críticos en este momento</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {kpis.topCriticalCourses.map((course, index) => (
                    <div 
                      key={course.courseId} 
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" className="text-xs">
                            #{index + 1}
                          </Badge>
                          <p className="font-medium">{course.courseName}</p>
                        </div>
                        <div className="flex gap-2 flex-wrap">
                          {course.expiredCount > 0 && (
                            <Badge variant="destructive" className="text-xs">
                              <XCircle className="h-3 w-3 mr-1" />
                              {course.expiredCount} vencidos
                            </Badge>
                          )}
                          {course.expiringCount > 0 && (
                            <Badge variant="outline" className="text-xs border-yellow-600 text-yellow-600">
                              <Clock className="h-3 w-3 mr-1" />
                              {course.expiringCount} por vencer
                            </Badge>
                          )}
                        </div>
                        <div className="mt-3 flex gap-1 h-2 rounded-full overflow-hidden bg-slate-100">
                          {course.expiredCount > 0 && (
                            <div
                              className="bg-red-500 rounded-full"
                              style={{
                                width: `${(course.expiredCount / (course.expiredCount + course.expiringCount)) * 100}%`
                              }}
                              title={`${course.expiredCount} vencidos`}
                            />
                          )}
                          {course.expiringCount > 0 && (
                            <div
                              className="bg-yellow-400 rounded-full"
                              style={{
                                width: `${(course.expiringCount / (course.expiredCount + course.expiringCount)) * 100}%`
                              }}
                              title={`${course.expiringCount} por vencer`}
                            />
                          )}
                        </div>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="ml-4"
                        onClick={() => handleViewCourseDetails(course.courseId)}
                      >
                        Ver detalles
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
