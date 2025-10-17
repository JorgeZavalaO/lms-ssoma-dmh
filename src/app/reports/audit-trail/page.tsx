"use client"

import React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Download, Search } from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { format } from "date-fns"
import { es } from "date-fns/locale"

interface AuditTrailRecord {
  attemptId: string
  collaboratorId: string
  collaboratorName: string
  collaboratorDNI: string
  courseId: string
  courseName: string
  quizId: string
  quizTitle: string
  startedAt: Date
  completedAt: Date | null
  duration: number | null
  score: number | null
  passed: boolean | null
  status: string
  answersCount: number
  ipAddress: string | null
  userAgent: string | null
}

export default function AuditTrailPage() {
  const [records, setRecords] = React.useState<AuditTrailRecord[]>([])
  const [loading, setLoading] = React.useState(true)
  const [searchTerm, setSearchTerm] = React.useState("")
  const [filteredRecords, setFilteredRecords] = React.useState<AuditTrailRecord[]>([])

  React.useEffect(() => {
    loadAuditTrail()
  }, [])

  React.useEffect(() => {
    if (searchTerm) {
      const filtered = records.filter(
        (r) =>
          r.collaboratorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          r.collaboratorDNI.includes(searchTerm) ||
          r.courseName.toLowerCase().includes(searchTerm.toLowerCase())
      )
      setFilteredRecords(filtered)
    } else {
      setFilteredRecords(records)
    }
  }, [searchTerm, records])

  const loadAuditTrail = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/reports/audit-trail")
      if (!res.ok) throw new Error("Error loading audit trail")
      
      const data = await res.json()
      setRecords(data.records)
      setFilteredRecords(data.records)
    } catch (error) {
      console.error("Error loading audit trail:", error)
    } finally {
      setLoading(false)
    }
  }

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "-"
    const minutes = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${minutes}m ${secs}s`
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Trazabilidad de Evaluaciones</h1>
          <p className="text-muted-foreground">
            Historial completo de intentos de evaluación para auditorías
          </p>
        </div>
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Exportar CSV
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Búsqueda</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por DNI, nombre o curso..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resultados */}
      <Card>
        <CardHeader>
          <CardTitle>Registros de Auditoría ({filteredRecords.length})</CardTitle>
          <CardDescription>
            Historial de {records.length} intentos totales
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Cargando registros...</div>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha/Hora</TableHead>
                    <TableHead>DNI</TableHead>
                    <TableHead>Colaborador</TableHead>
                    <TableHead>Curso</TableHead>
                    <TableHead>Evaluación</TableHead>
                    <TableHead>Duración</TableHead>
                    <TableHead>Calificación</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Respuestas</TableHead>
                    <TableHead>IP</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecords.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center text-muted-foreground">
                        No se encontraron registros
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredRecords.map((record) => (
                      <TableRow key={record.attemptId}>
                        <TableCell className="whitespace-nowrap">
                          {format(new Date(record.startedAt), "dd/MM/yyyy HH:mm", { locale: es })}
                        </TableCell>
                        <TableCell>{record.collaboratorDNI}</TableCell>
                        <TableCell className="font-medium">{record.collaboratorName}</TableCell>
                        <TableCell>{record.courseName}</TableCell>
                        <TableCell>{record.quizTitle}</TableCell>
                        <TableCell>{formatDuration(record.duration)}</TableCell>
                        <TableCell>
                          {record.score !== null ? (
                            <span className={record.score >= 70 ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
                              {record.score.toFixed(1)}
                            </span>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={record.status === "COMPLETED" ? "default" : "secondary"}>
                            {record.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">{record.answersCount}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {record.ipAddress || "-"}
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

      {/* Información adicional */}
      <Card>
        <CardHeader>
          <CardTitle>Información de Auditoría</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm space-y-2">
            <p>
              <strong>Propósito:</strong> Este reporte registra todos los intentos de evaluación realizados en el sistema,
              incluyendo fecha, hora, IP de origen y respuestas seleccionadas.
            </p>
            <p>
              <strong>Retención:</strong> Los registros se mantienen de forma indefinida para auditorías y cumplimiento normativo.
            </p>
            <p>
              <strong>Privacidad:</strong> La información de IP se registra únicamente con fines de seguridad y auditoría.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
