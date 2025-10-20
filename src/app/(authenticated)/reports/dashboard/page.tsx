"use client"

import React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
  Download
} from "lucide-react"
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Line, LineChart, Pie, PieChart, Cell, XAxis, YAxis, ResponsiveContainer, Legend, Tooltip } from "recharts"
import { format, subDays } from "date-fns"
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
  const [timeRange, setTimeRange] = React.useState("30")
  const [areaFilter, setAreaFilter] = React.useState<string>("all")

  React.useEffect(() => {
    loadDashboard()
  }, [timeRange, areaFilter])

  const loadDashboard = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      
      if (timeRange !== "all") {
        const endDate = new Date()
        const startDate = subDays(endDate, parseInt(timeRange))
        params.append("startDate", startDate.toISOString())
        params.append("endDate", endDate.toISOString())
      }
      
      if (areaFilter !== "all") {
        params.append("areaId", areaFilter)
      }

      const res = await fetch(`/api/reports/dashboard?${params}`)
      if (!res.ok) throw new Error("Error loading dashboard")
      
      const data = await res.json()
      setKpis(data)
    } catch (error) {
      console.error("Error loading dashboard:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading || !kpis) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando dashboard...</p>
        </div>
      </div>
    )
  }

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

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard Ejecutivo</h1>
          <p className="text-muted-foreground">
            Panel de control con métricas de cumplimiento y rendimiento
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Últimos 7 días</SelectItem>
              <SelectItem value="30">Últimos 30 días</SelectItem>
              <SelectItem value="90">Últimos 90 días</SelectItem>
              <SelectItem value="all">Todo el tiempo</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon">
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* KPIs principales */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Colaboradores Activos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.totalCollaborators}</div>
            <p className="text-xs text-muted-foreground">
              {kpis.activeUsers} activos en 30 días
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cumplimiento General</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.overallCompliance.toFixed(1)}%</div>
            <div className="flex items-center text-xs">
              {kpis.overallCompliance >= 80 ? (
                <>
                  <TrendingUp className="h-3 w-3 text-success mr-1" />
                  <span className="text-success">Objetivo cumplido</span>
                </>
              ) : (
                <>
                  <TrendingDown className="h-3 w-3 text-danger mr-1" />
                  <span className="text-danger">Necesita atención</span>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasa de Aprobación</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.passRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              Promedio: {kpis.avgScore.toFixed(1)} puntos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alertas Críticas</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-danger">{kpis.expired}</div>
            <p className="text-xs text-muted-foreground">
              {kpis.expiringIn7Days} próximos a vencer (7d)
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos principales */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Cumplimiento por Área */}
        <Card>
          <CardHeader>
            <CardTitle>Cumplimiento por Área</CardTitle>
            <CardDescription>Porcentaje de cumplimiento por área organizacional</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={complianceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="area" 
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    interval={0}
                  />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Bar dataKey="compliance" fill={COLORS.primary} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Distribución de Alertas */}
        <Card>
          <CardHeader>
            <CardTitle>Vencimientos y Alertas</CardTitle>
            <CardDescription>Distribución de cursos por estado de vigencia</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={alertsData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {alertsData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tendencias */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Inscripciones en el tiempo */}
        <Card>
          <CardHeader>
            <CardTitle>Tendencia de Inscripciones</CardTitle>
            <CardDescription>Inscripciones diarias en el período seleccionado</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={kpis.enrollmentsTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Area 
                    type="monotone" 
                    dataKey="count" 
                    stroke={COLORS.primary} 
                    fill={COLORS.primary}
                    fillOpacity={0.6}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Completaciones en el tiempo */}
        <Card>
          <CardHeader>
            <CardTitle>Tendencia de Completaciones</CardTitle>
            <CardDescription>Cursos completados diariamente</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={kpis.completionsTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="count" 
                    stroke={COLORS.success} 
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cursos Críticos */}
      <Card>
        <CardHeader>
          <CardTitle>Cursos Más Críticos</CardTitle>
          <CardDescription>Cursos obligatorios con mayor cantidad de vencimientos</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {kpis.topCriticalCourses.map((course) => (
              <div key={course.courseId} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <p className="font-medium">{course.courseName}</p>
                  <div className="flex gap-2 mt-1">
                    {course.expiredCount > 0 && (
                      <Badge variant="destructive">
                        <XCircle className="h-3 w-3 mr-1" />
                        {course.expiredCount} vencidos
                      </Badge>
                    )}
                    {course.expiringCount > 0 && (
                      <Badge variant="secondary">
                        <Clock className="h-3 w-3 mr-1" />
                        {course.expiringCount} por vencer
                      </Badge>
                    )}
                  </div>
                </div>
                <Button variant="outline" size="sm">Ver detalles</Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Métricas adicionales */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Cursos en Progreso</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.coursesInProgress}</div>
            <div className="text-xs text-muted-foreground mt-1">
              {kpis.coursesCompleted} completados
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Promedio de Intentos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.avgAttempts.toFixed(2)}</div>
            <div className="text-xs text-muted-foreground mt-1">
              Por colaborador
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Inscripciones</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.totalEnrollments}</div>
            <div className="text-xs text-muted-foreground mt-1">
              En {kpis.totalCourses} cursos activos
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
