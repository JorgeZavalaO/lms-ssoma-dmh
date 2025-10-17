"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useForm } from "react-hook-form"
import { CollaboratorSchema, UpdateCollaboratorSchema } from "@/validations/collaborators"
import { toast } from "sonner"
import { Checkbox } from "@/components/ui/checkbox"
import { Copy, Eye, EyeOff, RefreshCw } from "lucide-react"

type Site = { id: string; code: string; name: string }
type Area = { id: string; code: string; name: string }
type Position = { id: string; name: string; areaId: string }

interface CreateCollaboratorDialogProps {
  onCreated: () => void
}

interface EditCollaboratorDialogProps {
  collaborator: {
    id: string
    dni: string
    fullName: string
    email: string
    status: "ACTIVE" | "INACTIVE"
    entryDate: string
    site?: { code: string } | null
    area?: { code: string } | null
    position?: { name: string } | null
    user?: { role: string } | null
  }
  onEdited: () => void
}

interface DeleteCollaboratorDialogProps {
  collaborator: { id: string; fullName: string }
  onDeleted: () => void
}

export function CreateCollaboratorDialog({ onCreated }: CreateCollaboratorDialogProps) {
  const [open, setOpen] = React.useState(false)
  const [sites, setSites] = React.useState<Site[]>([])
  const [areas, setAreas] = React.useState<Area[]>([])
  const [positions, setPositions] = React.useState<Position[]>([])
  const [loading, setLoading] = React.useState(false)
  const [createUser, setCreateUser] = React.useState(true)
  const [showPassword, setShowPassword] = React.useState(false)
  const [generatedPassword, setGeneratedPassword] = React.useState<string | null>(null)

  const form = useForm<any>({
    defaultValues: {
      dni: "",
      fullName: "",
      email: "",
      siteCode: null as string | null,
      areaCode: null as string | null,
      positionName: null as string | null,
      status: "ACTIVE" as "ACTIVE" | "INACTIVE",
      entryDate: new Date().toISOString().split('T')[0],
      createUser: true,
      password: "",
      role: "COLLABORATOR" as "COLLABORATOR" | "ADMIN" | "SUPERADMIN",
    },
  })

  React.useEffect(() => {
    if (open) {
      // Cargar opciones
      Promise.all([
        fetch("/api/sites").then(r => r.json()),
        fetch("/api/areas").then(r => r.json()),
        fetch("/api/positions").then(r => r.json()),
      ]).then(([sitesData, areasData, positionsData]) => {
        setSites(sitesData)
        setAreas(areasData)
        setPositions(positionsData)
      })
    }
  }, [open])

  const generatePassword = () => {
    const length = 8
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
    let password = ""
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length))
    }
    form.setValue("password", password)
  }

  const onSubmit = async (data: unknown) => {
    const dataObj = data as Record<string, unknown>
    const payload = {
      ...dataObj,
      entryDate: new Date(dataObj.entryDate as string),
      createUser,
    }
    const validated = CollaboratorSchema.parse(payload)
    setLoading(true)
    try {
      const res = await fetch("/api/collaborators", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Error creating collaborator")
      }
      const result = await res.json()
      
      // Si se generó una contraseña, mostrarla
      if (result.generatedPassword) {
        setGeneratedPassword(result.generatedPassword)
        toast.success("Colaborador creado. ¡Guarda la contraseña generada!")
      } else {
        toast.success("Colaborador creado exitosamente")
        setOpen(false)
        form.reset()
        onCreated()
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error desconocido")
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success("Contraseña copiada al portapapeles")
  }

  const closeAndReset = () => {
    setGeneratedPassword(null)
    setOpen(false)
    form.reset()
    setCreateUser(true)
    onCreated()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Crear Colaborador</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Crear Colaborador</DialogTitle>
          <DialogDescription>
            Agrega un nuevo colaborador al sistema.
          </DialogDescription>
        </DialogHeader>
        
        {generatedPassword ? (
          <div className="space-y-4">
            <div className="rounded-lg border border-yellow-500 bg-yellow-50 p-4">
              <h3 className="font-semibold text-yellow-900 mb-2">⚠️ Contraseña Generada</h3>
              <p className="text-sm text-yellow-800 mb-3">
                Guarda esta contraseña. No se mostrará nuevamente.
              </p>
              <div className="flex items-center gap-2">
                <code className="flex-1 rounded bg-white px-3 py-2 text-lg font-mono border">
                  {generatedPassword}
                </code>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard(generatedPassword)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={closeAndReset}>Entendido</Button>
            </DialogFooter>
          </div>
        ) : (
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="dni" className="text-right">
                DNI
              </Label>
              <Input
                id="dni"
                {...form.register("dni")}
                className="col-span-3"
                placeholder="12345678"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="fullName" className="text-right">
                Nombre Completo
              </Label>
              <Input
                id="fullName"
                {...form.register("fullName")}
                className="col-span-3"
                placeholder="Juan Pérez"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                {...form.register("email")}
                className="col-span-3"
                placeholder="juan@example.com"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="entryDate" className="text-right">
                Fecha de Ingreso
              </Label>
              <Input
                id="entryDate"
                type="date"
                value={form.watch("entryDate")}
                onChange={(e) => form.setValue("entryDate", e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="siteCode" className="text-right">
                Sede
              </Label>
              <Select onValueChange={(value) => form.setValue("siteCode", value === "none" ? null : value)}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Seleccionar sede" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Ninguna</SelectItem>
                  {sites.map((site) => (
                    <SelectItem key={site.id} value={site.code}>
                      {site.code} - {site.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="areaCode" className="text-right">
                Área
              </Label>
              <Select onValueChange={(value) => form.setValue("areaCode", value === "none" ? null : value)}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Seleccionar área" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Ninguna</SelectItem>
                  {areas.map((area) => (
                    <SelectItem key={area.id} value={area.code}>
                      {area.code} - {area.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="positionName" className="text-right">
                Puesto
              </Label>
              <Select onValueChange={(value) => form.setValue("positionName", value === "none" ? null : value)}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Seleccionar puesto" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Ninguno</SelectItem>
                  {positions.map((position) => (
                    <SelectItem key={position.id} value={position.name}>
                      {position.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="status" className="text-right">
                Estado
              </Label>
              <Select onValueChange={(value) => form.setValue("status", value as "ACTIVE" | "INACTIVE")}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Seleccionar estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Activo</SelectItem>
                  <SelectItem value="INACTIVE">Inactivo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Sección de Cuenta de Usuario */}
            <div className="border-t pt-4 space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="createUser"
                  checked={createUser}
                  onCheckedChange={(checked) => {
                    setCreateUser(checked as boolean)
                    form.setValue("createUser", checked as boolean)
                  }}
                />
                <Label htmlFor="createUser" className="text-sm font-medium cursor-pointer">
                  Crear cuenta de usuario
                </Label>
              </div>

              {createUser && (
                <>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="role" className="text-right">
                      Rol
                    </Label>
                    <Select 
                      value={form.watch("role")}
                      onValueChange={(value) => form.setValue("role", value as "COLLABORATOR" | "ADMIN" | "SUPERADMIN")}
                    >
                      <SelectTrigger className="col-span-3">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="COLLABORATOR">Colaborador</SelectItem>
                        <SelectItem value="ADMIN">Administrador</SelectItem>
                        <SelectItem value="SUPERADMIN">Super Administrador</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="password" className="text-right">
                      Contraseña
                    </Label>
                    <div className="col-span-3 space-y-2">
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            {...form.register("password")}
                            placeholder="Dejar vacío para generar automáticamente"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-2 top-1/2 -translate-y-1/2"
                          >
                            {showPassword ? <EyeOff className="h-4 w-4 text-gray-500" /> : <Eye className="h-4 w-4 text-gray-500" />}
                          </button>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={generatePassword}
                          title="Generar contraseña"
                        >
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Si no ingresas una contraseña, se generará una automáticamente.
                      </p>
                    </div>
                  </div>
                </>
              )}
            </div>

            <DialogFooter>
              <Button type="submit" disabled={loading}>
                {loading ? "Creando..." : "Crear"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}

export function EditCollaboratorDialog({ collaborator, onEdited }: EditCollaboratorDialogProps) {
  const [open, setOpen] = React.useState(false)
  const [sites, setSites] = React.useState<Site[]>([])
  const [areas, setAreas] = React.useState<Area[]>([])
  const [positions, setPositions] = React.useState<Position[]>([])
  const [loading, setLoading] = React.useState(false)
  const [updatePassword, setUpdatePassword] = React.useState(false)
  const [showPassword, setShowPassword] = React.useState(false)

  const form = useForm<any>({
    defaultValues: {
      dni: collaborator.dni,
      fullName: collaborator.fullName,
      email: collaborator.email,
      siteCode: collaborator.site?.code || null as string | null,
      areaCode: collaborator.area?.code || null as string | null,
      positionName: collaborator.position?.name || null as string | null,
      status: collaborator.status,
      entryDate: new Date(collaborator.entryDate).toISOString().split('T')[0],
      updatePassword: false,
      password: "",
      role: collaborator.user?.role || "COLLABORATOR" as "COLLABORATOR" | "ADMIN" | "SUPERADMIN",
    },
  })

  React.useEffect(() => {
    if (open) {
      Promise.all([
        fetch("/api/sites").then(r => r.json()),
        fetch("/api/areas").then(r => r.json()),
        fetch("/api/positions").then(r => r.json()),
      ]).then(([sitesData, areasData, positionsData]) => {
        setSites(sitesData)
        setAreas(areasData)
        setPositions(positionsData)
      })
    }
  }, [open])

  const generatePassword = () => {
    const length = 8
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
    let password = ""
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length))
    }
    form.setValue("password", password)
  }

  const onSubmit = async (data: unknown) => {
    const dataObj = data as Record<string, unknown>
    const payload = {
      ...dataObj,
      entryDate: new Date(dataObj.entryDate as string),
      updatePassword,
    }
    const validated = UpdateCollaboratorSchema.parse(payload)
    setLoading(true)
    try {
      const res = await fetch(`/api/collaborators/${collaborator.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Error updating collaborator")
      }
      toast.success("Colaborador actualizado exitosamente")
      setOpen(false)
      setUpdatePassword(false)
      onEdited()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error desconocido")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">Editar</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Colaborador</DialogTitle>
          <DialogDescription>
            Modifica los datos del colaborador.
            {collaborator.user && (
              <span className="block mt-1 text-green-600">
                ✓ Tiene cuenta de usuario ({collaborator.user.role})
              </span>
            )}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="dni" className="text-right">
              DNI
            </Label>
            <Input
              id="dni"
              {...form.register("dni")}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="fullName" className="text-right">
              Nombre Completo
            </Label>
            <Input
              id="fullName"
              {...form.register("fullName")}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="email" className="text-right">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              {...form.register("email")}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="entryDate" className="text-right">
              Fecha de Ingreso
            </Label>
            <Input
              id="entryDate"
              type="date"
              value={form.watch("entryDate")}
              onChange={(e) => form.setValue("entryDate", e.target.value)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="siteCode" className="text-right">
              Sede
            </Label>
            <Select value={form.watch("siteCode") || "none"} onValueChange={(value) => form.setValue("siteCode", value === "none" ? null : value)}>
              <SelectTrigger className="col-span-3">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Ninguna</SelectItem>
                {sites.map((site) => (
                  <SelectItem key={site.id} value={site.code}>
                    {site.code} - {site.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="areaCode" className="text-right">
              Área
            </Label>
            <Select value={form.watch("areaCode") || "none"} onValueChange={(value) => form.setValue("areaCode", value === "none" ? null : value)}>
              <SelectTrigger className="col-span-3">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Ninguna</SelectItem>
                {areas.map((area) => (
                  <SelectItem key={area.id} value={area.code}>
                    {area.code} - {area.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="positionName" className="text-right">
              Puesto
            </Label>
            <Select value={form.watch("positionName") || "none"} onValueChange={(value) => form.setValue("positionName", value === "none" ? null : value)}>
              <SelectTrigger className="col-span-3">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Ninguno</SelectItem>
                {positions.map((position) => (
                  <SelectItem key={position.id} value={position.name}>
                    {position.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="status" className="text-right">
              Estado
            </Label>
            <Select value={form.watch("status")} onValueChange={(value) => form.setValue("status", value as "ACTIVE" | "INACTIVE")}>
              <SelectTrigger className="col-span-3">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ACTIVE">Activo</SelectItem>
                <SelectItem value="INACTIVE">Inactivo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Sección de Gestión de Cuenta */}
          {collaborator.user && (
            <div className="border-t pt-4 space-y-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="role" className="text-right">
                  Rol
                </Label>
                <Select 
                  value={form.watch("role")}
                  onValueChange={(value) => form.setValue("role", value as "COLLABORATOR" | "ADMIN" | "SUPERADMIN")}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="COLLABORATOR">Colaborador</SelectItem>
                    <SelectItem value="ADMIN">Administrador</SelectItem>
                    <SelectItem value="SUPERADMIN">Super Administrador</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="updatePassword"
                  checked={updatePassword}
                  onCheckedChange={(checked) => {
                    setUpdatePassword(checked as boolean)
                    form.setValue("updatePassword", checked as boolean)
                    if (!checked) {
                      form.setValue("password", "")
                    }
                  }}
                />
                <Label htmlFor="updatePassword" className="text-sm font-medium cursor-pointer">
                  Cambiar contraseña
                </Label>
              </div>

              {updatePassword && (
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="password" className="text-right">
                    Nueva Contraseña
                  </Label>
                  <div className="col-span-3 space-y-2">
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          {...form.register("password")}
                          placeholder="Ingresa la nueva contraseña"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-2 top-1/2 -translate-y-1/2"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4 text-gray-500" /> : <Eye className="h-4 w-4 text-gray-500" />}
                        </button>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={generatePassword}
                        title="Generar contraseña"
                      >
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading ? "Actualizando..." : "Actualizar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

interface DeleteCollaboratorDialogProps {
  collaborator: { id: string; fullName: string }
  onDeleted: () => void
}

export function DeleteCollaboratorDialog({ collaborator, onDeleted }: DeleteCollaboratorDialogProps) {
  const [open, setOpen] = React.useState(false)
  const [loading, setLoading] = React.useState(false)

  const onConfirm = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/collaborators/${collaborator.id}`, {
        method: "DELETE",
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Error deleting collaborator")
      }
      toast.success("Colaborador eliminado exitosamente")
      setOpen(false)
      onDeleted()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error desconocido")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive" size="sm">Eliminar</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Eliminar Colaborador</DialogTitle>
          <DialogDescription>
            ¿Estás seguro de que quieres eliminar a {collaborator.fullName}? Esta acción no se puede deshacer.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button variant="destructive" onClick={onConfirm} disabled={loading}>
            {loading ? "Eliminando..." : "Eliminar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}