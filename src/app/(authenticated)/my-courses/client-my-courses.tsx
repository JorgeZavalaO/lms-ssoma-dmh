"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  BookOpen, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  PlayCircle, 
  FileText,
  Calendar,
  Trophy,
  TrendingUp,
  Award
} from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import Link from "next/link"

interface CourseEnrollment {
  id: string
  course: {
    id: string
    code: string
    name: string
    description: string | null
    duration: number
    modality: string
    status: string
    validity: number | null
  }
  status: "PENDING" | "ACTIVE" | "COMPLETED" | "CANCELLED"
  enrolledAt: string
  startedAt: string | null
  completedAt: string | null
  expiresAt: string | null
  progressPercent: number
  type: "MANUAL" | "AUTOMATIC"
}

interface CourseProgress {
  courseId: string
  progress: number
  lessonsCompleted: number
  totalLessons: number
  quizzesCompleted: number
  totalQuizzes: number
}

interface QuizAttempt {
  id: string
  quiz: {
    id: string
    title: string
    passingScore: number
  }
  course: {
    id: string
    name: string
  }
  attemptNumber: number
  status: "IN_PROGRESS" | "PASSED" | "FAILED" | "ABANDONED"
  score: number | null
  startedAt: string
  completedAt: string | null
}

const statusConfig = {
  PENDING: { label: "Pendiente", color: "bg-yellow-500", icon: Clock },
  ACTIVE: { label: "En Progreso", color: "bg-blue-500", icon: PlayCircle },
  COMPLETED: { label: "Completado", color: "bg-green-500", icon: CheckCircle },
  CANCELLED: { label: "Cancelado", color: "bg-gray-500", icon: AlertCircle },
}

const modalityLabels = {
  ASYNCHRONOUS: "Asíncrono",
  SYNCHRONOUS: "Síncrono",
  BLENDED: "Mixto",
}

