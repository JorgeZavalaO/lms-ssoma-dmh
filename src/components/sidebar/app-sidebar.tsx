"use client"

import * as React from "react"
import { useSession } from "next-auth/react"
import { usePathname } from "next/navigation"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Badge } from "@/components/ui/badge"
import {
  ChevronRight,
  LayoutDashboard,
  Users,
  Briefcase,
  MapPin,
  Building2,
  BookOpen,
  Route,
  UserCheck,
  Zap,
  HelpCircle,
  FileText,
  BarChart3,
  TrendingUp,
  Award,
  Bell,
  Shield,
  Mail,
  LineChart,
  AlertCircle,
  GraduationCap,
  ClipboardList,
  HardDrive,
  LogIn,
  History,
  PieChart,
  CheckCircle2,
} from "lucide-react"
import Link from "next/link"
import { NavUser } from "./nav-user"
import { NotificationsBadge } from "@/components/notifications/notifications-badge"
import { cn } from "@/lib/utils"

function NavLink({
  href,
  icon: Icon,
  label,
  pathname,
  badge,
}: {
  href: string
  icon: React.ElementType
  label: string
  pathname: string
  badge?: React.ReactNode
}) {
  const active = pathname === href
  return (
    <SidebarMenuButton asChild tooltip={label} isActive={active}>
      <Link
        href={href}
        className={cn(
          "transition-colors",
          active && "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
        )}
      >
        <Icon className="h-4 w-4" />
        <span>{label}</span>
        {badge}
      </Link>
    </SidebarMenuButton>
  )
}

function SubNavLink({
  href,
  icon: Icon,
  label,
  pathname,
}: {
  href: string
  icon: React.ElementType
  label: string
  pathname: string
}) {
  const active = pathname === href
  return (
    <SidebarMenuSubButton asChild isActive={active}>
      <Link
        href={href}
        className={cn(
          "transition-colors rounded-md",
          active && "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
        )}
      >
        <Icon className="h-3.5 w-3.5 shrink-0" />
        <span>{label}</span>
      </Link>
    </SidebarMenuSubButton>
  )
}

type NavItem = { href: string; icon: React.ElementType; label: string }

function NavSection({
  label,
  icon: Icon,
  items,
  pathname,
  storageKey,
}: {
  label: string
  icon: React.ElementType
  items: NavItem[]
  pathname: string
  storageKey: string
}) {
  const hasActive = items.some((i) => pathname === i.href || pathname.startsWith(i.href + "/"))
  const [open, setOpen] = React.useState(false)

  React.useEffect(() => {
    const saved = localStorage.getItem(storageKey)
    setOpen(saved !== null ? saved === "true" : hasActive)
  }, [])

  const handleToggle = (value: boolean) => {
    setOpen(value)
    localStorage.setItem(storageKey, String(value))
  }

  return (
    <Collapsible open={open} onOpenChange={handleToggle} className="group/collapsible">
      <SidebarMenuItem>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton
            tooltip={label}
            className={cn(
              "hover:bg-sidebar-accent/80",
              hasActive && !open && "bg-sidebar-accent/30 text-sidebar-accent-foreground"
            )}
          >
            <Icon className="h-4 w-4" />
            <span>{label}</span>
            <ChevronRight className="ml-auto h-4 w-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenuSub>
            {items.map((item) => (
              <SidebarMenuSubItem key={item.href}>
                <SubNavLink {...item} pathname={pathname} />
              </SidebarMenuSubItem>
            ))}
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  )
}

