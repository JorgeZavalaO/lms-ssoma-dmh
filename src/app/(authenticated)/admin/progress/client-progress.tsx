"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CheckCircle, Clock, AlertCircle, Search, Download, RefreshCw, Award } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"

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
  status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED" | "FAILED" | "EXEMPT"
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
}

const statusConfig = {
  NOT_STARTED: { label: "No Iniciado", color: "bg-slate-500", icon: Clock },
  IN_PROGRESS: { label: "En Progreso", color: "bg-blue-500", icon: Clock },
  COMPLETED: { label: "Completado", color: "bg-emerald-500", icon: CheckCircle },
  FAILED: { label: "Fallido", color: "bg-red-500", icon: AlertCircle },
  EXEMPT: { label: "Exento", color: "bg-purple-500", icon: CheckCircle },
}

export function ClientProgress() {
  const [progressList, setProgressList] = useState<CourseProgress[]>([])
  const [stats, setStats] = useState<ProgressStats>({
    total: 0,
    inProgress: 0,
    completed: 0,
    notStarted: 0,
    failed: 0,
    exempt: 0,
  })
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  useEffect(() => {
    loadProgress()
  }, [])

  const loadProgress = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/progress/courses")
      if (response.ok) {
        const data = await response.json()
        setProgressList(data.progress || [])
        calculateStats(data.progress || [])
      }
    } catch (error) {
      console.error("Error loading progress:", error)
    } finally {
      setLoading(false)
    }
  }

  const calculateStats = (progress: CourseProgress[]) => {
    const stats: ProgressStats = {
      total: progress.length,
      inProgress: progress.filter(p => p.status === "IN_PROGRESS").length,
      completed: progress.filter(p => p.status === "COMPLETED").length,
      notStarted: progress.filter(p => p.status === "NOT_STARTED").length,
      failed: progress.filter(p => p.status === "FAILED").length,
      exempt: progress.filter(p => p.status === "EXEMPT").length,
    }
    setStats(stats)
  }

  const filteredProgress = progressList.filter(progress => {
    const matchesSearch = 
      progress.collaborator.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      progress.collaborator.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      progress.collaborator.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      progress.course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (progress.course.code?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)
    
    const matchesStatus = statusFilter === "all" || progress.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const exportToCSV = () => {
    const headers = ["Colaborador", "Email", "Curso", "Código", "Estado", "Progreso %", "Fecha Inicio", "Fecha Completado"]
    const rows = filteredProgress.map(p => [
      `${p.collaborator.firstName} ${p.collaborator.lastName}`,
      p.collaborator.email,
      p.course.name,
      p.course.code,
      statusConfig[p.status].label,
      p.progress.toString(),
      p.startedAt ? format(new Date(p.startedAt), "dd/MM/yyyy", { locale: es }) : "N/A",
      p.completedAt ? format(new Date(p.completedAt), "dd/MM/yyyy", { locale: es }) : "N/A",
    ])

    const csvContent = [headers, ...rows].map(row => row.join(",")).join("\n")
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = `progreso-${format(new Date(), "yyyy-MM-dd")}.csv`
    link.click()
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
        <Button onClick={loadProgress} variant="outline" disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Actualizar
        </Button>
        <Button onClick={exportToCSV} variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Exportar CSV
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
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
                  placeholder="Buscar por colaborador, email o curso..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Filtrar por estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="NOT_STARTED">No Iniciado</SelectItem>
                <SelectItem value="IN_PROGRESS">En Progreso</SelectItem>
                <SelectItem value="COMPLETED">Completado</SelectItem>
                <SelectItem value="FAILED">Fallido</SelectItem>
                <SelectItem value="EXEMPT">Exento</SelectItem>
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
                ) : filteredProgress.length === 0 ? (
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
                  filteredProgress.map((progress) => {
                    const config = statusConfig[progress.status]
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
        </CardContent>
      </Card>
    </div>
  )
}
