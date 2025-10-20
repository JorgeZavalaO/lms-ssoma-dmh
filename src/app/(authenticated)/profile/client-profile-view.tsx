"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import {
  User,
  Mail,
  CreditCard,
  Building2,
  MapPin,
  Briefcase,
  Calendar,
  Edit,
  Save,
  X,
  Shield,
  CheckCircle,
  AlertCircle,
} from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { toast } from "sonner"

interface ProfileData {
  id: string
  dni: string
  fullName: string
  email: string
  status: "ACTIVE" | "INACTIVE"
  entryDate: string
  site: {
    id: string
    name: string
    code: string
  } | null
  area: {
    id: string
    name: string
    code: string
  } | null
  position: {
    id: string
    name: string
  } | null
  user: {
    id: string
    email: string
    image: string | null
  } | null
}

interface ClientProfileViewProps {
  profile: ProfileData
}

export function ClientProfileView({ profile }: ClientProfileViewProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState({
    email: profile.email,
  })

  const handleEdit = () => {
    setIsEditing(true)
  }

  const handleCancel = () => {
    setIsEditing(false)
    setFormData({
      email: profile.email,
    })
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      // Aquí se haría la llamada a la API para actualizar el perfil
      // Por ahora solo simulamos el guardado
      await new Promise((resolve) => setTimeout(resolve, 1000))
      
      toast.success("Perfil actualizado correctamente")
      setIsEditing(false)
    } catch (error) {
      toast.error("Error al actualizar el perfil")
      console.error("Error:", error)
    } finally {
      setIsSaving(false)
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Mi Perfil</h1>
        <p className="text-muted-foreground mt-2">
          Consulta y gestiona tu información personal
        </p>
      </div>

      {/* Perfil Principal */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={profile.user?.image || undefined} alt={profile.fullName} />
                <AvatarFallback className="text-lg">
                  {getInitials(profile.fullName)}
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-2xl">{profile.fullName}</CardTitle>
                <CardDescription className="mt-1 flex items-center gap-2">
                  <Badge
                    variant={profile.status === "ACTIVE" ? "default" : "secondary"}
                    className="flex items-center gap-1"
                  >
                    {profile.status === "ACTIVE" ? (
                      <CheckCircle className="h-3 w-3" />
                    ) : (
                      <AlertCircle className="h-3 w-3" />
                    )}
                    {profile.status === "ACTIVE" ? "Activo" : "Inactivo"}
                  </Badge>
                </CardDescription>
              </div>
            </div>
            {!isEditing ? (
              <Button onClick={handleEdit} variant="outline" size="sm">
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button onClick={handleSave} disabled={isSaving} size="sm">
                  <Save className="h-4 w-4 mr-2" />
                  Guardar
                </Button>
                <Button onClick={handleCancel} variant="outline" size="sm">
                  <X className="h-4 w-4 mr-2" />
                  Cancelar
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <Separator />

          {/* Información Personal */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <User className="h-5 w-5 text-purple-600" />
              Información Personal
            </h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-muted-foreground">
                  Nombre Completo
                </Label>
                <Input
                  id="fullName"
                  value={profile.fullName}
                  disabled
                  className="bg-muted"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dni" className="text-muted-foreground">
                  DNI
                </Label>
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                  <Input
                    id="dni"
                    value={profile.dni}
                    disabled
                    className="bg-muted"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-muted-foreground">
                  Email Corporativo
                </Label>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    value={isEditing ? formData.email : profile.email}
                    disabled={!isEditing}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className={isEditing ? "" : "bg-muted"}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="entryDate" className="text-muted-foreground">
                  Fecha de Ingreso
                </Label>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <Input
                    id="entryDate"
                    value={format(new Date(profile.entryDate), "dd/MM/yyyy", {
                      locale: es,
                    })}
                    disabled
                    className="bg-muted"
                  />
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Información Organizacional */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Building2 className="h-5 w-5 text-blue-600" />
              Información Organizacional
            </h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="site" className="text-muted-foreground">
                  Sede
                </Label>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <Input
                    id="site"
                    value={profile.site ? `${profile.site.name} (${profile.site.code})` : "No asignada"}
                    disabled
                    className="bg-muted"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="area" className="text-muted-foreground">
                  Área
                </Label>
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <Input
                    id="area"
                    value={profile.area ? `${profile.area.name} (${profile.area.code})` : "No asignada"}
                    disabled
                    className="bg-muted"
                  />
                </div>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="position" className="text-muted-foreground">
                  Puesto
                </Label>
                <div className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-muted-foreground" />
                  <Input
                    id="position"
                    value={profile.position?.name || "No asignado"}
                    disabled
                    className="bg-muted"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Nota informativa */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-2">
              <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-blue-900">Información Protegida</p>
                <p className="text-blue-700 mt-1">
                  Los datos organizacionales (área, puesto, sede) son administrados por el
                  departamento de Recursos Humanos y no pueden ser modificados directamente.
                  Si necesitas actualizar esta información, contacta a tu supervisor o a RRHH.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Estadísticas Rápidas */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <User className="h-4 w-4 text-purple-500" />
              ID de Usuario
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm font-mono bg-accent px-3 py-2 rounded">
              {profile.user?.id.slice(0, 12)}...
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-blue-500" />
              ID de Colaborador
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm font-mono bg-accent px-3 py-2 rounded">
              {profile.id.slice(0, 12)}...
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4 text-green-500" />
              Antigüedad
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {Math.floor(
                (new Date().getTime() - new Date(profile.entryDate).getTime()) /
                  (1000 * 60 * 60 * 24 * 365)
              )}{" "}
              años
            </div>
            <p className="text-xs text-muted-foreground mt-1">En la organización</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
