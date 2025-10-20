"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"
import {
  BookOpen,
  ClipboardList,
  CalendarClock,
  Bell,
  CheckCircle2,
  Timer,
  AlertTriangle,
  Award,
  Loader2,
} from "lucide-react"

type Role = "SUPERADMIN" | "ADMIN" | "COLLABORATOR" | string

export default function CollaboratorDashboardClient() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [kpisData, setKpisData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (status === "loading") return

    if (!session?.user) {
      router.push("/login")
      return
    }

    const userRole = (session.user as any)?.role as Role
    if (userRole === "ADMIN" || userRole === "SUPERADMIN") {
      router.push("/admin/dashboard")
      return
    }

    // Cargar datos
    const loadData = async () => {
      try {
        const response = await fetch("/api/dashboard-kpis")
        if (!response.ok) throw new Error("Failed to fetch dashboard KPIs")
        const data = await response.json()
        setKpisData(data)
      } catch (error) {
        console.error("Error loading dashboard:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [session, status, router])

  if (isLoading || !kpisData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const userName = session?.user?.name || "Colaborador"
  const email = session?.user?.email || ""
  const initials = userName.split(" ").map(s => s[0]).join("").slice(0, 2).toUpperCase()

  const kpis = [
    {
      label: "Completados",
      value: kpisData.completedCourses,
      total: kpisData.totalCourses,
      icon: CheckCircle2,
      tone: "text-emerald-600",
    },
    {
      label: "En Progreso",
      value: kpisData.inProgressCourses,
      icon: Timer,
      tone: "text-blue-600",
    },
    {
      label: "Por Vencer",
      value: kpisData.upcomingDeadlines,
      icon: CalendarClock,
      tone: "text-yellow-600",
    },
    {
      label: "Alertas",
      value: kpisData.alertsCount,
      icon: AlertTriangle,
      tone: "text-red-600",
    },
  ]

  const quickLinks = [
    { href: "/my-courses", icon: BookOpen, label: "Mis Cursos" },
    { href: "/evaluations", icon: ClipboardList, label: "Evaluaciones" },
    { href: "/my-certificates", icon: Award, label: "Certificados" },
    { href: "/notifications", icon: Bell, label: "Notificaciones" },
  ] as const

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Encabezado */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12 bg-primary/20">
            <AvatarFallback className="bg-primary/20 text-primary font-semibold">{initials}</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-semibold leading-none tracking-tight">Mi Dashboard</h1>
            <p className="text-muted-foreground text-sm">{email}</p>
            <div className="mt-1">
              <Badge variant="outline">COLABORADOR</Badge>
            </div>
          </div>
        </div>
      </div>

      {/* KPIs Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon
          return (
            <Card key={kpi.label}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{kpi.label}</CardTitle>
                <Icon className={`h-4 w-4 ${kpi.tone}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{kpi.value}</div>
                {kpi.total && (
                  <p className="text-xs text-muted-foreground">
                    de {kpi.total} total
                  </p>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Progreso General */}
      <Card>
        <CardHeader>
          <CardTitle>Tu Progreso</CardTitle>
          <CardDescription>Avance general en rutas de aprendizaje</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Progreso Total</span>
              <span className="text-sm text-muted-foreground">{kpisData.overallProgress || 0}%</span>
            </div>
            <Progress value={kpisData.overallProgress || 0} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Próximos Vencimientos */}
      {(kpisData.nextDueAssignments || []).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Próximos Vencimientos</CardTitle>
            <CardDescription>Tareas y exámenes próximos a vencer</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {kpisData.nextDueAssignments.map((assignment: any) => (
                <div key={assignment.id} className="flex items-start gap-3 border-b pb-3 last:border-b-0">
                  <CalendarClock className="h-4 w-4 text-yellow-600 mt-1 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{assignment.title}</p>
                    <p className="text-xs text-muted-foreground">{assignment.courseTitle}</p>
                    <p className="text-xs text-yellow-600 mt-1">Vence en {assignment.daysUntilDue} días</p>
                  </div>
                  <Badge variant="outline">{assignment.severity}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Gráfico de Progreso Mensual */}
      {(kpisData.monthlyProgress || []).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Progreso Mensual</CardTitle>
            <CardDescription>Últimos 6 meses</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                progress: {
                  label: "Progreso",
                  color: "hsl(var(--primary))",
                },
              }}
            >
              <AreaChart data={kpisData.monthlyProgress}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area
                  type="monotone"
                  dataKey="progress"
                  stroke="var(--color-progress)"
                  fill="var(--color-progress)"
                  fillOpacity={0.2}
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>
      )}

      {/* Quick Links */}
      <Card>
        <CardHeader>
          <CardTitle>Accesos Rápidos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {quickLinks.map((link) => {
              const Icon = link.icon
              return (
                <Link key={link.href} href={link.href}>
                  <Button variant="outline" className="w-full gap-2">
                    <Icon className="h-4 w-4" />
                    <span className="hidden sm:inline text-xs">{link.label}</span>
                  </Button>
                </Link>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
