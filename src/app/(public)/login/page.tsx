"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ShieldAlert } from "lucide-react"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    })
    setIsLoading(false)
    if (result?.error) {
      setError("Credenciales inválidas")
    } else if (result?.ok) {
      window.location.href = "/"
    }
  }

  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      {/* Formulario */}
      <div className="flex flex-col gap-4 p-6 md:p-10">
        {/* Logo */}
        <div className="flex justify-center gap-2 md:justify-start">
          <Link href="/" className="flex items-center gap-2 font-medium">
            <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
              <ShieldAlert className="size-4" />
            </div>
            SSOMA DMH
          </Link>
        </div>

        {/* Contenedor del formulario */}
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">
            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
              {/* Encabezado */}
              <div className="flex flex-col items-center gap-1 text-center">
                <h1 className="text-2xl font-bold">Inicia sesión en tu cuenta</h1>
                <p className="text-muted-foreground text-sm text-balance">
                  Ingresa tu correo y contraseña para acceder
                </p>
              </div>

              {/* Error */}
              {error && (
                <div className="bg-destructive/10 text-destructive rounded-md p-3 text-sm flex items-start gap-2">
                  <ShieldAlert className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Correo electrónico
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="tu@ejemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  required
                  className="h-10"
                />
              </div>

              {/* Contraseña */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-sm font-medium">
                    Contraseña
                  </Label>
                  <Link href="#" className="text-xs underline-offset-4 hover:underline">
                    ¿Olvidaste tu contraseña?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  required
                  className="h-10"
                />
              </div>

              {/* Botón de login */}
              <Button type="submit" disabled={isLoading} className="w-full h-10">
                {isLoading ? "Iniciando sesión…" : "Iniciar sesión"}
              </Button>

              {/* Separador */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-muted" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">O continúa con</span>
                </div>
              </div>

              {/* Botón GitHub (placeholder) */}
              <Button
                type="button"
                variant="outline"
                disabled
                className="w-full h-10 gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-4 w-4">
                  <path
                    d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"
                    fill="currentColor"
                  />
                </svg>
                Iniciar con GitHub
              </Button>

              {/* Signup link */}
              <p className="text-muted-foreground text-center text-sm">
                ¿No tienes una cuenta?{" "}
                <Link href="/register" className="underline underline-offset-4 hover:text-primary">
                  Regístrate aquí
                </Link>
              </p>
            </form>
          </div>
        </div>
      </div>

      {/* Imagen de fondo (solo desktop) */}
      <div className="bg-muted relative hidden lg:block">
        <img
          src="https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=1200&fit=crop"
          alt="Seguridad y cumplimiento"
          className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
        />
        {/* Overlay degradado opcional */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
      </div>
    </div>
  )
}
