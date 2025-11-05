"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Route,
  BookOpen,
  CheckCircle,
  Clock,
  AlertCircle,
  Lock,
} from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

interface Course {
  id: string
  code: string
  name: string
  duration: number
  status: string
  description?: string
}

interface Prerequisite {
  id: string
  course: {
    id: string
    code: string
    name: string
  }
}

interface PathCourse {
  id: string
  courseId: string
  order: number
  isRequired: boolean
  course: Course
  prerequisite?: Prerequisite | null
  description?: string
}

interface PathProgress {
  progressPercent: number
  coursesCompleted: number
  coursesTotal: number
  startedAt?: string
  completedAt?: string
}

interface LearningPath {
  id: string
  code: string
  name: string
  description?: string
  status: string
  courses: PathCourse[]
  progress?: PathProgress[]
  _count: {
    courses: number
  }
}

export function ClientMyLearningPaths() {
  const [paths, setPaths] = useState<LearningPath[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("all")

  useEffect(() => {
    loadPaths()
  }, [])

  const loadPaths = async () => {
    try {
      setLoading(true)
      const res = await fetch("/api/learning-paths")
      if (res.ok) {
        const data = await res.json()
        setPaths(data)
      } else {
        toast.error("Error al cargar rutas de aprendizaje")
      }
    } catch (error) {
      console.error("Error loading paths:", error)
      toast.error("Error al cargar rutas de aprendizaje")
    } finally {
      setLoading(false)
    }
  }

  const getPathProgress = (path: LearningPath): PathProgress | null => {
    return path.progress && path.progress.length > 0 ? path.progress[0] : null
  }

  const stats = {
    total: paths.length,
    completed: paths.filter((p) => {
      const prog = getPathProgress(p)
      return prog && prog.progressPercent === 100
    }).length,
    inProgress: paths.filter((p) => {
      const prog = getPathProgress(p)
      return prog && prog.progressPercent > 0 && prog.progressPercent < 100
    }).length,
    notStarted: paths.filter((p) => {
      const prog = getPathProgress(p)
      return !prog || prog.progressPercent === 0
    }).length,
  }

  const filteredPaths = paths.filter((path) => {
    if (activeTab === "all") return true
    if (activeTab === "in-progress") {
      const prog = getPathProgress(path)
      return prog && prog.progressPercent > 0 && prog.progressPercent < 100
    }
    if (activeTab === "completed") {
      const prog = getPathProgress(path)
      return prog && prog.progressPercent === 100
    }
    if (activeTab === "not-started") {
      const prog = getPathProgress(path)
      return !prog || prog.progressPercent === 0
    }
    return true
  })

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-12 bg-muted rounded-lg animate-pulse" />
        <div className="h-64 bg-muted rounded-lg animate-pulse" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Mis Rutas de Aprendizaje</h1>
        <p className="text-muted-foreground mt-2">
          Completa tus rutas de aprendizaje personalizadas
        </p>
      </div>

      {/* Stats */}
      {paths.length > 0 && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold">{stats.total}</div>
                <p className="text-sm text-muted-foreground">Rutas Totales</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">{stats.inProgress}</div>
                <p className="text-sm text-muted-foreground">En Progreso</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">{stats.completed}</div>
                <p className="text-sm text-muted-foreground">Completadas</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-600">{stats.notStarted}</div>
                <p className="text-sm text-muted-foreground">No Iniciadas</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs */}
      {paths.length > 0 ? (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="all">
              Todas <Badge variant="secondary" className="ml-2">{stats.total}</Badge>
            </TabsTrigger>
            <TabsTrigger value="in-progress">
              En Progreso <Badge variant="secondary" className="ml-2">{stats.inProgress}</Badge>
            </TabsTrigger>
            <TabsTrigger value="completed">
              Completadas <Badge variant="secondary" className="ml-2">{stats.completed}</Badge>
            </TabsTrigger>
            <TabsTrigger value="not-started">
              No Iniciadas <Badge variant="secondary" className="ml-2">{stats.notStarted}</Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-4 space-y-4">
            {filteredPaths.length === 0 ? (
              <Card>
                <CardContent className="py-12">
                  <div className="text-center">
                    <Route className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">No hay rutas en esta categoría</h3>
                    <p className="text-sm text-muted-foreground">
                      {activeTab === "all" && "No tienes rutas de aprendizaje asignadas"}
                      {activeTab === "in-progress" && "No tienes rutas en progreso"}
                      {activeTab === "completed" && "No tienes rutas completadas"}
                      {activeTab === "not-started" && "No tienes rutas sin iniciar"}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              filteredPaths.map((path) => {
                const progress = getPathProgress(path)
                const progressPercent = progress?.progressPercent ?? 0
                const isCompleted = progressPercent === 100
                const isStarted = progressPercent > 0

                return (
                  <Card key={path.id} className="overflow-hidden">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline" className="font-mono">
                              {path.code}
                            </Badge>
                            {isCompleted && (
                              <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Completada
                              </Badge>
                            )}
                            {isStarted && !isCompleted && (
                              <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20">
                                <Clock className="h-3 w-3 mr-1" />
                                En Progreso
                              </Badge>
                            )}
                            {!isStarted && (
                              <Badge className="bg-gray-500/10 text-gray-600 border-gray-500/20">
                                <AlertCircle className="h-3 w-3 mr-1" />
                                No Iniciada
                              </Badge>
                            )}
                          </div>
                          <CardTitle>{path.name}</CardTitle>
                          {path.description && (
                            <CardDescription className="mt-1">
                              {path.description}
                            </CardDescription>
                          )}
                        </div>
                      </div>

                      {progress && (
                        <div className="mt-4 space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">
                              Progreso: {progress.coursesCompleted}/{progress.coursesTotal} cursos completados
                            </span>
                            <span className="font-medium">{progressPercent}%</span>
                          </div>
                          <Progress value={progressPercent} className="h-2" />
                        </div>
                      )}
                    </CardHeader>

                    <CardContent>
                      {path.courses.length > 0 ? (
                        <Accordion type="single" collapsible className="w-full">
                          {path.courses.map((pathCourse) => (
                            <AccordionItem
                              key={pathCourse.id}
                              value={pathCourse.id}
                              className="border-0"
                            >
                              <AccordionTrigger className="hover:no-underline py-2">
                                <div className="flex items-center gap-3 text-left flex-1">
                                  <Badge variant="outline" className="font-mono">
                                    L{pathCourse.order}
                                  </Badge>
                                  <div className="flex-1">
                                    <div className="font-medium text-sm">
                                      {pathCourse.course.name}
                                    </div>
                                    {pathCourse.course.duration && (
                                      <div className="text-xs text-muted-foreground">
                                        {pathCourse.course.duration}h • {pathCourse.isRequired ? "Requerido" : "Opcional"}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </AccordionTrigger>

                              <AccordionContent className="pb-2">
                                <div className="space-y-3 pl-9">
                                  {pathCourse.description && (
                                    <p className="text-sm text-muted-foreground">
                                      {pathCourse.course.description}
                                    </p>
                                  )}

                                  {pathCourse.prerequisite && (
                                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 text-sm">
                                      <div className="flex items-center gap-2 text-amber-700 font-medium">
                                        <Lock className="h-4 w-4" />
                                        Prerequisito
                                      </div>
                                      <p className="text-amber-700 text-xs mt-1">
                                        Debe completar primero: {pathCourse.prerequisite.course.name}
                                      </p>
                                    </div>
                                  )}

                                  <Link href={`/courses/${pathCourse.courseId}`}>
                                    <Button size="sm" className="w-full">
                                      <BookOpen className="h-4 w-4 mr-2" />
                                      Acceder al Curso
                                    </Button>
                                  </Link>
                                </div>
                              </AccordionContent>
                            </AccordionItem>
                          ))}
                        </Accordion>
                      ) : (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          No hay cursos en esta ruta
                        </p>
                      )}
                    </CardContent>
                  </Card>
                )
              })
            )}
          </TabsContent>
        </Tabs>
      ) : (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Route className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No tienes rutas de aprendizaje asignadas</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Contacta con tu administrador para que te asigne rutas de aprendizaje
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
