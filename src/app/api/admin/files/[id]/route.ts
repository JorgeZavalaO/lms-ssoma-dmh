import { NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/auth"
import {
  deleteFileSafely,
  disableFileForOperations,
  FileLifecycleError,
  getFileInventoryDetail,
  restoreFileForOperations,
} from "@/lib/file-inventory"

const UpdateFileLifecycleSchema = z.object({
  action: z.enum(["DISABLE", "RESTORE"]),
  reason: z.string().optional(),
})

const DeleteFileSchema = z.object({
  reason: z.string().min(10, "Debes registrar un motivo de al menos 10 caracteres"),
})

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

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUPERADMIN")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    const { id } = await context.params
    const payload = UpdateFileLifecycleSchema.parse(await request.json())

    const detail = payload.action === "DISABLE"
      ? await disableFileForOperations({ id, actorId: session.user.id, reason: payload.reason })
      : await restoreFileForOperations({ id })

    return NextResponse.json(detail)
  } catch (error) {
    if (error instanceof FileLifecycleError) {
      const status = error.code === "NOT_FOUND" ? 404 : error.code === "BAD_REQUEST" ? 400 : 409
      return NextResponse.json({ error: error.message, details: error.details }, { status })
    }

    console.error("Error updating file lifecycle:", error)
    return NextResponse.json({ error: "No se pudo actualizar el estado del archivo" }, { status: 500 })
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUPERADMIN")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    const { id } = await context.params
    const payload = DeleteFileSchema.parse(await request.json())
    const detail = await deleteFileSafely({ id, actorId: session.user.id, reason: payload.reason })
    return NextResponse.json(detail)
  } catch (error) {
    if (error instanceof FileLifecycleError) {
      const status = error.code === "NOT_FOUND" ? 404 : error.code === "BAD_REQUEST" ? 400 : 409
      return NextResponse.json({ error: error.message, details: error.details }, { status })
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? "Solicitud inválida" }, { status: 400 })
    }

    console.error("Error deleting file safely:", error)
    return NextResponse.json({ error: "No se pudo eliminar el archivo" }, { status: 500 })
  }
}
