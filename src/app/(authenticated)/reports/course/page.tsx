"use client"

import React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Download, TrendingUp, Users, Clock, Target } from "lucide-react"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Pie, PieChart, Cell } from "recharts"

interface CourseReportData {
  course: {
    id: string
    name: string
    code: string
    activeVersion: string | null
  }
  statistics: {
    totalEnrolled: number
    avgProgress: number
    completionRate: number
    passRate: number
    avgScore: number
    avgTime: number
  }
  scoreDistribution: Array<{ range: string; count: number }>
  statusDistribution: Array<{ status: string; count: number }>
}

const STATUS_COLORS: Record<string, string> = {
  PASSED: "#10b981",
  IN_PROGRESS: "#3b82f6",
  FAILED: "#ef4444",
  EXPIRED: "#dc2626",
  NOT_STARTED: "#6b7280",
}

export default function CourseReportPage() {
  const [reportData, setReportData] = React.useState<CourseReportData | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [selectedCourse, setSelectedCourse] = React.useState("")
  const [courses, setCourses] = React.useState<Array<{ id: string; name: string }>>([])

  // Cargar cursos al montar
  React.useEffect(() => {
    const loadCourses = async () => {
      try {
        const res = await fetch("/api/courses")
        if (res.ok) {
          const data = await res.json()
          const coursesArray = Array.isArray(data) ? data : data.data || []
          setCourses(coursesArray.map((c: any) => ({ id: c.id, name: c.name })))
        }
      } catch (error) {
        console.error("Error loading courses:", error)
      }
    }
    loadCourses()
  }, [])

  const loadReport = async (courseId: string) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/reports/course?courseId=${courseId}`)
      if (!res.ok) throw new Error("Error loading report")
      
      const data = await res.json()
      setReportData(data)
    } catch (error) {
      console.error("Error loading course report:", error)
    } finally {
      setLoading(false)
    }
  }

  if (!reportData) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <h1 className="text-3xl font-bold">Reporte por Curso</h1>
        <Card>
          <CardHeader>
            <CardTitle>Seleccionar Curso</CardTitle>
            <CardDescription>Elige un curso para ver sus estadísticas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Selecciona un curso..." />
                </SelectTrigger>
                <SelectContent>
                  {courses.map((course) => (
                    <SelectItem key={course.id} value={course.id}>
                      {course.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={() => loadReport(selectedCourse)} disabled={!selectedCourse || loading}>
                Generar Reporte
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{reportData.course.name}</h1>
          <p className="text-muted-foreground">
            Código: {reportData.course.code} | Versión: {reportData.course.activeVersion || "N/A"}
          </p>
        </div>
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Exportar PDF
        </Button>
      </div>

      {/* KPIs del Curso */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Inscritos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reportData.statistics.totalEnrolled}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasa de Completación</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reportData.statistics.completionRate.toFixed(1)}%</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasa de Aprobación</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reportData.statistics.passRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              Promedio: {reportData.statistics.avgScore.toFixed(1)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tiempo Promedio</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(reportData.statistics.avgTime)} min</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Distribución de Calificaciones */}
        <Card>
          <CardHeader>
            <CardTitle>Distribución de Calificaciones</CardTitle>
            <CardDescription>Rangos de puntajes obtenidos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={reportData.scoreDistribution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="range" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Distribución de Estados */}
        <Card>
          <CardHeader>
            <CardTitle>Distribución de Estados</CardTitle>
            <CardDescription>Estado de los inscritos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={reportData.statusDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ status, count }) => `${status}: ${count}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {reportData.statusDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.status] || "#6b7280"} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
