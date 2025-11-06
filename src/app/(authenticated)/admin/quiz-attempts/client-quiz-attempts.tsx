"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { FileText, Download, Search, Filter } from "lucide-react"
import { toast } from "sonner"
import { format } from "date-fns"
import { es } from "date-fns/locale"

interface QuizAttempt {
  id: string
  attemptNumber: number
  status: string
  score: number | null
  pointsEarned: number | null
  pointsTotal: number | null
  startedAt: string
  submittedAt: string | null
  collaborator: {
    fullName: string
    dni: string
    email: string
  }
  quiz: {
    title: string
    passingScore: number
    course: {
      name: string
      code: string | null
    } | null
  }
}

export function ClientQuizAttempts({ attempts: initialAttempts }: { attempts: QuizAttempt[] }) {
  const [filteredAttempts, setFilteredAttempts] = useState<QuizAttempt[]>(initialAttempts)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [downloading, setDownloading] = useState<string | null>(null)

  useEffect(() => {
    let filtered = initialAttempts

    // Filtrar por búsqueda
    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (attempt) =>
          attempt.collaborator.fullName.toLowerCase().includes(search) ||
          attempt.collaborator.dni.toLowerCase().includes(search) ||
          attempt.collaborator.email.toLowerCase().includes(search) ||
          attempt.quiz.title.toLowerCase().includes(search) ||
          attempt.quiz.course?.name.toLowerCase().includes(search)
      )
    }

    // Filtrar por estado
    if (statusFilter !== "all") {
      filtered = filtered.filter((attempt) => attempt.status === statusFilter)
    }

    setFilteredAttempts(filtered)
  }, [searchTerm, statusFilter, initialAttempts])

  const handleDownloadPDF = async (attemptId: string, collaboratorName: string) => {
    try {
      setDownloading(attemptId)
      
      const response = await fetch(`/api/attempts/${attemptId}/export-pdf`)
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error al descargar el PDF')
      }

      // Descargar el archivo
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `evaluacion_${collaboratorName.replace(/\s+/g, '_')}_${attemptId}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast.success('PDF descargado exitosamente')
    } catch (error) {
      console.error('Error descargando PDF:', error)
      toast.error(error instanceof Error ? error.message : 'Error al descargar el PDF')
    } finally {
      setDownloading(null)
    }
  }

  const getStatusBadge = (status: string, score: number | null, passingScore: number) => {
    switch (status) {
      case 'IN_PROGRESS':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">En Progreso</Badge>
      case 'SUBMITTED':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Enviado</Badge>
      case 'GRADED':
        if (score !== null && score >= passingScore) {
          return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Aprobado</Badge>
        }
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Desaprobado</Badge>
      case 'PASSED':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Aprobado</Badge>
      case 'FAILED':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Desaprobado</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Intentos de Evaluaciones
          </CardTitle>
          <CardDescription>
            Visualiza y descarga los intentos de evaluaciones de todos los colaboradores
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filtros */}
          <div className="flex gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por colaborador, DNI, email, curso o evaluación..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[200px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="IN_PROGRESS">En Progreso</SelectItem>
                <SelectItem value="SUBMITTED">Enviado</SelectItem>
                <SelectItem value="GRADED">Calificado</SelectItem>
                <SelectItem value="PASSED">Aprobado</SelectItem>
                <SelectItem value="FAILED">Desaprobado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Tabla */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Colaborador</TableHead>
                  <TableHead>Evaluación</TableHead>
                  <TableHead>Curso</TableHead>
                  <TableHead className="text-center">Intento</TableHead>
                  <TableHead className="text-center">Puntuación</TableHead>
                  <TableHead className="text-center">Estado</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAttempts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No se encontraron intentos de evaluación
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAttempts.map((attempt) => (
                    <TableRow key={attempt.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{attempt.collaborator.fullName}</span>
                          <span className="text-xs text-muted-foreground">{attempt.collaborator.dni}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs">
                          <span className="text-sm">{attempt.quiz.title}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs">
                          {attempt.quiz.course && (
                            <div className="flex flex-col">
                              {attempt.quiz.course.code && (
                                <span className="text-xs text-muted-foreground">
                                  {attempt.quiz.course.code}
                                </span>
                              )}
                              <span className="text-sm">{attempt.quiz.course.name}</span>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline">#{attempt.attemptNumber}</Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        {attempt.score !== null ? (
                          <div className="flex flex-col items-center">
                            <span className="font-medium">{attempt.score.toFixed(1)}%</span>
                            <span className="text-xs text-muted-foreground">
                              {attempt.pointsEarned}/{attempt.pointsTotal} pts
                            </span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {getStatusBadge(attempt.status, attempt.score, attempt.quiz.passingScore)}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col text-sm">
                          <span>
                            {format(new Date(attempt.startedAt), "d MMM yyyy", { locale: es })}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(attempt.startedAt), "HH:mm", { locale: es })}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownloadPDF(attempt.id, attempt.collaborator.fullName)}
                          disabled={downloading === attempt.id || attempt.status === 'IN_PROGRESS'}
                          title={attempt.status === 'IN_PROGRESS' ? 'No se puede descargar un intento en progreso' : 'Descargar PDF'}
                        >
                          {downloading === attempt.id ? (
                            <>
                              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent mr-2" />
                              Descargando...
                            </>
                          ) : (
                            <>
                              <Download className="h-4 w-4 mr-2" />
                              PDF
                            </>
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Resumen */}
          <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
            <span>
              Mostrando {filteredAttempts.length} de {initialAttempts.length} intentos
            </span>
            <div className="flex gap-4">
              <span>
                Aprobados:{" "}
                {initialAttempts.filter((a) => a.status === 'PASSED' || (a.score !== null && a.score >= a.quiz.passingScore)).length}
              </span>
              <span>
                Desaprobados:{" "}
                {initialAttempts.filter((a) => a.status === 'FAILED' || (a.score !== null && a.score < a.quiz.passingScore)).length}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
