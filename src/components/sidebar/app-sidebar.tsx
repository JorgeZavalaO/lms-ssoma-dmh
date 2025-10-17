"use client"

import * as React from "react"
import { useSession } from "next-auth/react"
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
} from "lucide-react"
import Link from "next/link"
import { NavUser } from "./nav-user"
import { NotificationsBadge } from "@/components/notifications-badge"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { data: session } = useSession()

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <div className="flex items-center justify-center px-2 py-3">
          <span className="text-sm font-semibold group-data-[collapsible=icon]:hidden">LMS SSOMA</span>
          <span className="hidden text-xs font-bold group-data-[collapsible=icon]:block">LS</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navegación</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Dashboard">
                <Link href="/dashboard">
                  <LayoutDashboard className="h-4 w-4" />
                  <span>Dashboard</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>

            {/* Student/Collaborator section */}
            {session?.user?.role === "COLLABORATOR" && (
              <>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="Mis Cursos">
                    <Link href="/my-courses">
                      <BookOpen className="h-4 w-4" />
                      <span>Mis Cursos</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="Mis Evaluaciones">
                    <Link href="/evaluations">
                      <FileText className="h-4 w-4" />
                      <span>Evaluaciones</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="Mis Certificados">
                    <Link href="/my-certificates">
                      <Award className="h-4 w-4" />
                      <span>Certificados</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="Notificaciones">
                    <div className="flex items-center w-full">
                      <Link href="/notifications" className="flex items-center flex-1 gap-2">
                        <Bell className="h-4 w-4" />
                        <span>Notificaciones</span>
                      </Link>
                      <NotificationsBadge />
                    </div>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="Mi Perfil">
                    <Link href="/profile">
                      <Users className="h-4 w-4" />
                      <span>Perfil</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </>
            )}

            {/* Admin section: visible to ADMIN/SUPERADMIN */}
            {(session?.user?.role === "ADMIN" || session?.user?.role === "SUPERADMIN") && (
              <Collapsible
                asChild
                defaultOpen={false}
                className="group/collapsible"
              >
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton tooltip="Administración">
                      <Settings className="h-4 w-4" />
                      <span>Administración</span>
                      <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {/* Sección: Gestión Organizacional */}
                      <div className="px-2 py-2">
                        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Organizacional
                        </div>
                      </div>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton asChild>
                          <Link href="/admin/collaborators">
                            <Users className="h-4 w-4" />
                            <span>Colaboradores</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton asChild>
                          <Link href="/admin/areas">
                            <MapPin className="h-4 w-4" />
                            <span>Áreas</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton asChild>
                          <Link href="/admin/positions">
                            <Briefcase className="h-4 w-4" />
                            <span>Puestos</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton asChild>
                          <Link href="/admin/sites">
                            <Building2 className="h-4 w-4" />
                            <span>Sedes</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>

                      {/* Sección: Catálogo de Cursos */}
                      <div className="px-2 py-2 mt-2">
                        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Catálogo de Cursos
                        </div>
                      </div>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton asChild>
                          <Link href="/admin/courses">
                            <BookOpen className="h-4 w-4" />
                            <span>Cursos</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton asChild>
                          <Link href="/admin/learning-paths">
                            <Route className="h-4 w-4" />
                            <span>Rutas de Aprendizaje</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>

                      {/* Sección: Inscripciones y Accesos */}
                      <div className="px-2 py-2 mt-2">
                        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Inscripciones y Accesos
                        </div>
                      </div>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton asChild>
                          <Link href="/admin/enrollments">
                            <UserCheck className="h-4 w-4" />
                            <span>Inscripciones</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton asChild>
                          <Link href="/admin/enrollment-rules">
                            <Zap className="h-4 w-4" />
                            <span>Reglas Automáticas</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>

                      {/* Sección: Evaluaciones y Contenido */}
                      <div className="px-2 py-2 mt-2">
                        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Evaluaciones
                        </div>
                      </div>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton asChild>
                          <Link href="/admin/questions">
                            <HelpCircle className="h-4 w-4" />
                            <span>Banco de Preguntas</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton asChild>
                          <Link href="/admin/quizzes">
                            <BarChart3 className="h-4 w-4" />
                            <span>Exámenes</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>

                      {/* Sección: Reportes y Análisis */}
                      <div className="px-2 py-2 mt-2">
                        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Reportes y Análisis
                        </div>
                      </div>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton asChild>
                          <Link href="/reports/dashboard">
                            <LineChart className="h-4 w-4" />
                            <span>Dashboard (J)</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton asChild>
                          <Link href="/reports/area">
                            <BarChart3 className="h-4 w-4" />
                            <span>Por Área (J)</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton asChild>
                          <Link href="/reports/course">
                            <FileText className="h-4 w-4" />
                            <span>Por Curso (J)</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton asChild>
                          <Link href="/reports/compliance">
                            <Award className="h-4 w-4" />
                            <span>Cumplimiento (J)</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>

                      {/* Sección: Notificaciones */}
                      <div className="px-2 py-2 mt-2">
                        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Notificaciones
                        </div>
                      </div>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton asChild>
                          <Link href="/admin/notification-templates">
                            <Mail className="h-4 w-4" />
                            <span>Plantillas (I)</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>

                      {/* Sección: Progreso y Cumplimiento */}
                      <div className="px-2 py-2 mt-2">
                        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Progreso y Cumplimiento
                        </div>
                      </div>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton asChild>
                          <Link href="/admin/progress">
                            <TrendingUp className="h-4 w-4" />
                            <span>Tracking de Avance</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton asChild>
                          <Link href="/admin/certifications">
                            <Award className="h-4 w-4" />
                            <span>Certificaciones</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton asChild>
                          <Link href="/admin/certificates">
                            <Shield className="h-4 w-4" />
                            <span>Certificados (K)</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton asChild>
                          <Link href="/admin/alerts">
                            <Bell className="h-4 w-4" />
                            <span>Alertas</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
            )}
          </SidebarMenu>
        </SidebarGroup>

        {/* Auth section: shown when no session */}
        {!session && (
          <SidebarGroup>
            <SidebarGroupLabel>Cuenta</SidebarGroupLabel>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Iniciar sesión">
                  <Link href="/login">
                    <Users className="h-4 w-4" />
                    <span>Iniciar sesión</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Registrarse">
                  <Link href="/register">
                    <FileText className="h-4 w-4" />
                    <span>Registrarse</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>
        )}
      </SidebarContent>
      <SidebarFooter>
        <NavUser userProp={{ name: "Usuario", email: "", avatar: "" }} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
