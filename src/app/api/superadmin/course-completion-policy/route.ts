import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { requireSuperAdmin } from "@/lib/authorization"
import {
  getCourseCompletionPolicy,
  updateCourseCompletionPolicy,
} from "@/lib/system-settings"
import { CourseCompletionPolicySchema } from "@/validations/system-settings"

export async function GET(req: NextRequest) {
  try {
    void req
    const session = await auth()
    const authError = requireSuperAdmin(session)
    if (authError) return authError

    const policy = await getCourseCompletionPolicy()

    return NextResponse.json({ policy })
  } catch (error) {
    console.error("Error obteniendo politica de finalizacion:", error)
    return NextResponse.json(
      { error: "Error al obtener politica de finalizacion" },
      { status: 500 }
    )
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth()
    const authError = requireSuperAdmin(session)
    if (authError) return authError

    const body = await req.json()
    const validated = CourseCompletionPolicySchema.parse(body)

    const policy = await updateCourseCompletionPolicy({
      bypassCourseCompletionRestrictions:
        validated.bypassCourseCompletionRestrictions,
      updatedBy: session!.user.id,
    })

    return NextResponse.json({ policy })
  } catch (error: any) {
    const isValidationError = error?.name === "ZodError"
    if (!isValidationError) {
      console.error("Error actualizando politica de finalizacion:", error)
    }

    return NextResponse.json(
      {
        error: isValidationError
          ? "Datos invalidos"
          : "Error al actualizar politica de finalizacion",
      },
      { status: isValidationError ? 400 : 500 }
    )
  }
}
