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
  const [step, setStep] = React.useState<"info" | "organization" | "account">("info")

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

  const onSubmit = async (data: unknown) => {
    const dataObj = data as Record<string, unknown>
    const payload = {
      ...dataObj,
      entryDate: new Date(dataObj.entryDate as string),
      createUser,
    }
    
    // Validación manual antes de Zod si createUser es true
    if (createUser && (!dataObj.password || String(dataObj.password).trim() === "")) {
      toast.error("La contraseña es obligatoria cuando se crea un usuario")
      return
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
        setStep("info")
        onCreated()
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error desconocido")
    } finally {
      setLoading(false)
    }
  }

  const handleNext = () => {
    if (step === "info") {
      setStep("organization")
    } else if (step === "organization") {
      setStep("account")
    }
  }

  const handlePrev = () => {
    if (step === "organization") setStep("info")
    else if (step === "account") setStep("organization")
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
    setStep("info")
    onCreated()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Crear Colaborador</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Crear Colaborador</DialogTitle>
          <DialogDescription>
            Agrega un nuevo colaborador al sistema en tres pasos sencillos
          </DialogDescription>
        </DialogHeader>
        
        {generatedPassword ? (
          <div className="space-y-6 py-6">
            <div className="rounded-lg border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 p-6">
              <div className="flex items-start gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500 text-white font-bold">✓</div>
                <div>
                  <h3 className="font-bold text-lg text-green-900">¡Colaborador Creado Exitosamente!</h3>
                  <p className="text-sm text-green-700 mt-1">Guarda esta contraseña en un lugar seguro</p>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-4">
                <code className="flex-1 rounded-lg bg-white px-4 py-3 text-lg font-mono border border-green-200 text-center tracking-widest font-semibold">
                  {generatedPassword}
                </code>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard(generatedPassword!)}
                  className="border-green-300 hover:bg-green-100"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={closeAndReset} className="w-full bg-green-600 hover:bg-green-700">
                Entendido, Cerrar
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
            {/* Progress Indicator */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <div className={`h-10 w-10 rounded-full flex items-center justify-center font-semibold text-white transition-colors ${step === "info" ? "bg-blue-600" : "bg-gray-300"}`}>
                  1
                </div>
                <span className={`text-sm font-medium ${step === "info" ? "text-blue-600" : "text-gray-500"}`}>Información</span>
              </div>
              <div className={`h-1 flex-1 mx-2 rounded-full ${step !== "info" ? "bg-blue-300" : "bg-gray-200"}`}></div>
              <div className="flex items-center gap-2">
                <div className={`h-10 w-10 rounded-full flex items-center justify-center font-semibold text-white transition-colors ${step === "organization" ? "bg-blue-600" : step === "account" ? "bg-gray-300" : "bg-gray-200"}`}>
                  2
                </div>
                <span className={`text-sm font-medium ${step === "organization" || step === "account" ? "text-blue-600" : "text-gray-500"}`}>Organización</span>
              </div>
              <div className={`h-1 flex-1 mx-2 rounded-full ${step === "account" ? "bg-blue-300" : "bg-gray-200"}`}></div>
              <div className="flex items-center gap-2">
                <div className={`h-10 w-10 rounded-full flex items-center justify-center font-semibold text-white transition-colors ${step === "account" ? "bg-blue-600" : "bg-gray-200"}`}>
                  3
                </div>
                <span className={`text-sm font-medium ${step === "account" ? "text-blue-600" : "text-gray-500"}`}>Cuenta</span>
              </div>
            </div>

            {/* Step 1: Information */}
            {step === "info" && (
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <p className="text-sm text-blue-800"><span className="font-semibold">Paso 1:</span> Información Personal</p>
                </div>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="dni" className="text-sm font-semibold mb-2">
                      DNI *
                    </Label>
                    <Input
                      id="dni"
                      {...form.register("dni")}
                      placeholder="12345678"
                      className="h-10"
                    />
                  </div>
                  <div>
                    <Label htmlFor="fullName" className="text-sm font-semibold mb-2">
                      Nombre Completo *
                    </Label>
                    <Input
                      id="fullName"
                      {...form.register("fullName")}
                      placeholder="Juan Pérez García"
                      className="h-10"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email" className="text-sm font-semibold mb-2">
                      Email *
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      {...form.register("email")}
                      placeholder="juan.perez@empresa.com"
                      className="h-10"
                    />
                  </div>
                  <div>
                    <Label htmlFor="entryDate" className="text-sm font-semibold mb-2">
                      Fecha de Ingreso *
                    </Label>
                    <Input
                      id="entryDate"
                      type="date"
                      value={form.watch("entryDate")}
                      onChange={(e) => form.setValue("entryDate", e.target.value)}
                      className="h-10"
                    />
                  </div>
                  <div>
                    <Label htmlFor="status" className="text-sm font-semibold mb-2">
                      Estado *
                    </Label>
                    <Select onValueChange={(value) => form.setValue("status", value as "ACTIVE" | "INACTIVE")}>
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="Seleccionar estado" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ACTIVE">✓ Activo</SelectItem>
                        <SelectItem value="INACTIVE">✗ Inactivo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Organization */}
            {step === "organization" && (
              <div className="space-y-4">
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4">
                  <p className="text-sm text-purple-800"><span className="font-semibold">Paso 2:</span> Información Organizacional</p>
                </div>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="siteCode" className="text-sm font-semibold mb-2">
                      Sede (Opcional)
                    </Label>
                    <Select value={form.watch("siteCode") || "none"} onValueChange={(value) => form.setValue("siteCode", value === "none" ? null : value)}>
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="Seleccionar sede" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">— Ninguna —</SelectItem>
                        {sites.map((site) => (
                          <SelectItem key={site.id} value={site.code}>
                            {site.code} — {site.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="areaCode" className="text-sm font-semibold mb-2">
                      Área (Opcional)
                    </Label>
                    <Select value={form.watch("areaCode") || "none"} onValueChange={(value) => form.setValue("areaCode", value === "none" ? null : value)}>
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="Seleccionar área" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">— Ninguna —</SelectItem>
                        {areas.map((area) => (
                          <SelectItem key={area.id} value={area.code}>
                            {area.code} — {area.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="positionName" className="text-sm font-semibold mb-2">
                      Puesto (Opcional)
                    </Label>
                    <Select value={form.watch("positionName") || "none"} onValueChange={(value) => form.setValue("positionName", value === "none" ? null : value)}>
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="Seleccionar puesto" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">— Ninguno —</SelectItem>
                        {positions.map((position) => (
                          <SelectItem key={position.id} value={position.name}>
                            {position.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Account */}
            {step === "account" && createUser && (
              <div className="space-y-4">
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 mb-4">
                  <p className="text-sm text-emerald-800"><span className="font-semibold">Paso 3:</span> Cuenta de Usuario</p>
                </div>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="role" className="text-sm font-semibold mb-2">
                      Rol de Usuario *
                    </Label>
                    <Select 
                      value={form.watch("role")}
                      onValueChange={(value) => form.setValue("role", value as "COLLABORATOR" | "ADMIN" | "SUPERADMIN")}
                    >
                      <SelectTrigger className="h-10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="COLLABORATOR">👤 Colaborador</SelectItem>
                        <SelectItem value="ADMIN">🔧 Administrador</SelectItem>
                        <SelectItem value="SUPERADMIN">👑 Super Administrador</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="password" className="text-sm font-semibold mb-2">
                      Contraseña *
                    </Label>
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            {...form.register("password", {
                              required: createUser ? "La contraseña es obligatoria" : false,
                              minLength: createUser ? { value: 6, message: "Mínimo 6 caracteres" } : undefined
                            })}
                            placeholder="Ingresa una contraseña (mínimo 6 caracteres)"
                            className="h-10 pr-10"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>
                      {form.formState.errors.password && (
                        <p className="text-xs text-red-600">
                          {typeof form.formState.errors.password.message === 'string' 
                            ? form.formState.errors.password.message 
                            : 'Error en la contraseña'}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex gap-2 pt-4">
              {step !== "info" && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePrev}
                  className="flex-1"
                >
                  Anterior
                </Button>
              )}
              {step === "info" || step === "organization" ? (
                <Button
                  type="button"
                  onClick={handleNext}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  Siguiente
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  {loading ? "Creando..." : "Crear Colaborador"}
                </Button>
              )}
            </div>
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

interface ImportCollaboratorsDialogProps {
  onImported?: () => void
}

type ImportResult = { created: number; updated: number; skipped: number; errors: Array<{ row: number; message: string }> }

export function ImportCollaboratorsDialog({ onImported }: ImportCollaboratorsDialogProps) {
  const [open, setOpen] = React.useState(false)
  const [file, setFile] = React.useState<File | null>(null)
  const [result, setResult] = React.useState<ImportResult | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [drag, setDrag] = React.useState(false)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const handleUpload = async () => {
    if (!file) return
    setLoading(true)
    setResult(null)
    try {
      const fd = new FormData()
      fd.append("file", file)
      const res = await fetch("/api/collaborators/import", { method: "POST", body: fd })
      const json = await res.json()
      setResult(json)
      if (json.created > 0 || json.updated > 0) {
        toast.success(`Importación exitosa: ${json.created} creados, ${json.updated} actualizados`)
        if (onImported) onImported()
        // Cerrar dialog después de unos segundos
        setTimeout(() => {
          setOpen(false)
          setFile(null)
          setResult(null)
        }, 2000)
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error en la importación")
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setOpen(false)
    setFile(null)
    setResult(null)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline"><Copy className="size-4" /> Importar</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Importar Colaboradores</DialogTitle>
          <DialogDescription>
            Sube un archivo CSV/XLSX con el formato indicado.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Drag & Drop Area */}
          <div
            className={`border-2 border-dashed rounded-lg p-6 grid place-items-center text-center cursor-pointer transition-colors ${
              drag ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:bg-gray-50"
            }`}
            onDragOver={(e) => {
              e.preventDefault()
              setDrag(true)
            }}
            onDragLeave={() => setDrag(false)}
            onDrop={(e) => {
              e.preventDefault()
              setDrag(false)
              const f = e.dataTransfer.files?.[0]
              if (f) setFile(f)
            }}
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="flex flex-col items-center gap-2">
              <RefreshCw className="size-6 text-gray-400" />
              <div className="text-sm">
                Arrastra tu archivo aquí o <span className="underline">haz click para seleccionar</span>
              </div>
              <div className="text-xs text-gray-500">Formatos: .xlsx, .xls, .csv</div>
              {file && <div className="text-xs mt-2 text-green-600">✓ Seleccionado: <b>{file.name}</b></div>}
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />

          {/* Buttons */}
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => window.open("/api/collaborators/template?format=xlsx", "_blank")}
            >
              <Copy className="size-4" /> Template XLSX
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => window.open("/api/collaborators/template?format=csv", "_blank")}
            >
              <Copy className="size-4" /> Template CSV
            </Button>
            <div className="ml-auto" />
            <Button variant="outline" onClick={handleClose}>
              Cerrar
            </Button>
            <Button
              onClick={handleUpload}
              disabled={!file || loading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <RefreshCw className="size-4 animate-spin" /> Importando…
                </span>
              ) : (
                "Importar"
              )}
            </Button>
          </div>

          {/* Results */}
          {result && (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-md border p-3">
                  <div className="text-xs text-gray-500">Creados</div>
                  <div className="text-2xl font-bold text-green-600">{result.created}</div>
                </div>
                <div className="rounded-md border p-3">
                  <div className="text-xs text-gray-500">Actualizados</div>
                  <div className="text-2xl font-bold text-blue-600">{result.updated}</div>
                </div>
                <div className="rounded-md border p-3">
                  <div className="text-xs text-gray-500">Omitidos</div>
                  <div className="text-2xl font-bold text-amber-600">{result.skipped}</div>
                </div>
              </div>

              {result.errors?.length > 0 && (
                <div className="rounded-lg border overflow-hidden max-h-64 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-100 sticky top-0">
                      <tr>
                        <th className="text-left px-3 py-2">Fila</th>
                        <th className="text-left px-3 py-2">Mensaje</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {result.errors.map((e, i) => (
                        <tr key={i}>
                          <td className="px-3 py-2 font-mono text-xs">{e.row}</td>
                          <td className="px-3 py-2 text-xs">{e.message}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                Cabeceras esperadas: <b>DNI, Nombres, Email, Area, Puesto, Sede, Estado, FechaIngreso</b>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
