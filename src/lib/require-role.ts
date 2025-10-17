import { auth } from "@/auth"
import { NextResponse } from "next/server"
import type { Role } from "@/config/access"

export async function requireRole(allowed: Role[]) {
  const session = await auth()
  const role = session?.user?.role as Role | undefined
  if (!role || !allowed.includes(role)) {
    return { ok: false as const, res: NextResponse.json({ error: "Forbidden" }, { status: 403 }) }
  }
  return { ok: true as const, session }
}
