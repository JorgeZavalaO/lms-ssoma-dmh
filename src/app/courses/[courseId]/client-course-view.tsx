"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import {
  BookOpen,
  Clock,
  CheckCircle,
  Circle,
  PlayCircle,
  FileText,
  Video,
  FileCode,
  Award,
  TrendingUp,
  Calendar,
  Target,
  AlertCircle,
  Trophy,
  BarChart3,
} from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import Link from "next/link"

interface ClientCourseViewProps {
  enrollment: any
  lessonProgress: any[]
  quizAttempts: any[]
}

interface QuizStat {
  quizId: string
  quizTitle: string
  totalAttempts: number
  bestScore: number | null
  lastScore: number | null
  lastStatus: string | null
  passingScore: number
}

const lessonTypeIcons = {
  VIDEO: Video,
  PDF: FileText,
  PPT: FileText,
  HTML: FileCode,
  SCORM: BookOpen,
}

const lessonTypeLabels = {
  VIDEO: "Video",
  PDF: "Documento PDF",
  PPT: "Presentación",
  HTML: "Contenido Web",
  SCORM: "Módulo SCORM",
}

const quizStatusConfig = {
  IN_PROGRESS: { label: "En Progreso", color: "bg-blue-500", variant: "secondary" as const },
  PASSED: { label: "Aprobado", color: "bg-green-500", variant: "default" as const },
  FAILED: { label: "Reprobado", color: "bg-red-500", variant: "destructive" as const },
  ABANDONED: { label: "Abandonado", color: "bg-gray-500", variant: "outline" as const },
}

