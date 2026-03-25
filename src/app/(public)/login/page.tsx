import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { LoginForm } from "./login-form"

export default async function LoginPage() {
  const session = await auth()

  if (session?.user) {
    const isAdmin =
      session.user.role === "ADMIN" || session.user.role === "SUPERADMIN"
    redirect(isAdmin ? "/admin/dashboard" : "/dashboard")
  }

  return <LoginForm />
}
