"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import {
  LayoutDashboard,
  Settings,
  Users,
  Briefcase,
  MapPin,
  Building2,
  BookOpen,
  Route,
  UserCheck,
  Zap,
  HelpCircle,
  BarChart3,
  LogIn,
  UserPlus,
  TrendingUp,
  Award,
  Bell,
} from "lucide-react"

// Mapeo de rutas a nombres en español
const routeNames: Record<string, string> = {
  "/": "Inicio",
  "/dashboard": "Dashboard",
  "/my-courses": "Mis Cursos",
  "/admin": "Administración",
  "/admin/collaborators": "Colaboradores",
  "/admin/areas": "Áreas",
  "/admin/positions": "Puestos",
  "/admin/collaborators/import": "Importar Colaboradores",
  "/admin/courses": "Cursos",
  "/admin/learning-paths": "Rutas de Aprendizaje",
  "/admin/enrollments": "Inscripciones",
  "/admin/enrollment-rules": "Reglas Automáticas",
  "/admin/questions": "Banco de Preguntas",
  "/admin/quizzes": "Exámenes",
  "/admin/sites": "Sedes",
  "/admin/progress": "Tracking de Avance",
  "/admin/certifications": "Certificaciones",
  "/admin/alerts": "Alertas",
  "/login": "Iniciar Sesión",
  "/register": "Registro",
}

// Mapeo de rutas a iconos
const routeIcons: Record<string, React.ReactNode> = {
  "/": <LayoutDashboard className="h-4 w-4" />,
  "/dashboard": <LayoutDashboard className="h-4 w-4" />,
  "/my-courses": <BookOpen className="h-4 w-4" />,
  "/admin": <Settings className="h-4 w-4" />,
  "/admin/collaborators": <Users className="h-4 w-4" />,
  "/admin/areas": <MapPin className="h-4 w-4" />,
  "/admin/positions": <Briefcase className="h-4 w-4" />,
  "/admin/courses": <BookOpen className="h-4 w-4" />,
  "/admin/learning-paths": <Route className="h-4 w-4" />,
  "/admin/enrollments": <UserCheck className="h-4 w-4" />,
  "/admin/enrollment-rules": <Zap className="h-4 w-4" />,
  "/admin/questions": <HelpCircle className="h-4 w-4" />,
  "/admin/quizzes": <BarChart3 className="h-4 w-4" />,
  "/admin/sites": <Building2 className="h-4 w-4" />,
  "/admin/progress": <TrendingUp className="h-4 w-4" />,
  "/admin/certifications": <Award className="h-4 w-4" />,
  "/admin/alerts": <Bell className="h-4 w-4" />,
  "/login": <LogIn className="h-4 w-4" />,
  "/register": <UserPlus className="h-4 w-4" />,
}

export function AppHeader() {
  const pathname = usePathname()

  // Generar breadcrumb dinámicamente
  const pathSegments = pathname.split("/").filter(Boolean)
  const breadcrumbItems: { href: string; label: string; icon?: React.ReactNode }[] = []

  let currentPath = ""
  pathSegments.forEach((segment) => {
    currentPath += `/${segment}`
    const label = routeNames[currentPath] || segment.charAt(0).toUpperCase() + segment.slice(1)
    const icon = routeIcons[currentPath]
    breadcrumbItems.push({ href: currentPath, label, icon })
  })

  return (
    <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 transition-[width,height] ease-linear sticky top-0 z-50">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 h-4" />
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard" className="flex items-center gap-2">
              <LayoutDashboard className="h-4 w-4" />
              <span>Inicio</span>
            </BreadcrumbLink>
          </BreadcrumbItem>
          {breadcrumbItems.length > 0 && <BreadcrumbSeparator />}
          {breadcrumbItems.map((item, index) => (
            <React.Fragment key={item.href}>
              <BreadcrumbItem>
                {index === breadcrumbItems.length - 1 ? (
                  <BreadcrumbPage className="flex items-center gap-2">
                    {item.icon}
                    <span>{item.label}</span>
                  </BreadcrumbPage>
                ) : (
                  <BreadcrumbLink href={item.href} className="flex items-center gap-2">
                    {item.icon}
                    <span>{item.label}</span>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {index < breadcrumbItems.length - 1 && <BreadcrumbSeparator />}
            </React.Fragment>
          ))}
        </BreadcrumbList>
      </Breadcrumb>
    </header>
  )
}
