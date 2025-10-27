"use client"

import React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { 
  Download, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  Filter, 
  Search,
  RefreshCw,
  FileText,
  TrendingUp,
  Users,
  AlertTriangle,
  ChevronLeft,
  ChevronRight
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

const getComplianceIcon = (status: string) => {
  switch (status) {
    case "COMPLIANT":
      return <CheckCircle className="h-4 w-4 text-green-600" />
    case "EXPIRING_SOON":
      return <Clock className="h-4 w-4 text-yellow-600" />
    case "EXPIRED":
    case "NOT_ENROLLED":
      return <AlertCircle className="h-4 w-4 text-red-600" />
    default:
      return null
  }
}

const getComplianceBadge = (status: string) => {
  const config: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
    COMPLIANT: { variant: "default", label: "Cumple" },
    EXPIRING_SOON: { variant: "secondary", label: "Por vencer" },
    EXPIRED: { variant: "destructive", label: "Vencido" },
    NOT_ENROLLED: { variant: "outline", label: "No inscrito" },
  }
  const item = config[status] || { variant: "outline", label: status }
  return <Badge variant={item.variant}>{item.label}</Badge>
}

export default function ComplianceReportPage() {
  const [matrix, setMatrix] = React.useState<ComplianceMatrixRecord[]>([])
  const [filteredMatrix, setFilteredMatrix] = React.useState<ComplianceMatrixRecord[]>([])
  const [loading, setLoading] = React.useState(true)
  const [summary, setSummary] = React.useState({
    totalCollaborators: 0,
    totalCourses: 0,
    compliant: 0,
    expiringSoon: 0,
    expired: 0,
  })

  // Filtros
  const [searchTerm, setSearchTerm] = React.useState("")
  const [areaFilter, setAreaFilter] = React.useState<string>("all")
  const [statusFilter, setStatusFilter] = React.useState<string>("all")
  const [areas, setAreas] = React.useState<string[]>([])

  // Paginación
  const [currentPage, setCurrentPage] = React.useState(1)
  const itemsPerPage = 10

  React.useEffect(() => {
    loadComplianceReport()
  }, [])

  React.useEffect(() => {
    applyFilters()
  }, [matrix, searchTerm, areaFilter, statusFilter])

  const loadComplianceReport = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/reports/compliance")
      if (!res.ok) throw new Error("Error loading compliance report")
      
      const data = await res.json()
      setMatrix(data.matrix)
      setSummary(data.summary)

      // Extraer áreas únicas
      const uniqueAreas = Array.from(
        new Set(data.matrix.map((r: ComplianceMatrixRecord) => r.area).filter(Boolean))
      ) as string[]
      setAreas(uniqueAreas)
    } catch (error) {
      console.error("Error loading compliance report:", error)
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = [...matrix]

    // Filtro de búsqueda
    if (searchTerm) {
      filtered = filtered.filter(
        (record) =>
          record.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          record.position?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          record.area?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filtro por área
    if (areaFilter !== "all") {
      filtered = filtered.filter((record) => record.area === areaFilter)
    }

    // Filtro por estado
    if (statusFilter !== "all") {
      filtered = filtered.filter((record) => {
        const hasStatus = record.courses.some((course) => {
          if (statusFilter === "non-compliant") {
            return course.status === "EXPIRED" || course.status === "NOT_ENROLLED"
          }
          return course.status === statusFilter.toUpperCase()
        })
        return hasStatus
      })
    }

    setFilteredMatrix(filtered)
    setCurrentPage(1) // Reset a primera página al filtrar
  }

  const clearFilters = () => {
    setSearchTerm("")
    setAreaFilter("all")
    setStatusFilter("all")
  }

  // Paginación
  const totalPages = Math.ceil(filteredMatrix.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentData = filteredMatrix.slice(startIndex, endIndex)

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)))
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reporte de Cumplimiento SSOMA</h1>
          <p className="text-muted-foreground mt-1">
            Matriz de cursos obligatorios por colaborador con semáforo de vigencia
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={loadComplianceReport} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Actualizar
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exportar PDF
          </Button>
        </div>
      </div>

      {/* KPIs Mejorados */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Colaboradores
              </CardTitle>
              <Users className="h-4 w-4 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{summary.totalCollaborators}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {summary.totalCourses} cursos obligatorios
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Cumplen Requisitos
              </CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{summary.compliant}</div>
            <div className="flex items-center gap-2 mt-2">
              <Progress 
                value={summary.totalCollaborators > 0 
                  ? (summary.compliant / summary.totalCollaborators) * 100
                  : 0
                } 
                className="h-2"
              />
              <span className="text-xs font-medium text-green-600">
                {summary.totalCollaborators > 0 
                  ? ((summary.compliant / summary.totalCollaborators) * 100).toFixed(1)
                  : 0}%
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-yellow-500">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Por Vencer (≤30d)
              </CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600">{summary.expiringSoon}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Requieren renovación pronto
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Vencidos/No Inscritos
              </CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{summary.expired}</div>
            <p className="text-xs text-red-600 mt-1 font-medium">
              ⚠️ Acción inmediata requerida
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs: Matriz y Dashboard */}
      <Tabs defaultValue="matrix" className="space-y-4">
        <TabsList>
          <TabsTrigger value="matrix" className="gap-2">
            <FileText className="h-4 w-4" />
            Matriz de Cumplimiento
          </TabsTrigger>
          <TabsTrigger value="dashboard" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            Dashboard Analítico
          </TabsTrigger>
        </TabsList>

        <TabsContent value="matrix" className="space-y-4">
          {/* Filtros */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  <CardTitle>Filtros</CardTitle>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={clearFilters}
                  className="text-muted-foreground hover:text-foreground"
                >
                  Limpiar filtros
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="search">Buscar Colaborador</Label>
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="search"
                      placeholder="Nombre, puesto o área..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="area">Filtrar por Área</Label>
                  <Select value={areaFilter} onValueChange={setAreaFilter}>
                    <SelectTrigger id="area">
                      <SelectValue placeholder="Todas las áreas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas las áreas</SelectItem>
                      {areas.map((area) => (
                        <SelectItem key={area} value={area}>
                          {area}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Filtrar por Estado</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger id="status">
                      <SelectValue placeholder="Todos los estados" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los estados</SelectItem>
                      <SelectItem value="compliant">✅ Cumplen</SelectItem>
                      <SelectItem value="expiring_soon">⏰ Por vencer</SelectItem>
                      <SelectItem value="non-compliant">🔴 Vencidos/No inscritos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Contador de resultados */}
              <div className="mt-4 text-sm text-muted-foreground">
                Mostrando <span className="font-medium text-foreground">{filteredMatrix.length}</span> de{" "}
                <span className="font-medium text-foreground">{matrix.length}</span> colaboradores
              </div>
            </CardContent>
          </Card>

          {/* Matriz de Cumplimiento */}
          <Card>
            <CardHeader>
              <CardTitle>Matriz de Cumplimiento Detallada</CardTitle>
              <CardDescription>
                Vista panorámica del cumplimiento por colaborador y curso
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                  <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Cargando matriz de cumplimiento...</p>
                </div>
              ) : (
                <>
                  <div className="rounded-md border overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead className="min-w-[200px] font-semibold">Colaborador</TableHead>
                          <TableHead className="font-semibold">Área</TableHead>
                          <TableHead className="font-semibold">Puesto</TableHead>
                          {matrix[0]?.courses.map((course) => (
                            <TableHead 
                              key={course.courseId} 
                              className="min-w-[120px] text-center font-semibold"
                            >
                              <div className="flex flex-col items-center gap-1">
                                <span className="text-xs leading-tight">{course.courseName}</span>
                                {course.isRequired && (
                                  <Badge variant="outline" className="text-[10px] h-4 px-1">
                                    Obligatorio
                                  </Badge>
                                )}
                              </div>
                            </TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {currentData.length === 0 ? (
                          <TableRow>
                            <TableCell 
                              colSpan={3 + (matrix[0]?.courses.length || 0)} 
                              className="text-center text-muted-foreground py-12"
                            >
                              <div className="flex flex-col items-center gap-2">
                                <Search className="h-8 w-8 text-muted-foreground/50" />
                                <p>No se encontraron registros con los filtros aplicados</p>
                              </div>
                            </TableCell>
                          </TableRow>
                        ) : (
                          currentData.map((record) => (
                            <TableRow key={record.collaboratorId} className="hover:bg-muted/50">
                              <TableCell className="font-medium">{record.fullName}</TableCell>
                              <TableCell>
                                <Badge variant="outline" className="text-xs">
                                  {record.area || "Sin área"}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {record.position || "-"}
                              </TableCell>
                              {record.courses.map((course) => (
                                <TableCell key={course.courseId} className="text-center">
                                  <div className="flex flex-col items-center gap-1">
                                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted">
                                      {getComplianceIcon(course.status)}
                                    </div>
                                    {course.daysUntilExpiration !== null && course.daysUntilExpiration >= 0 && (
                                      <span className="text-[10px] font-medium text-muted-foreground">
                                        {course.daysUntilExpiration}d
                                      </span>
                                    )}
                                    {course.status === "NOT_ENROLLED" && (
                                      <span className="text-[10px] font-medium text-red-600">
                                        No inscrito
                                      </span>
                                    )}
                                  </div>
                                </TableCell>
                              ))}
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Paginación */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-4">
                      <p className="text-sm text-muted-foreground">
                        Página {currentPage} de {totalPages}
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => goToPage(currentPage - 1)}
                          disabled={currentPage === 1}
                        >
                          <ChevronLeft className="h-4 w-4" />
                          Anterior
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => goToPage(currentPage + 1)}
                          disabled={currentPage === totalPages}
                        >
                          Siguiente
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="dashboard" className="space-y-4">
          {/* Dashboard Analítico */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Distribución de Cumplimiento</CardTitle>
                <CardDescription>Por estado de certificación</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm">Cumplen</span>
                    </div>
                    <span className="text-sm font-medium">{summary.compliant}</span>
                  </div>
                  <Progress 
                    value={summary.totalCollaborators > 0 
                      ? (summary.compliant / summary.totalCollaborators) * 100
                      : 0
                    } 
                    className="h-2 bg-green-100"
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-yellow-600" />
                      <span className="text-sm">Por vencer</span>
                    </div>
                    <span className="text-sm font-medium">{summary.expiringSoon}</span>
                  </div>
                  <Progress 
                    value={summary.totalCollaborators > 0 
                      ? (summary.expiringSoon / summary.totalCollaborators) * 100
                      : 0
                    } 
                    className="h-2 bg-yellow-100"
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-red-600" />
                      <span className="text-sm">Vencidos/No inscritos</span>
                    </div>
                    <span className="text-sm font-medium">{summary.expired}</span>
                  </div>
                  <Progress 
                    value={summary.totalCollaborators > 0 
                      ? (summary.expired / summary.totalCollaborators) * 100
                      : 0
                    } 
                    className="h-2 bg-red-100"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Cumplimiento por Área</CardTitle>
                <CardDescription>Porcentaje de cumplimiento por departamento</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {areas.slice(0, 5).map((area) => {
                    const areaData = matrix.filter((r) => r.area === area)
                    const compliantInArea = areaData.filter((r) =>
                      r.courses.every((c) => c.status === "COMPLIANT")
                    ).length
                    const complianceRate = areaData.length > 0 
                      ? (compliantInArea / areaData.length) * 100 
                      : 0

                    return (
                      <div key={area} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium truncate">{area}</span>
                          <span className="text-muted-foreground ml-2">
                            {complianceRate.toFixed(0)}%
                          </span>
                        </div>
                        <Progress value={complianceRate} className="h-2" />
                      </div>
                    )
                  })}
                  {areas.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No hay datos de áreas disponibles
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Leyenda Mejorada */}
      <Card>
        <CardHeader>
          <CardTitle>Leyenda de Semáforo de Cumplimiento</CardTitle>
          <CardDescription>
            Sistema de indicadores visuales para monitoreo rápido
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-green-50 border border-green-200">
              <div className="flex-shrink-0 mt-0.5">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-green-900">Cumple</p>
                <p className="text-xs text-green-700 mt-1">
                  Certificación vigente y actualizada
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg bg-yellow-50 border border-yellow-200">
              <div className="flex-shrink-0 mt-0.5">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="font-medium text-yellow-900">Por vencer</p>
                <p className="text-xs text-yellow-700 mt-1">
                  Vence en 30 días o menos. Programar renovación
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg bg-red-50 border border-red-200">
              <div className="flex-shrink-0 mt-0.5">
                <AlertCircle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="font-medium text-red-900">Vencido</p>
                <p className="text-xs text-red-700 mt-1">
                  Certificación expirada. Acción inmediata
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 border border-gray-200">
              <div className="flex-shrink-0 mt-0.5">
                <AlertCircle className="h-5 w-5 text-gray-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">No inscrito</p>
                <p className="text-xs text-gray-700 mt-1">
                  Sin registro en el curso obligatorio
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
