import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { ClientSuperAdmin } from "./client-superadmin"

export default async function SuperAdminPage() {
  const session = await auth()

  // Verificar que el usuario está autenticado
  if (!session?.user) {
    redirect("/login")
  }

  // Verificar que el usuario es SUPERADMIN
  if (session.user.role !== "SUPERADMIN") {
    redirect("/dashboard")
  }

  return (
    <div className="p-4">
        <ClientSuperAdmin />
    </div>
    
  )
}
