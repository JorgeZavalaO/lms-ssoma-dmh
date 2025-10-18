"use client"

import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
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
  LogOut,
} from "lucide-react"
import { DashboardKPIs, getDashboardKPIs } from "@/lib/kpis"

type Role = "SUPERADMIN" | "ADMIN" | "COLLABORATOR" | string

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [kpisData, setKpisData] = useState<DashboardKPIs | null>(null)
  const [isLoadingKpis, setIsLoadingKpis] = useState(true)

  // Calcular iniciales ANTES de cualquier condicional (rule of hooks)
  const userName = session?.user?.name || "Usuario"
  const userEmail = session?.user?.email || ""
  const role = (session?.user as any)?.role as Role
  const collaboratorId = (session?.user as any)?.collaboratorId as string | undefined
  const initials = useMemo(() => userName.split(" ").map(s => s[0]).join("").slice(0,2).toUpperCase(), [userName])

  // Cargar KPIs cuando está autenticado
  useEffect(() => {
    if (status === "loading") return
    if (!session) {
      router.push("/login")
      return
    }
    
    if (collaboratorId) {
      setIsLoadingKpis(true)
      getDashboardKPIs(collaboratorId)
        .then(setKpisData)
        .catch(console.error)
        .finally(() => setIsLoadingKpis(false))
    } else {
      setIsLoadingKpis(false)
    }
  }, [session, status, router, collaboratorId])

  if (status === "loading") {
    return <div className="flex min-h-[60vh] items-center justify-center text-sm text-muted-foreground">Cargando…</div>
  }

  if (!session) return null

  // Usar datos del servidor, con fallback a valores por defecto
  const kpisValues = kpisData || {
    completed: 0,
    inProgress: 0,
    dueSoon: 0,
    alerts: 0,
    progressPercent: 0,
    nextCourses: [],
  }

  const kpis = [
    { label: "Completados", value: kpisValues.completed, icon: CheckCircle2, tone: "text-emerald-600" },
    { label: "En progreso", value: kpisValues.inProgress, icon: Timer, tone: "text-blue-600" },
    { label: "Por vencer", value: kpisValues.dueSoon, icon: CalendarClock, tone: "text-amber-600" },
    { label: "Alertas", value: kpisValues.alerts, icon: AlertTriangle, tone: "text-red-600" },
  ] as const

  const chartData = [
    { month: "Ene", progreso: 20 },
    { month: "Feb", progreso: 28 },
    { month: "Mar", progreso: 35 },
    { month: "Abr", progreso: 42 },
    { month: "May", progreso: 55 },
    { month: "Jun", progreso: 63 },
  ]

  const upcoming = kpisValues.nextCourses.length > 0 
    ? kpisValues.nextCourses.map(c => ({ ...c, severity: c.severity as "info" | "warning" | "critical" }))
    : []

  const quickLinks = [
    { href: "/my-courses", icon: BookOpen, label: "Mis cursos" },
    { href: "/evaluations", icon: ClipboardList, label: "Evaluaciones" },
    { href: "/my-certificates", icon: Award, label: "Certificados" },
    { href: "/notifications", icon: Bell, label: "Notificaciones" },
  ] as const

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Encabezado */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12">
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-semibold leading-none tracking-tight">Hola, {userName}</h1>
            <p className="text-muted-foreground text-sm">{userEmail}</p>
            <div className="mt-1">
              <Badge variant="secondary" className="uppercase">{role || "colaborador"}</Badge>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/my-courses"><Button size="sm" variant="default" className="gap-2"><BookOpen className="h-4 w-4" /> Ir a cursos</Button></Link>
          <Button size="sm" variant="outline" className="gap-2" onClick={() => signOut({ callbackUrl: "/login" })}><LogOut className="h-4 w-4" /> Salir</Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => (
          <Card key={k.label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{k.label}</CardTitle>
              <k.icon className={`h-5 w-5 ${k.tone}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{k.value}</div>
              <p className="text-muted-foreground text-xs">{isLoadingKpis ? "Cargando…" : "Datos actualizados"}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Gráfico + Próximos vencimientos */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Progreso mensual</CardTitle>
            <CardDescription>Evolución de cursos completados</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{ progreso: { label: "Progreso", color: "hsl(var(--primary))" } }}
              className="h-64"
            >
              <AreaChart data={chartData} margin={{ left: 12, right: 12 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
                <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" />} />
                <Area dataKey="progreso" type="monotone" stroke="hsl(var(--primary))" fill="hsl(var(--primary)/.15)" />
                <ChartLegend content={<ChartLegendContent />} />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Próximos vencimientos</CardTitle>
            <CardDescription>Cursos obligatorios que vencen pronto</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {upcoming.length > 0 ? (
              upcoming.map((u) => (
                <div key={u.course} className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium leading-none">{u.course}</p>
                    <p className="text-muted-foreground text-xs">{u.dueDate}</p>
                  </div>
                  <Badge variant={u.severity === "critical" ? "destructive" : u.severity === "warning" ? "default" : "secondary"}>
                    {u.severity === "critical" ? "Crítico" : u.severity === "warning" ? "Por vencer" : "Info"}
                  </Badge>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground text-sm text-center py-4">No hay cursos próximos a vencer</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Accesos rápidos y progreso individual */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Accesos rápidos</CardTitle>
            <CardDescription>Ir directo a tus acciones más comunes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {quickLinks.map((q) => (
                <Link key={q.href} href={q.href} className="group">
                  <div className="border-border/50 hover:bg-muted/60 group-hover:shadow-sm flex items-center gap-3 rounded-md border p-3 transition">
                    <q.icon className="text-primary h-5 w-5" />
                    <span className="text-sm font-medium">{q.label}</span>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tu progreso</CardTitle>
            <CardDescription>Porcentaje de avance global</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span>Completado</span>
              <span className="font-medium">{kpisValues.progressPercent}%</span>
            </div>
            <Progress value={kpisValues.progressPercent} />
            <p className="text-muted-foreground text-xs">
              {kpisValues.progressPercent === 100
                ? "¡Felicidades! Has completado todo."
                : `Completa ${100 - kpisValues.progressPercent} % más cursos.`}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
