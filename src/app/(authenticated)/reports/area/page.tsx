"use client"

import React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Download, Filter } from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface AreaReportRecord {
  collaboratorId: string
  dni: string
  fullName: string
  email: string
  site: string | null
  area: string | null
  position: string | null
  courseId: string
  courseName: string
  status: string
  progress: number
  startedAt: Date | null
  completedAt: Date | null
  expiresAt: Date | null
  score: number | null | undefined
}

const getStatusBadge = (status: string) => {
  const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
    PASSED: { variant: "default", label: "Aprobado" },
    IN_PROGRESS: { variant: "secondary", label: "En Progreso" },
    FAILED: { variant: "destructive", label: "Reprobado" },
    EXPIRED: { variant: "destructive", label: "Vencido" },
    NOT_STARTED: { variant: "outline", label: "No Iniciado" },
  }
  const config = variants[status] || { variant: "outline", label: status }
  return <Badge variant={config.variant}>{config.label}</Badge>
}

export default function AreaReportPage() {
  const [records, setRecords] = React.useState<AreaReportRecord[]>([])
  const [loading, setLoading] = React.useState(false)
  const [areas, setAreas] = React.useState<Array<{ id: string; name: string }>>([])
  const [sites, setSites] = React.useState<Array<{ id: string; name: string }>>([])
  const [courses, setCourses] = React.useState<Array<{ id: string; name: string }>>([])
  const [filters, setFilters] = React.useState({
    areaId: "",
    siteId: "",
    positionId: "",
    status: "",
    courseId: "",
  })

  // Función para cargar el reporte
  const loadReport = React.useCallback(async (currentFilters = filters) => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      Object.entries(currentFilters).forEach(([key, value]) => {
        if (value) params.append(key, value)
      })

      const res = await fetch(`/api/reports/area?${params}`)
      if (!res.ok) throw new Error("Error loading report")
      
      const data = await res.json()
      setRecords(data.records || [])
    } catch (error) {
      console.error("Error loading area report:", error)
    } finally {
      setLoading(false)
    }
  }, [filters])

  // Cargar filtros al montar
  React.useEffect(() => {
    const loadFilters = async () => {
      try {
        const [areasRes, sitesRes, coursesRes] = await Promise.all([
          fetch("/api/areas"),
          fetch("/api/sites"),
          fetch("/api/courses"),
        ])

        if (areasRes.ok) {
          const data = await areasRes.json()
          // Los endpoints devuelven directamente el array
          const areasArray = Array.isArray(data) ? data : data.data || []
          setAreas(areasArray.map((a: any) => ({ id: a.id, name: a.name })))
        }
        if (sitesRes.ok) {
          const data = await sitesRes.json()
          const sitesArray = Array.isArray(data) ? data : data.data || []
          setSites(sitesArray.map((s: any) => ({ id: s.id, name: s.name })))
        }
        if (coursesRes.ok) {
          const data = await coursesRes.json()
          const coursesArray = Array.isArray(data) ? data : data.data || []
          setCourses(coursesArray.map((c: any) => ({ id: c.id, name: c.name })))
        }
      } catch (error) {
        console.error("Error loading filters:", error)
      }
    }
    loadFilters()
    // Cargar reporte inicial
    loadReport()
  }, [])

  const exportToExcel = () => {
    // TODO: Implement Excel export
    console.log("Export to Excel")
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Reporte por Área</h1>
          <p className="text-muted-foreground">
            Listado de colaboradores con estado por curso
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={exportToExcel} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exportar XLSX
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>Personaliza los criterios del reporte</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="text-sm font-medium mb-2 block">Área</label>
              <Select value={filters.areaId} onValueChange={(v) => setFilters({ ...filters, areaId: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas las áreas" />
                </SelectTrigger>
                <SelectContent>
                  {areas.map((area) => (
                    <SelectItem key={area.id} value={area.id}>
                      {area.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Sede</label>
              <Select value={filters.siteId} onValueChange={(v) => setFilters({ ...filters, siteId: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas las sedes" />
                </SelectTrigger>
                <SelectContent>
                  {sites.map((site) => (
                    <SelectItem key={site.id} value={site.id}>
                      {site.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Curso</label>
              <Select value={filters.courseId} onValueChange={(v) => setFilters({ ...filters, courseId: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos los cursos" />
                </SelectTrigger>
                <SelectContent>
                  {courses.map((course) => (
                    <SelectItem key={course.id} value={course.id}>
                      {course.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Estado</label>
              <Select value={filters.status} onValueChange={(v) => setFilters({ ...filters, status: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos los estados" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PASSED">Aprobado</SelectItem>
                  <SelectItem value="IN_PROGRESS">En progreso</SelectItem>
                  <SelectItem value="FAILED">Reprobado</SelectItem>
                  <SelectItem value="EXPIRED">Vencido</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button onClick={() => loadReport()} className="w-full">
                <Filter className="h-4 w-4 mr-2" />
                Aplicar Filtros
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Resultados ({records.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Cargando...</div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>DNI</TableHead>
                    <TableHead>Colaborador</TableHead>
                    <TableHead>Área</TableHead>
                    <TableHead>Puesto</TableHead>
                    <TableHead>Curso</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Progreso</TableHead>
                    <TableHead>Calificación</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {records.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-muted-foreground">
                        No se encontraron registros
                      </TableCell>
                    </TableRow>
                  ) : (
                    records.map((record) => (
                      <TableRow key={`${record.collaboratorId}-${record.courseId}`}>
                        <TableCell>{record.dni}</TableCell>
                        <TableCell className="font-medium">{record.fullName}</TableCell>
                        <TableCell>{record.area || "-"}</TableCell>
                        <TableCell>{record.position || "-"}</TableCell>
                        <TableCell>{record.courseName}</TableCell>
                        <TableCell>{getStatusBadge(record.status)}</TableCell>
                        <TableCell>{record.progress}%</TableCell>
                        <TableCell>
                          {record.score !== null && record.score !== undefined ? record.score.toFixed(1) : "-"}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