const ADMIN_SECTIONS: { label: string; icon: React.ElementType; storageKey: string; items: NavItem[] }[] = [
  {
    label: "Organización",
    icon: Users,
    storageKey: "sidebar-org",
    items: [
      { href: "/admin/collaborators", icon: Users, label: "Colaboradores" },
      { href: "/admin/areas", icon: MapPin, label: "Áreas" },
      { href: "/admin/positions", icon: Briefcase, label: "Puestos" },
      { href: "/admin/sites", icon: Building2, label: "Sedes" },
    ],
  },
  {
    label: "Aprendizaje",
    icon: BookOpen,
    storageKey: "sidebar-learning",
    items: [
      { href: "/admin/courses", icon: BookOpen, label: "Cursos" },
      { href: "/admin/learning-paths", icon: Route, label: "Rutas de Aprendizaje" },
      { href: "/admin/files", icon: HardDrive, label: "Repositorio de Archivos" },
    ],
  },
  {
    label: "Inscripciones",
    icon: UserCheck,
    storageKey: "sidebar-enrollments",
    items: [
      { href: "/admin/enrollments", icon: UserCheck, label: "Inscripciones" },
      { href: "/admin/enrollment-rules", icon: Zap, label: "Reglas Automáticas" },
    ],
  },
  {
    label: "Evaluaciones",
    icon: ClipboardList,
    storageKey: "sidebar-evaluations",
    items: [
      { href: "/admin/questions", icon: HelpCircle, label: "Banco de Preguntas" },
      { href: "/admin/quizzes", icon: ClipboardList, label: "Exámenes" },
      { href: "/admin/quiz-attempts", icon: History, label: "Intentos" },
    ],
  },
  {
    label: "Seguimiento",
    icon: TrendingUp,
    storageKey: "sidebar-tracking",
    items: [
      { href: "/admin/progress", icon: TrendingUp, label: "Avance de Colaboradores" },
      { href: "/admin/certifications", icon: Award, label: "Certificaciones" },
      { href: "/admin/alerts", icon: AlertCircle, label: "Alertas Críticas" },
    ],
  },
  {
    label: "Reportes",
    icon: BarChart3,
    storageKey: "sidebar-reports",
    items: [
      { href: "/reports/dashboard", icon: LineChart, label: "Resumen General" },
      { href: "/reports/area", icon: PieChart, label: "Por Área" },
      { href: "/reports/course", icon: FileText, label: "Por Curso" },
      { href: "/reports/compliance", icon: CheckCircle2, label: "Cumplimiento" },
    ],
  },
  {
    label: "Comunicación",
    icon: Mail,
    storageKey: "sidebar-comms",
    items: [
      { href: "/admin/notification-templates", icon: Mail, label: "Plantillas de Notificación" },
    ],
  },
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { data: session } = useSession()
  const pathname = usePathname()
  const [mounted, setMounted] = React.useState(false)
  const [isAdminMenuOpen, setIsAdminMenuOpen] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
    // legacy key kept for cleanup
    setIsAdminMenuOpen(false)
  }, [])

  const role = session?.user?.role
  const isAdmin = role === "ADMIN" || role === "SUPERADMIN"
  const isCollaborator = role === "COLLABORATOR"

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="border-b">
        <div className="flex items-center gap-2.5 px-4 py-3.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-blue-800 text-white shadow-sm">
            <GraduationCap className="h-5 w-5" />
          </div>
          <div className="flex flex-col group-data-[collapsible=icon]:hidden">
            <span className="text-sm font-bold leading-tight">LMS SSOMA</span>
            <span className="text-xs text-muted-foreground">Sistema de Gestión</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="overflow-y-auto">
        {mounted && isCollaborator && (
          <>
            <SidebarGroup>
              <SidebarMenu>
                <SidebarMenuItem>
                  <NavLink href="/dashboard" icon={LayoutDashboard} label="Dashboard" pathname={pathname} />
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroup>

            <SidebarGroup>
              <SidebarGroupLabel>Mi Aprendizaje</SidebarGroupLabel>
              <SidebarMenu>
                <SidebarMenuItem>
                  <NavLink href="/my-courses" icon={BookOpen} label="Mis Cursos" pathname={pathname} />
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <NavLink href="/my-learning-paths" icon={Route} label="Mi Ruta" pathname={pathname} />
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <NavLink href="/evaluations" icon={ClipboardList} label="Evaluaciones" pathname={pathname} />
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <NavLink href="/my-certificates" icon={Award} label="Certificados" pathname={pathname} />
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroup>

            <SidebarGroup>
              <SidebarGroupLabel>Comunicación</SidebarGroupLabel>
              <SidebarMenu>
                <SidebarMenuItem>
                  <NavLink
                    href="/notifications"
                    icon={Bell}
                    label="Notificaciones"
                    pathname={pathname}
                    badge={<NotificationsBadge />}
                  />
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroup>
          </>
        )}

        {mounted && isAdmin && (
          <>
            <SidebarGroup>
              <SidebarMenu>
                <SidebarMenuItem>
                  <NavLink href="/admin/dashboard" icon={LayoutDashboard} label="Panel Admin" pathname={pathname} />
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroup>

            <SidebarGroup>
              <SidebarGroupLabel>Administración</SidebarGroupLabel>
              <SidebarMenu>
                {ADMIN_SECTIONS.map((section) => (
                  <NavSection key={section.storageKey} {...section} pathname={pathname} />
                ))}
              </SidebarMenu>
            </SidebarGroup>

            {role === "SUPERADMIN" && (
              <SidebarGroup>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild tooltip="Panel SuperAdmin">
                      <Link href="/admin/superadmin">
                        <Shield className="h-4 w-4" />
                        <span>SuperAdmin</span>
                        <Badge variant="destructive" className="ml-auto text-xs">
                          Super
                        </Badge>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroup>
            )}
          </>
        )}

        {mounted && !session && (
          <SidebarGroup>
            <SidebarGroupLabel>Cuenta</SidebarGroupLabel>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Iniciar sesión">
                  <Link href="/login">
                    <LogIn className="h-4 w-4" />
                    <span>Iniciar sesión</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
