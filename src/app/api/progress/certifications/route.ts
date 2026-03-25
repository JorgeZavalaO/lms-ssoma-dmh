import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import type { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { requireStaff } from "@/lib/authorization"
import { generateUniqueCertificationIdentifiers } from "@/lib/certificates"
import { CreateCertificationSchema } from "@/validations/progress"

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    const staffError = requireStaff(session)
    if (staffError) return staffError

    const { searchParams } = new URL(req.url)
    const collaboratorId = searchParams.get("collaboratorId")
    const courseId = searchParams.get("courseId")
    const isValid = searchParams.get("isValid")

    const where: {
      collaboratorId?: string
      courseId?: string
      isValid?: boolean
    } = {}

    if (collaboratorId) where.collaboratorId = collaboratorId
    if (courseId) where.courseId = courseId
    if (isValid !== null) where.isValid = isValid === "true"

    const certifications = await prisma.certificationRecord.findMany({
      where,
      include: {
        collaborator: {
          select: { id: true, fullName: true, email: true, dni: true },
        },
        course: {
          select: { id: true, code: true, name: true, validity: true },
        },
        previousCert: {
          select: { id: true, certificateNumber: true, issuedAt: true },
        },
      },
      orderBy: { issuedAt: "desc" },
    })

    const transformedCertifications = certifications.map((cert) => {
      const nameParts = cert.collaborator.fullName.split(" ")
      const firstName = nameParts[0]
      const lastName = nameParts.slice(1).join(" ")

      return {
        id: cert.id,
        certificateNumber: cert.certificateNumber,
        verificationCode: cert.verificationCode,
        pdfUrl: cert.pdfUrl,
        collaborator: {
          id: cert.collaborator.id,
          firstName,
          lastName,
          email: cert.collaborator.email,
        },
        course: {
          id: cert.course.id,
          name: cert.course.name,
          code: cert.course.code,
          validityMonths: cert.course.validity,
        },
        issuedAt: cert.issuedAt,
        expiresAt: cert.expiresAt,
        revokedAt: cert.revokedAt,
        revokedBy: cert.revokedBy,
        revocationReason: cert.revocationReason,
      }
    })

    return NextResponse.json({ certifications: transformedCertifications })
  } catch (error) {
    console.error("Error fetching certifications:", error)
    return NextResponse.json(
      { error: "Error al obtener certificaciones" },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    const staffError = requireStaff(session)
    if (staffError) return staffError

    const body = await req.json()
    const validated = CreateCertificationSchema.parse(body)

    const courseProgress = await prisma.courseProgress.findUnique({
      where: { id: validated.courseProgressId },
      include: {
        course: true,
      },
    })

    if (!courseProgress) {
      return NextResponse.json(
        { error: "Progreso de curso no encontrado" },
        { status: 404 }
      )
    }

    if (!["PASSED", "EXEMPTED"].includes(courseProgress.status)) {
      return NextResponse.json(
        { error: "Solo se puede certificar progreso aprobado o exonerado" },
        { status: 400 }
      )
    }

    const { certificateNumber, verificationCode } =
      await generateUniqueCertificationIdentifiers()

    let expiresAt = validated.expiresAt ? new Date(validated.expiresAt) : null
    if (!expiresAt && courseProgress.course.validity) {
      expiresAt = new Date()
      expiresAt.setMonth(expiresAt.getMonth() + courseProgress.course.validity)
    }

    const certification = await prisma.certificationRecord.create({
      data: {
        courseProgressId: validated.courseProgressId,
        collaboratorId: courseProgress.collaboratorId,
        courseId: courseProgress.courseId,
        certificateNumber,
        verificationCode,
        expiresAt,
        isRecertification: validated.isRecertification || false,
        previousCertId: validated.previousCertId,
        certificateData:
          validated.certificateData as Prisma.InputJsonValue | undefined,
      },
      include: {
        collaborator: {
          select: { id: true, fullName: true, email: true },
        },
        course: {
          select: { id: true, code: true, name: true },
        },
      },
    })

    await prisma.courseProgress.update({
      where: { id: validated.courseProgressId },
      data: {
        certifiedAt: new Date(),
        status: courseProgress.status === "EXEMPTED" ? "EXEMPTED" : "PASSED",
      },
    })

    return NextResponse.json(certification, { status: 201 })
  } catch (error) {
    console.error("Error creating certification:", error)
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Error al crear certificacion",
      },
      { status: 500 }
    )
  }
}
