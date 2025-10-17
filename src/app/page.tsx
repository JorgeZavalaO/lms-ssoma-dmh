"use client"

import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function Home() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === "loading") return
    if (!session) {
      router.push("/login")
    }
  }, [session, status, router])

  if (status === "loading") {
    return <div className="flex items-center justify-center min-h-screen">Cargando...</div>
  }

  if (!session) {
    return null
  }

  return (
    <div className="flex flex-col items-center justify-center gap-8 min-h-[calc(100vh-300px)]">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Bienvenido al LMS SSOMA DMH</h1>
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Datos del Usuario</CardTitle>
          <CardDescription>Información de tu cuenta</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <p><strong>Nombre:</strong> {session.user.name || "No especificado"}</p>
          <p><strong>Email:</strong> {session.user.email}</p>
          <p><strong>Rol:</strong> {session.user.role}</p>
          <p><strong>ID:</strong> {session.user.id}</p>
        </CardContent>
      </Card>
      <Button
        onClick={() => signOut({ callbackUrl: "/login" })}
        variant="destructive"
      >
        Salir
      </Button>
    </div>
  )
}
