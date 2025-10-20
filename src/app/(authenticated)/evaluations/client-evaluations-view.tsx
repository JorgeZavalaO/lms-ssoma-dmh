"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import {
  Clock,
  Trophy,
  CheckCircle,
  XCircle,
  AlertCircle,
  PlayCircle,
  BarChart3,
  Calendar,
  Target,
  TrendingUp,
  FileText,
  Award,
} from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import Link from "next/link"

interface Quiz {
  id: string
  title: string
  description: string | null
  passingScore: number
  maxAttempts: number | null
  timeLimit: number | null
  courseId: string
  courseName: string
  enrollmentId: string
}

interface Attempt {
  id: string
  quizId: string
  attemptNumber: number
  status: "IN_PROGRESS" | "SUBMITTED" | "GRADED" | "PASSED" | "FAILED"
  score: number | null
  startedAt: string
  completedAt: string | null
  timeSpent: number | null
  requiresRemediation: boolean
  remediationCompleted: boolean
  quiz: {
    id: string
    title: string
    passingScore: number
    course: {
      id: string
      name: string
    }
  }
}

interface ClientEvaluationsViewProps {
  quizzes: Quiz[]
  attempts: Attempt[]
  collaboratorId: string
}

const statusConfig = {
  IN_PROGRESS: {
    label: "En Progreso",
    color: "bg-blue-500",
    icon: PlayCircle,
    variant: "secondary" as const,
  },
  SUBMITTED: {
    label: "Enviado",
    color: "bg-purple-500",
    icon: FileText,
    variant: "secondary" as const,
  },
  GRADED: {
    label: "Calificado",
    color: "bg-indigo-500",
    icon: BarChart3,
    variant: "secondary" as const,
  },
  PASSED: {
    label: "Aprobado",
    color: "bg-green-500",
    icon: CheckCircle,
    variant: "default" as const,
  },
  FAILED: {
    label: "Reprobado",
    color: "bg-red-500",
    icon: XCircle,
    variant: "destructive" as const,
  },
}

