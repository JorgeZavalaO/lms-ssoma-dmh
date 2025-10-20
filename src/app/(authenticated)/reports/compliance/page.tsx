"use client"

import React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Download, AlertCircle, CheckCircle, Clock } from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

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
  const [loading, setLoading] = React.useState(true)
  const [summary, setSummary] = React.useState({
    totalCollaborators: 0,
    totalCourses: 0,
    compliant: 0,
    expiringSoon: 0,
    expired: 0,
  })

  React.useEffect(() => {
    loadComplianceReport()
  }, [])

  const loadComplianceReport = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/reports/compliance")
      if (!res.ok) throw new Error("Error loading compliance report")
      
      const data = await res.json()
      setMatrix(data.matrix)
      setSummary(data.summary)
    } catch (error) {
      console.error("Error loading compliance report:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Reporte de Cumplimiento SSOMA</h1>
          <p className="text-muted-foreground">
            Matriz de cursos obligatorios por colaborador con semáforo de vigencia
          </p>
        </div>
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Exportar PDF
        </Button>
      </div>

      {/* Resumen */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Colaboradores</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalCollaborators}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Cumplen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{summary.compliant}</div>
            <p className="text-xs text-muted-foreground">
              {summary.totalCollaborators > 0 
                ? ((summary.compliant / summary.totalCollaborators) * 100).toFixed(1)
                : 0}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Por Vencer</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{summary.expiringSoon}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Vencidos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{summary.expired}</div>
          </CardContent>
        </Card>
      </div>

      {/* Matriz de Cumplimiento */}
      <Card>
        <CardHeader>
          <CardTitle>Matriz de Cumplimiento</CardTitle>
          <CardDescription>
            {summary.totalCourses} cursos obligatorios
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Cargando matriz...</div>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[200px]">Colaborador</TableHead>
                    <TableHead>Área</TableHead>
                    <TableHead>Puesto</TableHead>
                    {matrix[0]?.courses.map((course) => (
                      <TableHead key={course.courseId} className="min-w-[120px] text-center">
                        {course.courseName}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {matrix.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3 + (matrix[0]?.courses.length || 0)} className="text-center text-muted-foreground">
                        No se encontraron registros
                      </TableCell>
                    </TableRow>
                  ) : (
                    matrix.map((record) => (
                      <TableRow key={record.collaboratorId}>
                        <TableCell className="font-medium">{record.fullName}</TableCell>
                        <TableCell>{record.area || "-"}</TableCell>
                        <TableCell>{record.position || "-"}</TableCell>
                        {record.courses.map((course) => (
                          <TableCell key={course.courseId} className="text-center">
                            <div className="flex flex-col items-center gap-1">
                              {getComplianceIcon(course.status)}
                              {course.daysUntilExpiration !== null && course.daysUntilExpiration >= 0 && (
                                <span className="text-xs text-muted-foreground">
                                  {course.daysUntilExpiration}d
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
          )}
        </CardContent>
      </Card>

      {/* Leyenda */}
      <Card>
        <CardHeader>
          <CardTitle>Leyenda de Semáforo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 md:grid-cols-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm">Cumple (verde)</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-yellow-600" />
              <span className="text-sm">Por vencer ≤30 días (amarillo)</span>
            </div>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <span className="text-sm">Vencido (rojo)</span>
            </div>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <span className="text-sm">No inscrito (rojo)</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
