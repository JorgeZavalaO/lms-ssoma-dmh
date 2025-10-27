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
  Download,
  RefreshCw,
  Calendar,
  Activity,
  Award,
  Target
} from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Line, LineChart, Pie, PieChart, Cell, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts"
import { subDays } from "date-fns"

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

  React.useEffect(() => {
    loadDashboard()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeRange])

  const loadDashboard = async () => {
    setLoading(true)
    setRefreshing(true)
    try {
      const params = new URLSearchParams()
      
      if (timeRange !== "all") {
        const endDate = new Date()
        const startDate = subDays(endDate, parseInt(timeRange))
        params.append("startDate", startDate.toISOString())
        params.append("endDate", endDate.toISOString())
      }

      const res = await fetch(`/api/reports/dashboard?${params}`)
      if (!res.ok) throw new Error("Error loading dashboard")
      
      const data = await res.json()
      setKpis(data)
    } catch (error) {
      console.error("Error loading dashboard:", error)
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

  // Calcular porcentaje de cursos completados
  const completionRate = kpis.coursesInProgress + kpis.coursesCompleted > 0
    ? (kpis.coursesCompleted / (kpis.coursesInProgress + kpis.coursesCompleted)) * 100
    : 0

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header Mejorado */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard Ejecutivo SSOMA</h1>
          <p className="text-muted-foreground mt-1">
            Panel de control integral con métricas de cumplimiento normativo y rendimiento
          </p>
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
            size="icon"
            onClick={loadDashboard}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
          <Button 
            variant="outline" 
            size="icon"
            onClick={handleExportPDF}
            disabled={refreshing}
            title="Descargar reporte Excel de colaboradores"
          >
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* KPIs principales con diseño mejorado */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Colaboradores Activos */}
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Colaboradores Activos</CardTitle>
            <div className="h-8 w-8 rounded-full bg-blue-500/10 flex items-center justify-center">
              <Users className="h-4 w-4 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{kpis.totalCollaborators}</div>
            <div className="mt-2 flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                <Activity className="h-3 w-3 mr-1" />
                {kpis.activeUsers} en 30 días
              </Badge>
            </div>
            <Progress 
              value={(kpis.activeUsers / (kpis.totalCollaborators || 1)) * 100} 
              className="mt-3 h-2"
            />
            <p className="text-xs text-muted-foreground mt-1">
              {((kpis.activeUsers / (kpis.totalCollaborators || 1)) * 100).toFixed(1)}% de participación
            </p>
          </CardContent>
        </Card>

        {/* Cumplimiento General */}
        <Card className={`border-l-4 ${kpis.overallCompliance >= 80 ? 'border-l-green-500' : 'border-l-red-500'}`}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cumplimiento General</CardTitle>
            <div className={`h-8 w-8 rounded-full ${kpis.overallCompliance >= 80 ? 'bg-green-500/10' : 'bg-red-500/10'} flex items-center justify-center`}>
              <Target className={`h-4 w-4 ${kpis.overallCompliance >= 80 ? 'text-green-500' : 'text-red-500'}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${kpis.overallCompliance >= 80 ? 'text-green-600' : 'text-red-600'}`}>
              {kpis.overallCompliance.toFixed(1)}%
            </div>
            <div className="mt-2 flex items-center gap-1 text-xs">
              {kpis.overallCompliance >= 80 ? (
                <>
                  <TrendingUp className="h-3 w-3 text-green-600" />
                  <span className="text-green-600 font-medium">Objetivo cumplido</span>
                </>
              ) : (
                <>
                  <TrendingDown className="h-3 w-3 text-red-600" />
                  <span className="text-red-600 font-medium">Necesita atención</span>
                </>
              )}
            </div>
            <Progress 
              value={kpis.overallCompliance} 
              className="mt-3 h-2"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Meta: 80% cumplimiento
            </p>
          </CardContent>
        </Card>

        {/* Tasa de Aprobación */}
        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasa de Aprobación</CardTitle>
            <div className="h-8 w-8 rounded-full bg-purple-500/10 flex items-center justify-center">
              <GraduationCap className="h-4 w-4 text-purple-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">{kpis.passRate.toFixed(1)}%</div>
            <div className="mt-2 flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                <Award className="h-3 w-3 mr-1" />
                {kpis.avgScore.toFixed(1)} pts promedio
              </Badge>
            </div>
            <Progress 
              value={kpis.passRate} 
              className="mt-3 h-2"
            />
            <p className="text-xs text-muted-foreground mt-1">
              {kpis.avgAttempts.toFixed(2)} intentos promedio
            </p>
          </CardContent>
        </Card>

        {/* Alertas Críticas */}
        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alertas Críticas</CardTitle>
            <div className="h-8 w-8 rounded-full bg-red-500/10 flex items-center justify-center">
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{kpis.expired}</div>
            <div className="mt-2 space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Próximos 7 días:</span>
                <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                  {kpis.expiringIn7Days}
                </Badge>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Próximos 30 días:</span>
                <Badge variant="outline" className="text-orange-600 border-orange-600">
                  {kpis.expiringIn30Days}
                </Badge>
              </div>
            </div>
            <Progress 
              value={((kpis.expired / ((kpis.expired + kpis.expiringIn7Days + kpis.expiringIn30Days) || 1)) * 100)} 
              className="mt-3 h-2"
            />
          </CardContent>
        </Card>
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
                      />
                      <Bar 
                        dataKey="compliance" 
                        fill={COLORS.primary}
                        radius={[8, 8, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
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
                <div className="h-[320px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={alertsData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                        outerRadius={90}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {alertsData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '6px'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
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
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={kpis.enrollmentsTrend}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '6px'
                        }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="count" 
                        stroke={COLORS.primary} 
                        fill={COLORS.primary}
                        fillOpacity={0.3}
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
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
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={kpis.completionsTrend}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '6px'
                        }}
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
                        <div className="mt-2">
                          <Progress 
                            value={((course.expiredCount / ((course.expiredCount + course.expiringCount) || 1)) * 100)} 
                            className="h-2"
                          />
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