export function ClientEvaluationsView({ quizzes, attempts, collaboratorId }: ClientEvaluationsViewProps) {
  const [activeTab, setActiveTab] = useState("disponibles")

  // Estadísticas por quiz
  const quizStats = quizzes.map((quiz) => {
    const quizAttempts = attempts.filter((a) => a.quizId === quiz.id)
    const completedAttempts = quizAttempts.filter((a) => a.status === "PASSED" || a.status === "FAILED")
    const inProgressAttempt = quizAttempts.find((a) => a.status === "IN_PROGRESS")
    const bestAttempt = completedAttempts.sort((a, b) => (b.score || 0) - (a.score || 0))[0]
    const lastAttempt = quizAttempts[0]
    const isPassed = bestAttempt?.status === "PASSED"
    const attemptsUsed = quizAttempts.length
    const attemptsRemaining = quiz.maxAttempts ? quiz.maxAttempts - attemptsUsed : Infinity
    const canAttempt = !inProgressAttempt && (attemptsRemaining > 0 || attemptsRemaining === Infinity)

    return {
      quiz,
      attempts: quizAttempts,
      completedAttempts,
      inProgressAttempt,
      bestAttempt,
      lastAttempt,
      isPassed,
      attemptsUsed,
      attemptsRemaining,
      canAttempt,
    }
  })

  // Filtrar quizzes según el tab activo
  const disponibles = quizStats.filter((s) => s.canAttempt && !s.isPassed)
  const enProgreso = quizStats.filter((s) => s.inProgressAttempt)
  const completadas = quizStats.filter((s) => s.isPassed)
  const reprobadas = quizStats.filter((s) => !s.isPassed && !s.canAttempt && s.lastAttempt?.status === "FAILED")

  // Estadísticas generales
  const stats = {
    total: quizzes.length,
    disponibles: disponibles.length,
    enProgreso: enProgreso.length,
    aprobadas: completadas.length,
    reprobadas: reprobadas.length,
    totalIntentos: attempts.length,
    promedioNotas: attempts.filter((a) => a.score !== null).length > 0
      ? Math.round(
          attempts
            .filter((a) => a.score !== null)
            .reduce((sum, a) => sum + (a.score || 0), 0) /
            attempts.filter((a) => a.score !== null).length
        )
      : 0,
  }

  const formatTimeLimit = (minutes: number | null) => {
    if (!minutes) return "Sin límite"
    if (minutes < 60) return `${minutes} min`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Mis Evaluaciones</h1>
        <p className="text-muted-foreground mt-2">
          Gestiona tus evaluaciones, consulta resultados y realiza intentos
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Trophy className="h-4 w-4 text-purple-500" />
              Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground mt-1">Evaluaciones asignadas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              Aprobadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.aprobadas}</div>
            <p className="text-xs text-muted-foreground mt-1">Evaluaciones superadas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <PlayCircle className="h-4 w-4 text-blue-500" />
              En Progreso
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.enProgreso}</div>
            <p className="text-xs text-muted-foreground mt-1">Intentos activos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-orange-500" />
              Promedio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.promedioNotas}%</div>
            <p className="text-xs text-muted-foreground mt-1">Nota promedio</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="disponibles">
            Disponibles ({stats.disponibles})
          </TabsTrigger>
          <TabsTrigger value="en-progreso">
            En Progreso ({stats.enProgreso})
          </TabsTrigger>
          <TabsTrigger value="completadas">
            Aprobadas ({stats.aprobadas})
          </TabsTrigger>
          <TabsTrigger value="historial">
            Historial Completo
          </TabsTrigger>
        </TabsList>

        {/* TAB: Evaluaciones Disponibles */}
        <TabsContent value="disponibles" className="mt-6">
          {disponibles.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Trophy className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No hay evaluaciones disponibles</h3>
                <p className="text-muted-foreground">
                  Has completado todas las evaluaciones o no hay intentos disponibles
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {disponibles.map(({ quiz, attemptsUsed, attemptsRemaining, lastAttempt }) => (
                <Card key={quiz.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="flex items-center gap-2">
                          <Trophy className="h-5 w-5 text-purple-600" />
                          {quiz.title}
                        </CardTitle>
                        <CardDescription className="mt-2">
                          {quiz.description || "Sin descripción"}
                        </CardDescription>
                        <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                          <FileText className="h-4 w-4" />
                          <span>Curso: {quiz.courseName}</span>
                        </div>
                      </div>
                      {lastAttempt?.status === "FAILED" && (
                        <Badge variant="destructive">Reintento necesario</Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Información clave */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-3 bg-accent rounded-lg">
                        <div className="text-2xl font-bold text-primary">{quiz.passingScore}%</div>
                        <p className="text-xs text-muted-foreground mt-1">Nota mínima</p>
                      </div>
                      <div className="text-center p-3 bg-accent rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">
                          {formatTimeLimit(quiz.timeLimit)}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Tiempo límite</p>
                      </div>
                      <div className="text-center p-3 bg-accent rounded-lg">
                        <div className="text-2xl font-bold text-orange-600">
                          {attemptsRemaining === Infinity ? "∞" : attemptsRemaining}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Intentos disponibles</p>
                      </div>
                      <div className="text-center p-3 bg-accent rounded-lg">
                        <div className="text-2xl font-bold text-purple-600">{attemptsUsed}</div>
                        <p className="text-xs text-muted-foreground mt-1">Intentos usados</p>
                      </div>
                    </div>

                    {/* Último intento si falló */}
                    {lastAttempt && lastAttempt.status === "FAILED" && (
                      <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm">
                        <XCircle className="h-4 w-4 text-red-600" />
                        <span className="text-red-900">
                          Último intento: <strong>{lastAttempt.score}%</strong> - No alcanzaste la nota mínima
                        </span>
                      </div>
                    )}

                    {/* Botón de acción */}
                    <Link href={`/courses/${quiz.courseId}/quiz/${quiz.id}`}>
                      <Button className="w-full" size="lg">
                        <PlayCircle className="h-4 w-4 mr-2" />
                        {lastAttempt?.status === "FAILED" ? "Reintentar Evaluación" : "Iniciar Evaluación"}
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* TAB: En Progreso */}
        <TabsContent value="en-progreso" className="mt-6">
          {enProgreso.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <PlayCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No hay evaluaciones en progreso</h3>
                <p className="text-muted-foreground">Inicia una evaluación disponible para comenzar</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {enProgreso.map(({ quiz, inProgressAttempt }) => {
                if (!inProgressAttempt) return null

                const elapsed = Math.floor(
                  (new Date().getTime() - new Date(inProgressAttempt.startedAt).getTime()) / 1000 / 60
                )
                const timeRemaining = quiz.timeLimit ? quiz.timeLimit - elapsed : null

                return (
                  <Card key={quiz.id} className="border-blue-500 border-2">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="flex items-center gap-2">
                            <PlayCircle className="h-5 w-5 text-blue-600 animate-pulse" />
                            {quiz.title}
                          </CardTitle>
                          <CardDescription className="mt-2">
                            Intento #{inProgressAttempt.attemptNumber} en progreso
                          </CardDescription>
                        </div>
                        <Badge className="bg-blue-500">En Progreso</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <div className="text-center p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <Clock className="h-6 w-6 mx-auto mb-2 text-blue-600" />
                          <div className="font-bold text-blue-900">
                            {timeRemaining !== null
                              ? `${timeRemaining} min restantes`
                              : "Sin límite"}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">Tiempo</p>
                        </div>
                        <div className="text-center p-3 bg-accent rounded-lg">
                          <Calendar className="h-6 w-6 mx-auto mb-2 text-purple-600" />
                          <div className="font-bold">
                            {format(new Date(inProgressAttempt.startedAt), "HH:mm", { locale: es })}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">Hora de inicio</p>
                        </div>
                        <div className="text-center p-3 bg-accent rounded-lg">
                          <Target className="h-6 w-6 mx-auto mb-2 text-orange-600" />
                          <div className="font-bold">{quiz.passingScore}%</div>
                          <p className="text-xs text-muted-foreground mt-1">Nota mínima</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm">
                        <AlertCircle className="h-4 w-4 text-amber-600" />
                        <span className="text-amber-900">
                          Recuerda guardar tus respuestas frecuentemente para no perder tu progreso
                        </span>
                      </div>

                      <Link href={`/courses/${quiz.courseId}/quiz/${quiz.id}`}>
                        <Button className="w-full" size="lg" variant="default">
                          <PlayCircle className="h-4 w-4 mr-2" />
                          Continuar Evaluación
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>

        {/* TAB: Completadas (Aprobadas) */}
        <TabsContent value="completadas" className="mt-6">
          {completadas.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <CheckCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No hay evaluaciones aprobadas</h3>
                <p className="text-muted-foreground">Completa tus evaluaciones para verlas aquí</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {completadas.map(({ quiz, bestAttempt, attemptsUsed }) => {
                if (!bestAttempt) return null

                return (
                  <Card key={quiz.id} className="border-green-500 border-2">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="flex items-center gap-2">
                            <Award className="h-5 w-5 text-green-600" />
                            {quiz.title}
                          </CardTitle>
                          <CardDescription className="mt-2">{quiz.courseName}</CardDescription>
                        </div>
                        <Badge className="bg-green-500">Aprobado</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center p-3 bg-green-50 border border-green-200 rounded-lg">
                          <div className="text-3xl font-bold text-green-600">{bestAttempt.score}%</div>
                          <p className="text-xs text-muted-foreground mt-1">Mejor nota</p>
                        </div>
                        <div className="text-center p-3 bg-accent rounded-lg">
                          <div className="text-2xl font-bold text-primary">{quiz.passingScore}%</div>
                          <p className="text-xs text-muted-foreground mt-1">Nota mínima</p>
                        </div>
                        <div className="text-center p-3 bg-accent rounded-lg">
                          <div className="text-2xl font-bold text-blue-600">{attemptsUsed}</div>
                          <p className="text-xs text-muted-foreground mt-1">Intentos usados</p>
                        </div>
                        <div className="text-center p-3 bg-accent rounded-lg">
                          <div className="text-2xl font-bold text-purple-600">
                            {format(new Date(bestAttempt.completedAt || bestAttempt.startedAt), "dd/MM/yyyy")}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">Fecha</p>
                        </div>
                      </div>

                      <Link href={`/courses/${quiz.courseId}/quiz/${quiz.id}`}>
                        <Button className="w-full" variant="outline">
                          <BarChart3 className="h-4 w-4 mr-2" />
                          Ver Resultados Detallados
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>

        {/* TAB: Historial Completo */}
        <TabsContent value="historial" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Historial de Intentos</CardTitle>
              <CardDescription>Todos tus intentos de evaluación ordenados por fecha</CardDescription>
            </CardHeader>
            <CardContent>
              {attempts.length === 0 ? (
                <div className="py-12 text-center">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">Sin intentos registrados</h3>
                  <p className="text-muted-foreground">Tus intentos de evaluación aparecerán aquí</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {attempts.map((attempt) => {
                    const config = statusConfig[attempt.status]
                    const Icon = config.icon

                    return (
                      <div
                        key={attempt.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors"
                      >
                        <div className="flex items-center gap-4 flex-1">
                          <div className={`p-2 rounded-full ${config.color} bg-opacity-10`}>
                            <Icon className={`h-5 w-5 ${config.color.replace("bg-", "text-")}`} />
                          </div>
                          <div className="flex-1">
                            <div className="font-semibold">{attempt.quiz.title}</div>
                            <div className="text-sm text-muted-foreground">{attempt.quiz.course.name}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-6">
                          <div className="text-center">
                            <div className="text-sm text-muted-foreground">Intento</div>
                            <div className="font-bold">#{attempt.attemptNumber}</div>
                          </div>
                          {attempt.score !== null && (
                            <div className="text-center">
                              <div className="text-sm text-muted-foreground">Nota</div>
                              <div className={`font-bold text-lg ${
                                attempt.status === "PASSED" ? "text-green-600" : "text-red-600"
                              }`}>
                                {attempt.score}%
                              </div>
                            </div>
                          )}
                          <div className="text-center min-w-[100px]">
                            <div className="text-sm text-muted-foreground">Fecha</div>
                            <div className="font-medium">
                              {format(new Date(attempt.startedAt), "dd/MM/yyyy HH:mm", { locale: es })}
                            </div>
                          </div>
                          <Badge variant={config.variant}>{config.label}</Badge>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
