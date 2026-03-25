import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { requireStaff } from "@/lib/authorization"
import { repairMissingCertifications } from "@/lib/certificates"

export async function POST(_req: NextRequest) {
  try {
    const session = await auth()
    const staffError = requireStaff(session)
    if (staffError) return staffError

    const result = await repairMissingCertifications()

    return NextResponse.json({
      success: true,
      ...result,
    })
  } catch (error) {
    console.error("Error repairing certifications:", error)
    return NextResponse.json(
      { error: "Error al reparar certificaciones historicas" },
      { status: 500 }
    )
  }
}
