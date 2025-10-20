"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts"
import {
  Users,
  BookOpen,
  TrendingUp,
  AlertTriangle,
  ClipboardList,
  BarChart3,
  CheckCircle2,
  Loader2,
} from "lucide-react"

type Role = "SUPERADMIN" | "ADMIN" | "COLLABORATOR" | string

const COLORS = ["#10b981", "#3b82f6", "#f59e0b"]

export default function AdminDashboardClient() {
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
    if (userRole !== "ADMIN" && userRole !== "SUPERADMIN") {
      router.push("/dashboard")
      return
    }

    // Cargar datos
    const loadData = async () => {
      try {
        const response = await fetch("/api/admin/dashboard-kpis")
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

  const userName = session?.user?.name || "Administrador"
  const initials = userName.split(" ").map(s => s[0]).join("").slice(0, 2).toUpperCase()
  const userRole = (session?.user as any)?.role as Role

  const kpis = [
    {
      label: "Colaboradores Activos",
      value: kpisData.activeCollaborators,
      total: kpisData.totalCollaborators,
      icon: Users,
      tone: "text-blue-600",
    },
    {
      label: "Cursos Publicados",
      value: kpisData.totalActiveCourses,
      icon: BookOpen,
      tone: "text-emerald-600",
    },
    {
      label: "Cumplimiento General",
      value: `${kpisData.overallCompliancePercent}%`,
      icon: TrendingUp,
      tone: "text-purple-600",
    },
    {
      label: "Alertas Críticas",
      value: kpisData.criticalAlertsCount,
      icon: AlertTriangle,
      tone: "text-red-600",
    },
  ]

  const quickLinks = [
    { href: "/admin/collaborators", icon: Users, label: "Colaboradores" },
    { href: "/admin/courses", icon: BookOpen, label: "Cursos" },
    { href: "/reports/dashboard", icon: BarChart3, label: "Reportes" },
    { href: "/admin/enrollments", icon: ClipboardList, label: "Inscripciones" },
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
            <h1 className="text-2xl font-semibold leading-none tracking-tight">Dashboard Ejecutivo</h1>
            <p className="text-muted-foreground text-sm">{userName}</p>
            <div className="mt-1">
              <Badge variant="default" className="uppercase">{userRole}</Badge>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/reports/dashboard">
            <Button size="sm" variant="outline" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Ver Reportes
            </Button>
          </Link>
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

      {/* Alert si hay críticas */}
      {kpisData.criticalAlertsCount > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-900">
              <AlertTriangle className="h-5 w-5" />
              Hay Colaboradores con Alertas Críticas
            </CardTitle>
            <CardDescription className="text-red-800">
              Se han detectado {kpisData.criticalAlertsCount} colaboradores con problemas de cumplimiento.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin/progress">
              <Button size="sm" variant="outline" className="gap-2">
                Ver Alertas Críticas
                <AlertTriangle className="h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Gráfico de Cumplimiento por Área */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Cumplimiento por Área</CardTitle>
            <CardDescription>Porcentaje de cumplimiento por área</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={kpisData.complianceByArea || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="area" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="compliance" fill="#3b82f6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Distribución de Cursos */}
        <Card>
          <CardHeader>
            <CardTitle>Estado de Cursos</CardTitle>
            <CardDescription>Distribución por estado</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={kpisData.courseStatusDistribution || []}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ status, count }) => `${status}: ${count}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {(kpisData.courseStatusDistribution || []).map((_: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Tendencia de Inscripciones */}
      <Card>
        <CardHeader>
          <CardTitle>Tendencia de Inscripciones</CardTitle>
          <CardDescription>Últimos 6 meses</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={kpisData.enrollmentsTrend || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="enrollments"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ fill: "#3b82f6", r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Top Áreas */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Top 5 Áreas - Cumplimiento</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(kpisData.topAreasCompliance || []).map((area: any, index: number) => (
                <div key={area.area} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-muted-foreground">#{index + 1}</span>
                    <span className="text-sm font-medium">{area.area}</span>
                  </div>
                  <Badge variant="outline">{area.compliance}%</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Colaboradores Críticos */}
        <Card>
          <CardHeader>
            <CardTitle>Colaboradores en Riesgo</CardTitle>
            <CardDescription>Top 5 con más alertas</CardDescription>
          </CardHeader>
          <CardContent>
            {(kpisData.criticalCollaborators || []).length > 0 ? (
              <div className="space-y-4">
                {kpisData.criticalCollaborators.map((collab: any) => (
                  <div key={collab.email} className="flex items-start gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>{collab.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{collab.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{collab.area}</p>
                    </div>
                    <Badge variant="destructive" className="flex-shrink-0">{collab.alertsCount}</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <CheckCircle2 className="h-8 w-8 mx-auto text-emerald-600 mb-2" />
                <p className="text-sm text-muted-foreground">¡Sin alertas críticas!</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

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
                    <span className="hidden sm:inline">{link.label}</span>
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
