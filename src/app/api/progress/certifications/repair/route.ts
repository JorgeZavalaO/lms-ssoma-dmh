import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { requireStaff } from "@/lib/authorization"
import { repairMissingCertifications } from "@/lib/certificates"
import { prisma } from "@/lib/prisma"

// GET /api/progress/certifications/repair - Auditoría: progresos PASSED/EXEMPTED sin certificado
export async function GET(_req: NextRequest) {
  try {
    const session = await auth()
    const staffError = requireStaff(session)
    if (staffError) return staffError

    const pending = await prisma.courseProgress.findMany({
      where: {
        status: { in: ["PASSED", "EXEMPTED"] },
        certifications: { none: {} },
      },
      include: {
        collaborator: { select: { fullName: true, dni: true } },
        course: { select: { name: true } },
      },
      orderBy: { completedAt: "desc" },
    })

    return NextResponse.json({
      pendingCount: pending.length,
      pending: pending.map((p) => ({
        courseProgressId: p.id,
        collaboratorName: p.collaborator.fullName,
        collaboratorDni: p.collaborator.dni,
        courseName: p.course.name,
        status: p.status,
        completedAt: p.completedAt,
      })),
    })
  } catch (error) {
    console.error("Error auditing certifications:", error)
    return NextResponse.json(
      { error: "Error al auditar certificaciones pendientes" },
      { status: 500 }
    )
  }
}

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