export function ClientCourseView({ enrollment, lessonProgress, quizAttempts }: ClientCourseViewProps) {
  const [activeTab, setActiveTab] = useState("contenido")

  const course = enrollment.course

  // Calcular estadísticas
  const totalLessons = course.units.reduce((sum: number, unit: any) => sum + unit.lessons.length, 0)
  const completedLessons = lessonProgress.filter((p) => p.completed).length
  const totalQuizzes = course.quizzes.length
  const passedQuizzes = quizAttempts.filter((a) => a.status === "PASSED").length

  // Progreso por unidad
  const unitProgress = course.units.map((unit: any) => {
    const unitLessons = unit.lessons.length
    const unitCompleted = unit.lessons.filter((lesson: any) =>
      lessonProgress.some((p) => p.lessonId === lesson.id && p.completed)
    ).length
    return {
      unitId: unit.id,
      total: unitLessons,
      completed: unitCompleted,
      percentage: unitLessons > 0 ? Math.round((unitCompleted / unitLessons) * 100) : 0,
    }
  })

  // Mejor intento por quiz
  const quizStats = course.quizzes.map((quiz: any) => {
    const attempts = quizAttempts.filter((a) => a.quizId === quiz.id)
    const bestAttempt = attempts
      .filter((a) => a.status === "PASSED" || a.status === "FAILED")
      .sort((a, b) => (b.score || 0) - (a.score || 0))[0]
    const lastAttempt = attempts[0]

    return {
      quizId: quiz.id,
      quizTitle: quiz.title,
      totalAttempts: attempts.length,
      bestScore: bestAttempt?.score || null,
      lastScore: lastAttempt?.score || null,
      lastStatus: lastAttempt?.status || null,
      passingScore: quiz.passingScore,
    }
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h1 className="text-3xl font-bold tracking-tight">{course.name}</h1>
            <p className="text-muted-foreground mt-2">{course.description}</p>
          </div>
          <Badge
            variant={
              enrollment.status === "COMPLETED"
                ? "default"
                : enrollment.status === "ACTIVE"
                ? "secondary"
                : "outline"
            }
          >
            {enrollment.status === "COMPLETED"
              ? "Completado"
              : enrollment.status === "ACTIVE"
              ? "En Progreso"
              : "Pendiente"}
          </Badge>
        </div>

        {/* Metadatos del curso */}
        <div className="flex flex-wrap gap-4 mt-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span>Duración: {course.duration}h</span>
          </div>
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            <span>{course.units.length} Unidades</span>
          </div>
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span>{totalLessons} Lecciones</span>
          </div>
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4" />
            <span>{totalQuizzes} Evaluaciones</span>
          </div>
          {course.validity && (
            <div className="flex items-center gap-2">
              <Award className="h-4 w-4" />
              <span>Vigencia: {course.validity} meses</span>
            </div>
          )}
        </div>
      </div>

      {/* Progreso general */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Progreso General
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="font-medium">Progreso del curso</span>
              <span className="text-muted-foreground">{enrollment.progressPercent}%</span>
            </div>
            <Progress value={enrollment.progressPercent} className="h-3" />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {completedLessons}/{totalLessons}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Lecciones completadas</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {passedQuizzes}/{totalQuizzes}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Evaluaciones aprobadas</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{quizAttempts.length}</div>
              <p className="text-xs text-muted-foreground mt-1">Intentos totales</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {enrollment.startedAt
                  ? Math.ceil(
                      (new Date().getTime() - new Date(enrollment.startedAt).getTime()) /
                        (1000 * 60 * 60 * 24)
                    )
                  : 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Días desde inicio</p>
            </div>
          </div>

          {enrollment.expiresAt && (
            <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 p-3 rounded-md">
              <AlertCircle className="h-4 w-4" />
              <span>
                Expira el {format(new Date(enrollment.expiresAt), "dd 'de' MMMM 'de' yyyy", { locale: es })}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabs de contenido */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="contenido">Contenido del Curso</TabsTrigger>
          <TabsTrigger value="progreso">Progreso por Unidad</TabsTrigger>
          <TabsTrigger value="evaluaciones">Evaluaciones</TabsTrigger>
        </TabsList>

        {/* TAB: Contenido del Curso */}
        <TabsContent value="contenido" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Unidades y Lecciones</CardTitle>
              <CardDescription>
                Completa todas las lecciones y evaluaciones para aprobar el curso
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                {course.units.map((unit: any, unitIndex: number) => {
                  const unitProgressData = unitProgress[unitIndex]
                  return (
                    <AccordionItem key={unit.id} value={unit.id}>
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center justify-between w-full pr-4">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold text-sm">
                              {unitIndex + 1}
                            </div>
                            <div className="text-left">
                              <div className="font-semibold">{unit.title}</div>
                              {unit.description && (
                                <div className="text-sm text-muted-foreground">{unit.description}</div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">
                              {unitProgressData.completed}/{unitProgressData.total}
                            </Badge>
                            <div className="text-sm text-muted-foreground">
                              {unitProgressData.percentage}%
                            </div>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-2 pt-2">
                          {unit.lessons.map((lesson: any) => {
                            const progress = lessonProgress.find((p) => p.lessonId === lesson.id)
                            const isCompleted = progress?.completed || false
                            const Icon = lessonTypeIcons[lesson.type as keyof typeof lessonTypeIcons]

                            return (
                              <Link key={lesson.id} href={`/courses/${course.id}/lessons/${lesson.id}`}>
                                <div className="flex items-center justify-between p-4 rounded-lg border hover:bg-accent transition-colors cursor-pointer">
                                  <div className="flex items-center gap-3">
                                    <div
                                      className={`flex items-center justify-center w-6 h-6 rounded-full ${
                                        isCompleted ? "bg-green-500 text-white" : "bg-gray-200 text-gray-500"
                                      }`}
                                    >
                                      {isCompleted ? (
                                        <CheckCircle className="h-4 w-4" />
                                      ) : (
                                        <Circle className="h-4 w-4" />
                                      )}
                                    </div>
                                    <Icon className="h-5 w-5 text-muted-foreground" />
                                    <div>
                                      <div className="font-medium">{lesson.title}</div>
                                      <div className="text-sm text-muted-foreground">
                                        {lessonTypeLabels[lesson.type as keyof typeof lessonTypeLabels]}
                                        {lesson.duration && ` • ${lesson.duration} min`}
                                      </div>
                                    </div>
                                  </div>
                                  {progress && !isCompleted && (
                                    <Badge variant="secondary">{progress.viewPercentage}%</Badge>
                                  )}
                                </div>
                              </Link>
                            )
                          })}

                          {/* Quizzes de la unidad (si existen) */}
                          {course.quizzes
                            .filter((quiz: any) => quiz.unitId === unit.id)
                            .map((quiz: any) => {
                              const attempts = quizAttempts.filter((a) => a.quizId === quiz.id)
                              const lastAttempt = attempts[0]
                              const isPassed = lastAttempt?.status === "PASSED"

                              return (
                                <Link key={quiz.id} href={`/courses/${course.id}/quiz/${quiz.id}`}>
                                  <div className="flex items-center justify-between p-4 rounded-lg border border-purple-200 hover:bg-purple-50 transition-colors cursor-pointer">
                                    <div className="flex items-center gap-3">
                                      <div
                                        className={`flex items-center justify-center w-6 h-6 rounded-full ${
                                          isPassed ? "bg-green-500 text-white" : "bg-purple-200 text-purple-700"
                                        }`}
                                      >
                                        <Trophy className="h-4 w-4" />
                                      </div>
                                      <div>
                                        <div className="font-medium flex items-center gap-2">
                                          {quiz.title}
                                          <Badge variant="outline" className="text-xs">
                                            Evaluación
                                          </Badge>
                                        </div>
                                        <div className="text-sm text-muted-foreground">
                                          {quiz.questions?.length || 0} preguntas • Nota mínima: {quiz.passingScore}%
                                        </div>
                                      </div>
                                    </div>
                                    {lastAttempt && (
                                      <Badge variant={quizStatusConfig[lastAttempt.status as keyof typeof quizStatusConfig].variant}>
                                        {lastAttempt.score}%
                                      </Badge>
                                    )}
                                  </div>
                                </Link>
                              )
                            })}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  )
                })}
              </Accordion>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB: Progreso por Unidad */}
        <TabsContent value="progreso" className="mt-6">
          <div className="grid gap-4">
            {course.units.map((unit: any, index: number) => {
              const unitProgressData = unitProgress[index]
              return (
                <Card key={unit.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold text-sm">
                        {index + 1}
                      </div>
                      {unit.title}
                    </CardTitle>
                    <CardDescription>{unit.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="font-medium">Progreso de la unidad</span>
                        <span className="text-muted-foreground">
                          {unitProgressData.completed}/{unitProgressData.total} lecciones
                        </span>
                      </div>
                      <Progress value={unitProgressData.percentage} className="h-3" />
                      <p className="text-sm text-muted-foreground mt-1">{unitProgressData.percentage}% completado</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                      <div>
                        <div className="text-2xl font-bold text-green-600">{unitProgressData.completed}</div>
                        <p className="text-xs text-muted-foreground">Lecciones completadas</p>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-blue-600">
                          {unitProgressData.total - unitProgressData.completed}
                        </div>
                        <p className="text-xs text-muted-foreground">Lecciones pendientes</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        {/* TAB: Evaluaciones */}
        <TabsContent value="evaluaciones" className="mt-6">
          <div className="grid gap-4">
            {quizStats.map((stat: QuizStat) => {
              const quiz = course.quizzes.find((q: any) => q.id === stat.quizId)
              if (!quiz) return null

              return (
                <Card key={stat.quizId}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <Trophy className="h-5 w-5" />
                          {stat.quizTitle}
                        </CardTitle>
                        <CardDescription className="mt-2">
                          {quiz.description || "Evaluación del curso"}
                        </CardDescription>
                      </div>
                      {stat.lastStatus && (
                        <Badge variant={quizStatusConfig[stat.lastStatus as keyof typeof quizStatusConfig].variant}>
                          {quizStatusConfig[stat.lastStatus as keyof typeof quizStatusConfig].label}
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <div className="text-2xl font-bold text-blue-600">{stat.totalAttempts}</div>
                        <p className="text-xs text-muted-foreground">Intentos realizados</p>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-green-600">
                          {stat.bestScore !== null ? `${stat.bestScore}%` : "-"}
                        </div>
                        <p className="text-xs text-muted-foreground">Mejor nota</p>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-purple-600">
                          {stat.lastScore !== null ? `${stat.lastScore}%` : "-"}
                        </div>
                        <p className="text-xs text-muted-foreground">Última nota</p>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-orange-600">{stat.passingScore}%</div>
                        <p className="text-xs text-muted-foreground">Nota mínima</p>
                      </div>
                    </div>

                    <div className="pt-4 border-t">
                      <Link href={`/courses/${course.id}/quiz/${stat.quizId}`}>
                        <Button className="w-full" variant={stat.lastStatus === "PASSED" ? "outline" : "default"}>
                          {stat.lastStatus === "PASSED" ? (
                            <>
                              <BarChart3 className="h-4 w-4 mr-2" />
                              Ver Resultados
                            </>
                          ) : stat.totalAttempts > 0 ? (
                            <>
                              <PlayCircle className="h-4 w-4 mr-2" />
                              Reintentar Evaluación
                            </>
                          ) : (
                            <>
                              <Target className="h-4 w-4 mr-2" />
                              Iniciar Evaluación
                            </>
                          )}
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              )
            })}

            {quizStats.length === 0 && (
              <Card>
                <CardContent className="py-12 text-center">
                  <Trophy className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">Sin evaluaciones</h3>
                  <p className="text-muted-foreground">Este curso no tiene evaluaciones configuradas</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Fechas importantes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Fechas Importantes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Inscrito</p>
              <p className="font-medium">
                {format(new Date(enrollment.enrolledAt), "dd 'de' MMMM 'de' yyyy", { locale: es })}
              </p>
            </div>
            {enrollment.startedAt && (
              <div>
                <p className="text-sm text-muted-foreground">Iniciado</p>
                <p className="font-medium">
                  {format(new Date(enrollment.startedAt), "dd 'de' MMMM 'de' yyyy", { locale: es })}
                </p>
              </div>
            )}
            {enrollment.completedAt && (
              <div>
                <p className="text-sm text-muted-foreground">Completado</p>
                <p className="font-medium">
                  {format(new Date(enrollment.completedAt), "dd 'de' MMMM 'de' yyyy", { locale: es })}
                </p>
              </div>
            )}
            {enrollment.expiresAt && (
              <div>
                <p className="text-sm text-muted-foreground">Expira</p>
                <p className="font-medium">
                  {format(new Date(enrollment.expiresAt), "dd 'de' MMMM 'de' yyyy", { locale: es })}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
