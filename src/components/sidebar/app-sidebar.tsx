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
} from "@/components/ui/sidebar"
import {
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
import { Separator } from "@/components/ui/separator"
import {
  ChevronRight,
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
  Activity,
  UserCog,
  LogIn,
  UserPlus,
} from "lucide-react"
import Link from "next/link"
import { NavUser } from "./nav-user"
import { NotificationsBadge } from "@/components/notifications/notifications-badge"
import { cn } from "@/lib/utils"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { data: session } = useSession()
  const pathname = usePathname()
  const [mounted, setMounted] = React.useState(false)
  const [isAdminMenuOpen, setIsAdminMenuOpen] = React.useState(false)

  // Cargar estado del menú desde localStorage
  React.useEffect(() => {
    setMounted(true)
    const savedState = localStorage.getItem('sidebar-admin-menu-open')
    if (savedState !== null) {
      setIsAdminMenuOpen(savedState === 'true')
    }
  }, [])

  // Guardar estado cuando cambie
  const handleAdminMenuToggle = (open: boolean) => {
    setIsAdminMenuOpen(open)
    localStorage.setItem('sidebar-admin-menu-open', String(open))
  }

  const isActive = (path: string) => pathname === path

  // Mostrar sidebar aunque la sesión aún no esté cargada
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="border-b">
        <div className="flex items-center gap-2 px-4 py-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-blue-800 text-white shadow-sm group-data-[collapsible=icon]:h-6 group-data-[collapsible=icon]:w-6">
            <GraduationCap className="h-5 w-5 group-data-[collapsible=icon]:h-4 group-data-[collapsible=icon]:w-4" />
          </div>
          <div className="flex flex-col group-data-[collapsible=icon]:hidden">
            <span className="text-sm font-bold">LMS SSOMA</span>
            <span className="text-xs text-muted-foreground">Sistema de Gestión</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent className="overflow-y-auto">
        {/* Principal Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold uppercase tracking-wider">
            Principal
          </SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton 
                asChild 
                tooltip="Dashboard Principal"
                isActive={isActive("/dashboard")}
              >
                <Link href="/dashboard" className={cn(
                  "transition-colors",
                  isActive("/dashboard") && "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                )}>
                  <LayoutDashboard className="h-4 w-4" />
                  <span>Dashboard</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>

            {/* ADMIN Dashboard */}
            {mounted && (session?.user?.role === "ADMIN" || session?.user?.role === "SUPERADMIN") && (
              <SidebarMenuItem>
                <SidebarMenuButton 
                  asChild 
                  tooltip="Panel de Administración"
                  isActive={isActive("/admin/dashboard")}
                >
                  <Link href="/admin/dashboard" className={cn(
                    "transition-colors",
                    isActive("/admin/dashboard") && "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                  )}>
                    <Activity className="h-4 w-4" />
                    <span>Panel Admin</span>
                    <Badge variant="secondary" className="ml-auto text-xs">
                      Admin
                    </Badge>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )}
          </SidebarMenu>
        </SidebarGroup>

        <Separator className="my-2" />

        {/* Collaborator Section */}
        {mounted && session?.user?.role === "COLLABORATOR" && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-xs font-semibold uppercase tracking-wider">
              Mi Aprendizaje
            </SidebarGroupLabel>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  asChild 
                  tooltip="Mis Cursos Asignados"
                  isActive={isActive("/my-courses")}
                >
                  <Link href="/my-courses" className={cn(
                    "transition-colors",
                    isActive("/my-courses") && "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                  )}>
                    <BookOpen className="h-4 w-4" />
                    <span>Mis Cursos</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  asChild 
                  tooltip="Mi Ruta de Aprendizaje"
                  isActive={isActive("/my-learning-paths")}
                >
                  <Link href="/my-learning-paths" className={cn(
                    "transition-colors",
                    isActive("/my-learning-paths") && "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                  )}>
                    <Route className="h-4 w-4" />
                    <span>Mi Ruta</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  asChild 
                  tooltip="Mis Evaluaciones"
                  isActive={isActive("/evaluations")}
                >
                  <Link href="/evaluations" className={cn(
                    "transition-colors",
                    isActive("/evaluations") && "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                  )}>
                    <ClipboardList className="h-4 w-4" />
                    <span>Evaluaciones</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  asChild 
                  tooltip="Mis Certificados"
                  isActive={isActive("/my-certificates")}
                >
                  <Link href="/my-certificates" className={cn(
                    "transition-colors",
                    isActive("/my-certificates") && "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                  )}>
                    <Award className="h-4 w-4" />
                    <span>Certificados</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  asChild 
                  tooltip="Notificaciones"
                  isActive={isActive("/notifications")}
                >
                  <Link href="/notifications" className={cn(
                    "flex items-center transition-colors",
                    isActive("/notifications") && "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                  )}>
                    <Bell className="h-4 w-4" />
                    <span>Notificaciones</span>
                    <NotificationsBadge />
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  asChild 
                  tooltip="Mi Perfil"
                  isActive={isActive("/profile")}
                >
                  <Link href="/profile" className={cn(
                    "transition-colors",
                    isActive("/profile") && "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                  )}>
                    <UserCog className="h-4 w-4" />
                    <span>Mi Perfil</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>
        )}

        {/* Admin section: visible to ADMIN/SUPERADMIN */}
        {mounted && (session?.user?.role === "ADMIN" || session?.user?.role === "SUPERADMIN") && (
          <>
            <Separator className="my-2" />
            <SidebarGroup>
              <SidebarGroupLabel className="text-xs font-semibold uppercase tracking-wider">
                Administración
              </SidebarGroupLabel>
              <SidebarMenu>
                <Collapsible
                  open={isAdminMenuOpen}
                  onOpenChange={handleAdminMenuToggle}
                  className="group/collapsible"
                >
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton 
                        tooltip="Administración"
                        className={cn(
                          "hover:bg-sidebar-accent/80",
                          isAdminMenuOpen && "bg-sidebar-accent/50"
                        )}
                      >
                        <Settings className="h-4 w-4" />
                        <span>Gestión</span>
                        <ChevronRight className="ml-auto h-4 w-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="transition-all duration-200 data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
                      <SidebarMenuSub className="border-l-2 border-sidebar-border ml-3 pl-2 space-y-1">
                      {/* Sección: Gestión Organizacional */}
                      <div className="px-3 py-2 mt-1">
                        <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                          Organizacional
                        </div>
                      </div>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton 
                          asChild
                          isActive={isActive("/admin/collaborators")}
                        >
                          <Link 
                            href="/admin/collaborators"
                            className={cn(
                              "hover:bg-sidebar-accent/60 transition-colors rounded-md",
                              isActive("/admin/collaborators") && "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                            )}
                          >
                            <Users className="h-4 w-4" />
                            <span>Colaboradores</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton 
                          asChild
                          isActive={isActive("/admin/areas")}
                        >
                          <Link 
                            href="/admin/areas"
                            className={cn(
                              "hover:bg-sidebar-accent/60 transition-colors rounded-md",
                              isActive("/admin/areas") && "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                            )}
                          >
                            <MapPin className="h-4 w-4" />
                            <span>Áreas</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton 
                          asChild
                          isActive={isActive("/admin/positions")}
                        >
                          <Link 
                            href="/admin/positions"
                            className={cn(
                              "hover:bg-sidebar-accent/60 transition-colors rounded-md",
                              isActive("/admin/positions") && "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                            )}
                          >
                            <Briefcase className="h-4 w-4" />
                            <span>Puestos</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton 
                          asChild
                          isActive={isActive("/admin/sites")}
                        >
                          <Link 
                            href="/admin/sites"
                            className={cn(
                              "hover:bg-sidebar-accent/60 transition-colors rounded-md",
                              isActive("/admin/sites") && "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                            )}
                          >
                            <Building2 className="h-4 w-4" />
                            <span>Sedes</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>

                      {/* Sección: Catálogo de Cursos */}
                      <div className="px-3 py-2 mt-3">
                        <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                          Catálogo
                        </div>
                      </div>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton 
                          asChild
                          isActive={isActive("/admin/courses")}
                        >
                          <Link 
                            href="/admin/courses"
                            className={cn(
                              "hover:bg-sidebar-accent/60 transition-colors rounded-md",
                              isActive("/admin/courses") && "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                            )}
                          >
                            <BookOpen className="h-4 w-4" />
                            <span>Cursos</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton 
                          asChild
                          isActive={isActive("/admin/learning-paths")}
                        >
                          <Link 
                            href="/admin/learning-paths"
                            className={cn(
                              "hover:bg-sidebar-accent/60 transition-colors rounded-md",
                              isActive("/admin/learning-paths") && "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                            )}
                          >
                            <Route className="h-4 w-4" />
                            <span>Rutas de Aprendizaje</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>

                      {/* Sección: Inscripciones y Accesos */}
                      <div className="px-3 py-2 mt-3">
                        <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                          Inscripciones
                        </div>
                      </div>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton 
                          asChild
                          isActive={isActive("/admin/enrollments")}
                        >
                          <Link 
                            href="/admin/enrollments"
                            className={cn(
                              "hover:bg-sidebar-accent/60 transition-colors rounded-md",
                              isActive("/admin/enrollments") && "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                            )}
                          >
                            <UserCheck className="h-4 w-4" />
                            <span>Inscripciones</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton 
                          asChild
                          isActive={isActive("/admin/enrollment-rules")}
                        >
                          <Link 
                            href="/admin/enrollment-rules"
                            className={cn(
                              "hover:bg-sidebar-accent/60 transition-colors rounded-md",
                              isActive("/admin/enrollment-rules") && "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                            )}
                          >
                            <Zap className="h-4 w-4" />
                            <span>Reglas Automáticas</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>

                      {/* Sección: Evaluaciones y Contenido */}
                      <div className="px-3 py-2 mt-3">
                        <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                          Evaluaciones
                        </div>
                      </div>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton 
                          asChild
                          isActive={isActive("/admin/questions")}
                        >
                          <Link 
                            href="/admin/questions"
                            className={cn(
                              "hover:bg-sidebar-accent/60 transition-colors rounded-md",
                              isActive("/admin/questions") && "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                            )}
                          >
                            <HelpCircle className="h-4 w-4" />
                            <span>Banco de Preguntas</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton 
                          asChild
                          isActive={isActive("/admin/quizzes")}
                        >
                          <Link 
                            href="/admin/quizzes"
                            className={cn(
                              "hover:bg-sidebar-accent/60 transition-colors rounded-md",
                              isActive("/admin/quizzes") && "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                            )}
                          >
                            <BarChart3 className="h-4 w-4" />
                            <span>Exámenes</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton 
                          asChild
                          isActive={isActive("/admin/quiz-attempts")}
                        >
                          <Link 
                            href="/admin/quiz-attempts"
                            className={cn(
                              "hover:bg-sidebar-accent/60 transition-colors rounded-md",
                              isActive("/admin/quiz-attempts") && "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                            )}
                          >
                            <FileText className="h-4 w-4" />
                            <span>Intentos de Evaluación</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>

                      {/* Sección: Reportes y Análisis */}
                      <div className="px-3 py-2 mt-3">
                        <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                          Reportes y Análisis
                        </div>
                      </div>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton 
                          asChild
                          isActive={isActive("/reports/dashboard")}
                        >
                          <Link 
                            href="/reports/dashboard"
                            className={cn(
                              "hover:bg-sidebar-accent/60 transition-colors rounded-md",
                              isActive("/reports/dashboard") && "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                            )}
                          >
                            <LineChart className="h-4 w-4" />
                            <span>Dashboard</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton 
                          asChild
                          isActive={isActive("/reports/area")}
                        >
                          <Link 
                            href="/reports/area"
                            className={cn(
                              "hover:bg-sidebar-accent/60 transition-colors rounded-md",
                              isActive("/reports/area") && "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                            )}
                          >
                            <BarChart3 className="h-4 w-4" />
                            <span>Por Área</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton 
                          asChild
                          isActive={isActive("/reports/course")}
                        >
                          <Link 
                            href="/reports/course"
                            className={cn(
                              "hover:bg-sidebar-accent/60 transition-colors rounded-md",
                              isActive("/reports/course") && "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                            )}
                          >
                            <FileText className="h-4 w-4" />
                            <span>Por Curso</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton 
                          asChild
                          isActive={isActive("/reports/compliance")}
                        >
                          <Link 
                            href="/reports/compliance"
                            className={cn(
                              "hover:bg-sidebar-accent/60 transition-colors rounded-md",
                              isActive("/reports/compliance") && "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                            )}
                          >
                            <Award className="h-4 w-4" />
                            <span>Cumplimiento</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>

                      {/* Sección: Notificaciones */}
                      <div className="px-3 py-2 mt-3">
                        <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                          Comunicación
                        </div>
                      </div>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton 
                          asChild
                          isActive={isActive("/admin/notification-templates")}
                        >
                          <Link 
                            href="/admin/notification-templates"
                            className={cn(
                              "hover:bg-sidebar-accent/60 transition-colors rounded-md",
                              isActive("/admin/notification-templates") && "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                            )}
                          >
                            <Mail className="h-4 w-4" />
                            <span>Plantillas</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>

                      {/* Sección: Progreso y Cumplimiento */}
                      <div className="px-3 py-2 mt-3">
                        <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                          Seguimiento
                        </div>
                      </div>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton 
                          asChild
                          isActive={isActive("/admin/progress")}
                        >
                          <Link 
                            href="/admin/progress"
                            className={cn(
                              "hover:bg-sidebar-accent/60 transition-colors rounded-md",
                              isActive("/admin/progress") && "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                            )}
                          >
                            <TrendingUp className="h-4 w-4" />
                            <span>Tracking de Avance</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton 
                          asChild
                          isActive={isActive("/admin/alerts")}
                        >
                          <Link 
                            href="/admin/alerts"
                            className={cn(
                              "hover:bg-sidebar-accent/60 transition-colors rounded-md",
                              isActive("/admin/alerts") && "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                            )}
                          >
                            <AlertCircle className="h-4 w-4" />
                            <span>Alertas Críticas</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton 
                          asChild
                          isActive={isActive("/admin/certifications")}
                        >
                          <Link 
                            href="/admin/certifications"
                            className={cn(
                              "hover:bg-sidebar-accent/60 transition-colors rounded-md",
                              isActive("/admin/certifications") && "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                            )}
                          >
                            <Award className="h-4 w-4" />
                            <span>Certificaciones</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>

                {/* SUPERADMIN only section */}
                {mounted && session?.user?.role === "SUPERADMIN" && (
                  <>
                    <Separator className="my-2" />
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
                  </>
                )}
              </SidebarMenu>
            </SidebarGroup>
          </>
        )}        {/* Auth section: shown when no session */}
        {mounted && !session && (
          <>
            <Separator className="my-2" />
            <SidebarGroup>
              <SidebarGroupLabel className="text-xs font-semibold uppercase tracking-wider">
                Cuenta
              </SidebarGroupLabel>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="Iniciar sesión">
                    <Link href="/login">
                      <LogIn className="h-4 w-4" />
                      <span>Iniciar sesión</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="Registrarse">
                    <Link href="/register">
                      <UserPlus className="h-4 w-4" />
                      <span>Registrarse</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroup>
          </>
        )}
      </SidebarContent>
      <SidebarFooter>
        <NavUser userProp={{ name: "Usuario", email: "", avatar: "" }} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
