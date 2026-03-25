import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { requireStaff } from "@/lib/authorization"
import { RevokeCertificationSchema } from "@/validations/progress"

export async function POST(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    const staffError = requireStaff(session)
    if (staffError) return staffError

    const body = await req.json()
    const validated = RevokeCertificationSchema.parse(body)

    const params = await props.params
    const certification = await prisma.certificationRecord.findUnique({
      where: { id: params.id },
    })

    if (!certification) {
      return NextResponse.json(
        { error: "Certificacion no encontrada" },
        { status: 404 }
      )
    }

    if (certification.revokedAt) {
      return NextResponse.json(
        { error: "Certificacion ya revocada" },
        { status: 400 }
      )
    }

    const updated = await prisma.certificationRecord.update({
      where: { id: params.id },
      data: {
        revokedAt: new Date(),
        revokedBy: session!.user.id,
        revocationReason: validated.revocationReason,
        isValid: false,
      },
      include: {
        collaborator: {
          select: { id: true, fullName: true, email: true },
        },
        course: {
          select: { id: true, code: true, name: true, validity: true },
        },
      },
    })

    const nameParts = updated.collaborator.fullName.split(" ")
    const firstName = nameParts[0]
    const lastName = nameParts.slice(1).join(" ")

    const transformedCertification = {
      id: updated.id,
      collaborator: {
        id: updated.collaborator.id,
        firstName,
        lastName,
        email: updated.collaborator.email,
      },
      course: {
        id: updated.course.id,
        name: updated.course.name,
        code: updated.course.code,
        validityMonths: updated.course.validity,
      },
      issuedAt: updated.issuedAt,
      expiresAt: updated.expiresAt,
      revokedAt: updated.revokedAt,
      revokedBy: updated.revokedBy,
      revocationReason: updated.revocationReason,
    }

    return NextResponse.json(transformedCertification)
  } catch (error) {
    console.error("Error revoking certification:", error)
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Error al revocar certificacion",
      },
      { status: 500 }
    )
  }
}
