"use client"

import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { Button } from "@/components/ui/button"

export default function Home() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === "loading") return // Still loading
    if (!session) {
      router.push("/login")
    }
  }, [session, status, router])

  if (status === "loading") {
    return <div className="flex items-center justify-center min-h-screen">Cargando...</div>
  }

  if (!session) {
    return null // Will redirect
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8">
      <h1 className="text-3xl font-bold mb-8">Bienvenido al LMS SSOMA DMH</h1>
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4">Datos del Usuario</h2>
        <p><strong>Nombre:</strong> {session.user.name || "No especificado"}</p>
        <p><strong>Email:</strong> {session.user.email}</p>
        <p><strong>Rol:</strong> {session.user.role}</p>
        <p><strong>ID:</strong> {session.user.id}</p>
      </div>
      <Button
        onClick={() => signOut({ callbackUrl: "/login" })}
        className="mt-8"
        variant="destructive"
      >
        Salir
      </Button>
    </div>
  )
}
