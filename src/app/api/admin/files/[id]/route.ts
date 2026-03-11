import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { getFileInventoryDetail } from "@/lib/file-inventory"

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUPERADMIN")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    const { id } = await context.params
    const detail = await getFileInventoryDetail(id)

    if (!detail) {
      return NextResponse.json({ error: "Archivo no encontrado" }, { status: 404 })
    }

    return NextResponse.json(detail)
  } catch (error) {
    console.error("Error fetching file detail:", error)
    return NextResponse.json({ error: "No se pudo obtener el detalle del archivo" }, { status: 500 })
  }
}
