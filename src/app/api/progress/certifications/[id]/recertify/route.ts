import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import type { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { requireStaff } from "@/lib/authorization"
import { generateUniqueCertificationIdentifiers } from "@/lib/certificates"

export async function POST(
  _req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    const staffError = requireStaff(session)
    if (staffError) return staffError

    const params = await props.params
    const previousCert = await prisma.certificationRecord.findUnique({
      where: { id: params.id },
      include: {
        course: true,
      },
    })

    if (!previousCert) {
      return NextResponse.json(
        { error: "Certificacion anterior no encontrada" },
        { status: 404 }
      )
    }

    if (previousCert.revokedAt) {
      return NextResponse.json(
        { error: "No se puede recertificar una certificacion revocada" },
        { status: 400 }
      )
    }

    const courseProgress = await prisma.courseProgress.findUnique({
      where: { id: previousCert.courseProgressId },
    })

    if (!courseProgress) {
      return NextResponse.json(
        { error: "Progreso de curso no encontrado" },
        { status: 404 }
      )
    }

    if (!["PASSED", "EXEMPTED"].includes(courseProgress.status)) {
      return NextResponse.json(
        { error: "Solo se puede recertificar progreso aprobado o exonerado" },
        { status: 400 }
      )
    }

    const { certificateNumber, verificationCode } =
      await generateUniqueCertificationIdentifiers()

    let expiresAt: Date | null = null
    if (previousCert.course.validity) {
      expiresAt = new Date()
      expiresAt.setMonth(expiresAt.getMonth() + previousCert.course.validity)
    }

    const newCertification = await prisma.certificationRecord.create({
      data: {
        courseProgressId: previousCert.courseProgressId,
        collaboratorId: courseProgress.collaboratorId,
        courseId: courseProgress.courseId,
        certificateNumber,
        verificationCode,
        expiresAt,
        isRecertification: true,
        previousCertId: params.id,
        certificateData:
          (previousCert.certificateData ?? undefined) as
            | Prisma.InputJsonValue
            | undefined,
      },
      include: {
        collaborator: {
          select: { id: true, fullName: true, email: true },
        },
        course: {
          select: { id: true, code: true, name: true, validity: true },
        },
        previousCert: {
          select: { id: true, certificateNumber: true, issuedAt: true },
        },
      },
    })

    const nameParts = newCertification.collaborator.fullName.split(" ")
    const firstName = nameParts[0]
    const lastName = nameParts.slice(1).join(" ")

    const transformedCertification = {
      id: newCertification.id,
      certificateNumber: newCertification.certificateNumber,
      verificationCode: newCertification.verificationCode,
      collaborator: {
        id: newCertification.collaborator.id,
        firstName,
        lastName,
        email: newCertification.collaborator.email,
      },
      course: {
        id: newCertification.course.id,
        name: newCertification.course.name,
        code: newCertification.course.code,
        validityMonths: newCertification.course.validity,
      },
      issuedAt: newCertification.issuedAt,
      expiresAt: newCertification.expiresAt,
      revokedAt: newCertification.revokedAt,
      revokedBy: newCertification.revokedBy,
      revocationReason: newCertification.revocationReason,
    }

    await prisma.courseProgress.update({
      where: { id: previousCert.courseProgressId },
      data: {
        certifiedAt: new Date(),
        status: courseProgress.status === "EXEMPTED" ? "EXEMPTED" : "PASSED",
      },
    })

    return NextResponse.json(transformedCertification, { status: 201 })
  } catch (error) {
    console.error("Error creating recertification:", error)
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Error al crear recertificacion",
      },
      { status: 500 }
    )
  }
}