export function ClientMyCourses() {
  const [enrollments, setEnrollments] = useState<CourseEnrollment[]>([])
  const [progress, setProgress] = useState<Record<string, CourseProgress>>({})
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("all")

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      
      // Cargar inscripciones
      const enrollmentsRes = await fetch("/api/enrollments")
      if (enrollmentsRes.ok) {
        const enrollmentsData = await enrollmentsRes.json()
        setEnrollments(enrollmentsData.enrollments || [])
        
        // Cargar progreso para cada curso
        const progressData: Record<string, CourseProgress> = {}
        for (const enrollment of enrollmentsData.enrollments || []) {
          const progressRes = await fetch(`/api/progress/courses?courseId=${enrollment.course.id}`)
          if (progressRes.ok) {
            const data = await progressRes.json()
            if (data.progress && data.progress.length > 0) {
              const courseProgress = data.progress[0]
              progressData[enrollment.course.id] = {
                courseId: enrollment.course.id,
                progress: courseProgress.progress || 0,
                lessonsCompleted: courseProgress.lessonsCompleted || 0,
                totalLessons: courseProgress.totalLessons || 0,
                quizzesCompleted: courseProgress.quizzesCompleted || 0,
                totalQuizzes: courseProgress.totalQuizzes || 0,
              }
            }
          }
        }
        setProgress(progressData)
      }

      // Cargar intentos de exámenes recientes
      // TODO: Crear endpoint para obtener intentos del colaborador
      
    } catch (error) {
      console.error("Error loading data:", error)
    } finally {
      setLoading(false)
    }
  }

  const filteredEnrollments = enrollments.filter(enrollment => {
    if (activeTab === "all") return true
    return enrollment.status === activeTab.toUpperCase()
  })

  const stats = {
    total: enrollments.length,
    pending: enrollments.filter(e => e.status === "PENDING").length,
    inProgress: enrollments.filter(e => e.status === "ACTIVE").length,
    completed: enrollments.filter(e => e.status === "COMPLETED").length,
    avgProgress: enrollments.length > 0 
      ? Math.round(enrollments.reduce((sum, e) => sum + e.progressPercent, 0) / enrollments.length)
      : 0,
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Mis Cursos</h1>
        <p className="text-muted-foreground mt-2">
          Gestiona tus cursos asignados y monitorea tu progreso
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-5">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground mt-1">Cursos asignados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-yellow-500" />
              Pendientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            <p className="text-xs text-muted-foreground mt-1">Por iniciar</p>
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
            <div className="text-2xl font-bold text-blue-600">{stats.inProgress}</div>
            <p className="text-xs text-muted-foreground mt-1">Activos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              Completados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
            <p className="text-xs text-muted-foreground mt-1">Finalizados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-purple-500" />
              Progreso Promedio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.avgProgress}%</div>
            <p className="text-xs text-muted-foreground mt-1">De todos los cursos</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">Todos ({stats.total})</TabsTrigger>
          <TabsTrigger value="pending">Pendientes ({stats.pending})</TabsTrigger>
          <TabsTrigger value="active">En Progreso ({stats.inProgress})</TabsTrigger>
          <TabsTrigger value="completed">Completados ({stats.completed})</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {loading ? (
            <Card>
              <CardContent className="py-12 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Cargando cursos...</p>
              </CardContent>
            </Card>
          ) : filteredEnrollments.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No hay cursos</h3>
                <p className="text-muted-foreground">
                  {activeTab === "all" 
                    ? "No tienes cursos asignados todavía"
                    : `No tienes cursos en estado: ${statusConfig[activeTab.toUpperCase() as keyof typeof statusConfig]?.label}`
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredEnrollments.map((enrollment) => {
                const config = statusConfig[enrollment.status]
                const Icon = config.icon
                const courseProgress = progress[enrollment.course.id]

                return (
                  <Card key={enrollment.id} className="flex flex-col">
                    <CardHeader>
                      <div className="flex items-start justify-between mb-2">
                        <Badge className={config.color}>
                          <Icon className="h-3 w-3 mr-1" />
                          {config.label}
                        </Badge>
                        <Badge variant="outline">
                          {modalityLabels[enrollment.course.modality as keyof typeof modalityLabels]}
                        </Badge>
                      </div>
                      <CardTitle className="line-clamp-2">{enrollment.course.name}</CardTitle>
                      <CardDescription className="line-clamp-2">
                        {enrollment.course.description || "Sin descripción"}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col justify-between space-y-4">
                      {/* Progress */}
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Progreso</span>
                          <span className="font-medium">{enrollment.progressPercent}%</span>
                        </div>
                        <Progress value={enrollment.progressPercent} className="h-2" />
                        {courseProgress && (
                          <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <FileText className="h-3 w-3" />
                              {courseProgress.lessonsCompleted}/{courseProgress.totalLessons} Lecciones
                            </div>
                            <div className="flex items-center gap-1">
                              <Trophy className="h-3 w-3" />
                              {courseProgress.quizzesCompleted}/{courseProgress.totalQuizzes} Exámenes
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          <span>Duración: {enrollment.course.duration}h</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <span>Inscrito: {format(new Date(enrollment.enrolledAt), "dd MMM yyyy", { locale: es })}</span>
                        </div>
                        {enrollment.expiresAt && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <AlertCircle className="h-4 w-4" />
                            <span>Vence: {format(new Date(enrollment.expiresAt), "dd MMM yyyy", { locale: es })}</span>
                          </div>
                        )}
                        {enrollment.completedAt && (
                          <div className="flex items-center gap-2 text-green-600">
                            <CheckCircle className="h-4 w-4" />
                            <span>Completado: {format(new Date(enrollment.completedAt), "dd MMM yyyy", { locale: es })}</span>
                          </div>
                        )}
                        {enrollment.course.validity && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Award className="h-4 w-4" />
                            <span>Vigencia: {enrollment.course.validity} meses</span>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="pt-4 border-t">
                        <Link href={`/courses/${enrollment.course.id}`}>
                          <Button className="w-full">
                            {enrollment.status === "PENDING" ? (
                              <>
                                <PlayCircle className="h-4 w-4 mr-2" />
                                Iniciar Curso
                              </>
                            ) : enrollment.status === "ACTIVE" ? (
                              <>
                                <BookOpen className="h-4 w-4 mr-2" />
                                Continuar
                              </>
                            ) : (
                              <>
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Ver Certificado
                              </>
                            )}
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
