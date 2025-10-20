import { auth } from "@/auth"

export default async function SuperPage() {
  const session = await auth()
  return <div className="p-6">Zona SUPERADMIN — {session?.user?.email}</div>
}
