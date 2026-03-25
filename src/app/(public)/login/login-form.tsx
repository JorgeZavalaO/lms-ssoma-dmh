"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertCircle, ShieldAlert } from "lucide-react"

export function LoginForm() {
  const [identifier, setIdentifier] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    const result = await signIn("credentials", {
      identifier,
      password,
      redirect: false,
    })

    setIsLoading(false)

    if (result?.error) {
      setError("Credenciales invalidas")
      return
    }

    if (result?.ok) {
      const response = await fetch("/api/auth/session")
      const session = await response.json()
      const isAdmin =
        session?.user?.role === "ADMIN" || session?.user?.role === "SUPERADMIN"
      window.location.href = isAdmin ? "/admin/dashboard" : "/dashboard"
    }
  }

  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
          <Link href="/" className="flex items-center gap-2 font-medium">
            <div className="flex size-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <ShieldAlert className="size-4" />
            </div>
            SSOMA DMH
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">
            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
              <div className="flex flex-col items-center gap-1 text-center">
                <h1 className="text-2xl font-bold">Inicia sesion en tu cuenta</h1>
                <p className="text-muted-foreground text-sm text-balance">
                  Ingresa tu DNI o correo y contrasena para acceder
                </p>
              </div>

              {error && (
                <div className="flex items-start gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                  <ShieldAlert className="mt-0.5 h-4 w-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="identifier" className="text-sm font-medium">
                  DNI o correo electronico
                </Label>
                <Input
                  id="identifier"
                  type="text"
                  placeholder="12345678 o tu@ejemplo.com"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  disabled={isLoading}
                  required
                  className="h-10"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  Contrasena
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="********"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  required
                  className="h-10"
                />
              </div>

              <Button type="submit" disabled={isLoading} className="h-10 w-full">
                {isLoading ? "Iniciando sesion..." : "Iniciar sesion"}
              </Button>

              <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                <div className="flex items-start gap-2">
                  <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                  <div className="space-y-1">
                    <p className="font-medium">Recuperacion de acceso</p>
                    <p className="text-xs leading-relaxed text-amber-800">
                      El restablecimiento de contrasena y el ingreso con proveedores
                      externos no estan habilitados todavia. Solicita soporte a un
                      administrador del LMS.
                    </p>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>

      <div className="relative hidden bg-muted lg:block">
        <Image
          src="https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=1200&fit=crop"
          alt="Seguridad y cumplimiento"
          fill
          sizes="50vw"
          className="object-cover dark:brightness-[0.2] dark:grayscale"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
      </div>
    </div>
  )
}
