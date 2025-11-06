"use client"

import { useEffect, useState, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { 
  Shield, 
  Database, 
  Users, 
  Trash2, 
  RefreshCw,
  HardDrive,
  Activity,
  UserPlus,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react"
import { toast } from "sonner"
import { format } from "date-fns"
import { es } from "date-fns/locale"

interface SystemStats {
  database: {
    size: string
    tables: number
    records: number
  }
  users: {
    total: number
    superadmins: number
    admins: number
    collaborators: number
    active: number
  }
  content: {
    courses: number
    learningPaths: number
    questions: number
    quizzes: number
  }
  progress: {
    enrollments: number
    certifications: number
    completedCourses: number
  }
}

interface AdminUser {
  id: string
  name: string | null
  email: string
  role: string
  createdAt: string
  lastLogin: string | null
}

export function ClientSuperAdmin() {
  const [stats, setStats] = useState<SystemStats | null>(null)
  const [admins, setAdmins] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [cleaningData, setCleaningData] = useState(false)
  const [showCleanDialog, setShowCleanDialog] = useState(false)
  const [showAddAdminDialog, setShowAddAdminDialog] = useState(false)
  const [confirmText, setConfirmText] = useState("")
  
  // Formulario nuevo admin
  const [newAdmin, setNewAdmin] = useState({
    name: "",
    email: "",
    password: "",
    role: "ADMIN" as "ADMIN" | "SUPERADMIN"
  })

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      
      // Cargar estadísticas del sistema
      const statsRes = await fetch("/api/superadmin/stats")
      if (statsRes.ok) {
        const data = await statsRes.json()
        setStats(data.stats)
      }

      // Cargar lista de administradores
      const adminsRes = await fetch("/api/superadmin/admins")
      if (adminsRes.ok) {
        const data = await adminsRes.json()
        setAdmins(data.admins)
      }
    } catch (error) {
      console.error("Error loading superadmin data:", error)
      toast.error("Error al cargar datos del sistema")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleCleanTestData = async () => {
    if (confirmText !== "ELIMINAR TODO EL SISTEMA") {
      toast.error("Debes escribir la frase de confirmación exacta")
      return
    }

    try {
      setCleaningData(true)
      const response = await fetch("/api/superadmin/clean-test-data", {
        method: "POST",
      })

      if (response.ok) {
        const data = await response.json()
        
        // Calcular total de registros eliminados
        const totalDeleted = Object.values(data.deleted).reduce((sum: number, count) => {
          return sum + (typeof count === 'number' ? count : 0)
        }, 0) as number

        toast.success(
          <div className="space-y-2">
            <p className="font-semibold">✓ Sistema limpiado exitosamente</p>
            <p className="text-xs">Total de registros eliminados: {totalDeleted.toLocaleString()}</p>
            {data.details && (
              <div className="text-xs space-y-1 pt-2 border-t">
                <p>📊 Desglose:</p>
                <p>• {data.details.usuarios?.colaboradores || 0} colaboradores</p>
                <p>• {data.details.organizacion?.areas || 0} áreas, {data.details.organizacion?.puestos || 0} puestos, {data.details.organizacion?.sedes || 0} sedes</p>
                <p>• {data.details.contenido?.cursos || 0} cursos, {data.details.contenido?.lecciones || 0} lecciones</p>
                <p>• {data.details.evaluaciones?.preguntas || 0} preguntas, {data.details.evaluaciones?.quizzes || 0} exámenes</p>
              </div>
            )}
          </div>,
          { duration: 8000 }
        )
        setShowCleanDialog(false)
        setConfirmText("")
        loadData()
      } else {
        const error = await response.json()
        toast.error(error.error || "Error al eliminar datos")
      }
    } catch (error) {
      console.error("Error cleaning test data:", error)
      toast.error("Error al procesar la solicitud")
    } finally {
      setCleaningData(false)
    }
  }

  const handleCreateAdmin = async () => {
    if (!newAdmin.name || !newAdmin.email || !newAdmin.password) {
      toast.error("Todos los campos son requeridos")
      return
    }

    try {
      const response = await fetch("/api/superadmin/admins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newAdmin),
      })

      if (response.ok) {
        toast.success("Administrador creado exitosamente")
        setShowAddAdminDialog(false)
        setNewAdmin({ name: "", email: "", password: "", role: "ADMIN" })
        loadData()
      } else {
        const error = await response.json()
        toast.error(error.error || "Error al crear administrador")
      }
    } catch (error) {
      console.error("Error creating admin:", error)
      toast.error("Error al crear administrador")
    }
  }

  const handleDeleteAdmin = async (adminId: string) => {
    if (!confirm("¿Estás seguro de eliminar este administrador?")) {
      return
    }

    try {
      const response = await fetch(`/api/superadmin/admins/${adminId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast.success("Administrador eliminado")
        loadData()
      } else {
        const error = await response.json()
        toast.error(error.error || "Error al eliminar administrador")
      }
    } catch (error) {
      console.error("Error deleting admin:", error)
      toast.error("Error al eliminar administrador")
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Shield className="h-8 w-8 text-red-600" />
            Panel de Superadministrador
          </h1>
          <p className="text-muted-foreground mt-2">
            Control total del sistema, gestión de administradores y mantenimiento de base de datos
          </p>
        </div>
        <Button onClick={loadData} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualizar
        </Button>
      </div>

      {/* Advertencia de acceso privilegiado */}
      <Card className="border-red-200 bg-red-50/50">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <div>
              <p className="font-semibold text-red-900">Zona de Acceso Restringido</p>
              <p className="text-sm text-red-700">
                Las acciones realizadas aquí afectan todo el sistema. Procede con precaución.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Estadísticas del Sistema */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Database className="h-4 w-4 text-blue-600" />
              Base de Datos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.database.size || "N/A"}</div>
            <div className="text-xs text-muted-foreground mt-2 space-y-1">
              <div>{stats?.database.tables || 0} tablas</div>
              <div>{stats?.database.records.toLocaleString() || 0} registros totales</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4 text-emerald-600" />
              Usuarios
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.users.total || 0}</div>
            <div className="text-xs text-muted-foreground mt-2 space-y-1">
              <div>{stats?.users.superadmins || 0} superadmins</div>
              <div>{stats?.users.admins || 0} admins</div>
              <div>{stats?.users.collaborators || 0} colaboradores</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <HardDrive className="h-4 w-4 text-purple-600" />
              Contenido
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.content.courses || 0}</div>
            <div className="text-xs text-muted-foreground mt-2 space-y-1">
              <div>{stats?.content.courses || 0} cursos</div>
              <div>{stats?.content.learningPaths || 0} rutas de aprendizaje</div>
              <div>{stats?.content.questions || 0} preguntas</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Activity className="h-4 w-4 text-orange-600" />
              Actividad
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.progress.enrollments || 0}</div>
            <div className="text-xs text-muted-foreground mt-2 space-y-1">
              <div>{stats?.progress.enrollments || 0} inscripciones</div>
              <div>{stats?.progress.certifications || 0} certificaciones</div>
              <div>{stats?.progress.completedCourses || 0} cursos completados</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Acciones Críticas */}
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trash2 className="h-5 w-5 text-red-600" />
            Zona de Peligro
          </CardTitle>
          <CardDescription>
            Acciones irreversibles que afectan la base de datos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <h4 className="font-semibold text-red-700">Eliminar TODO el Contenido del Sistema</h4>
              <p className="text-sm text-muted-foreground mt-1">
                ⚠️ ELIMINA COMPLETAMENTE: colaboradores, áreas, puestos, sedes, cursos, rutas de aprendizaje,
                preguntas, quizzes, reglas automáticas, inscripciones, certificaciones, progreso y todo el contenido.
              </p>
              <p className="text-xs text-red-600 font-medium mt-2">
                Solo se mantienen: usuarios administrativos (ADMIN y SUPERADMIN)
              </p>
            </div>
            <Button 
              variant="destructive" 
              onClick={() => setShowCleanDialog(true)}
              className="ml-4"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Limpiar Sistema
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Gestión de Administradores */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Administradores del Sistema</CardTitle>
              <CardDescription>
                Gestión de cuentas con permisos administrativos
              </CardDescription>
            </div>
            <Button onClick={() => setShowAddAdminDialog(true)}>
              <UserPlus className="h-4 w-4 mr-2" />
              Nuevo Admin
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Fecha Creación</TableHead>
                <TableHead>Último Acceso</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {admins.map((admin) => (
                <TableRow key={admin.id}>
                  <TableCell className="font-medium">{admin.name || "Sin nombre"}</TableCell>
                  <TableCell>{admin.email}</TableCell>
                  <TableCell>
                    <Badge variant={admin.role === "SUPERADMIN" ? "default" : "secondary"}>
                      {admin.role === "SUPERADMIN" ? (
                        <><Shield className="h-3 w-3 mr-1" /> SUPERADMIN</>
                      ) : (
                        "ADMIN"
                      )}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {format(new Date(admin.createdAt), "dd/MM/yyyy", { locale: es })}
                  </TableCell>
                  <TableCell>
                    {admin.lastLogin 
                      ? format(new Date(admin.lastLogin), "dd/MM/yyyy HH:mm", { locale: es })
                      : "Nunca"
                    }
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteAdmin(admin.id)}
                      disabled={admin.role === "SUPERADMIN"}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog: Confirmar Limpieza de Datos */}
      <AlertDialog open={showCleanDialog} onOpenChange={setShowCleanDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              ¿Eliminar todos los datos de prueba?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="font-semibold text-red-900 mb-2">
                  ⚠️ ADVERTENCIA CRÍTICA: Esta acción es IRREVERSIBLE
                </p>
                <p className="text-sm text-red-700">
                  Se eliminará PERMANENTEMENTE todo el contenido del sistema, dejándolo como recién instalado.
                </p>
              </div>

              <div className="space-y-2">
                <p className="font-semibold text-red-600">SE ELIMINARÁN:</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="space-y-1">
                    <p className="font-medium">👥 Usuarios y Organización:</p>
                    <ul className="list-disc list-inside pl-2 space-y-0.5 text-xs">
                      <li>Todos los colaboradores</li>
                      <li>Todas las áreas</li>
                      <li>Todos los puestos</li>
                      <li>Todas las sedes</li>
                      <li>Reglas de inscripción automática</li>
                    </ul>
                  </div>
                  
                  <div className="space-y-1">
                    <p className="font-medium">📚 Contenido Educativo:</p>
                    <ul className="list-disc list-inside pl-2 space-y-0.5 text-xs">
                      <li>Todos los cursos</li>
                      <li>Todas las rutas de aprendizaje</li>
                      <li>Todas las unidades y lecciones</li>
                      <li>Todas las actividades</li>
                    </ul>
                  </div>
                  
                  <div className="space-y-1">
                    <p className="font-medium">📝 Evaluaciones:</p>
                    <ul className="list-disc list-inside pl-2 space-y-0.5 text-xs">
                      <li>Todas las preguntas del banco</li>
                      <li>Todas las opciones de preguntas</li>
                      <li>Todos los quizzes/exámenes</li>
                      <li>Intentos de evaluaciones</li>
                      <li>Intentos de actividades</li>
                    </ul>
                  </div>
                  
                  <div className="space-y-1">
                    <p className="font-medium">📊 Progreso y Registros:</p>
                    <ul className="list-disc list-inside pl-2 space-y-0.5 text-xs">
                      <li>Todas las inscripciones</li>
                      <li>Todas las certificaciones</li>
                      <li>Todo el progreso de cursos</li>
                      <li>Todo el progreso de lecciones</li>
                      <li>Todas las alertas</li>
                      <li>Todas las notificaciones</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                <p className="font-semibold text-emerald-900 mb-2">
                  ✅ SE MANTENDRÁN únicamente:
                </p>
                <ul className="list-disc list-inside space-y-1 text-sm text-emerald-700">
                  <li>Usuarios ADMIN y SUPERADMIN (tú y otros administradores)</li>
                  <li>Configuraciones del sistema</li>
                  <li>Plantillas de notificaciones</li>
                </ul>
              </div>

              <div className="pt-4 border-t">
                <Label htmlFor="confirm-text" className="text-base">
                  Para confirmar esta acción destructiva, escribe exactamente:
                  <span className="block font-mono font-bold text-red-600 mt-1">
                    ELIMINAR TODO EL SISTEMA
                  </span>
                </Label>
                <Input
                  id="confirm-text"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder="Escribe la frase exacta aquí..."
                  className="mt-2"
                />
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setConfirmText("")}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCleanTestData}
              disabled={cleaningData || confirmText !== "ELIMINAR TODO EL SISTEMA"}
              className="bg-red-600 hover:bg-red-700"
            >
              {cleaningData ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Eliminando todo el sistema...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  ELIMINAR TODO
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog: Crear Nuevo Admin */}
      <Dialog open={showAddAdminDialog} onOpenChange={setShowAddAdminDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Crear Nuevo Administrador</DialogTitle>
            <DialogDescription>
              Agrega un nuevo usuario con permisos administrativos al sistema
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="admin-name">Nombre Completo</Label>
              <Input
                id="admin-name"
                value={newAdmin.name}
                onChange={(e) => setNewAdmin({ ...newAdmin, name: e.target.value })}
                placeholder="Ej: Juan Pérez"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="admin-email">Email</Label>
              <Input
                id="admin-email"
                type="email"
                value={newAdmin.email}
                onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })}
                placeholder="admin@empresa.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="admin-password">Contraseña</Label>
              <Input
                id="admin-password"
                type="password"
                value={newAdmin.password}
                onChange={(e) => setNewAdmin({ ...newAdmin, password: e.target.value })}
                placeholder="Mínimo 8 caracteres"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="admin-role">Rol</Label>
              <select
                id="admin-role"
                value={newAdmin.role}
                onChange={(e) => setNewAdmin({ ...newAdmin, role: e.target.value as "ADMIN" | "SUPERADMIN" })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
              >
                <option value="ADMIN">Administrador</option>
                <option value="SUPERADMIN">Superadministrador</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddAdminDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateAdmin}>
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Crear Admin
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
