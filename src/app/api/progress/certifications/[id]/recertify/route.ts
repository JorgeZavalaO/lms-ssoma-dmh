import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import type { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { requireStaff } from "@/lib/authorization"
import {
  generateUniqueCertificationIdentifiers,
  getEffectiveCertificateState,
  serializeCertification,
} from "@/lib/certificates"

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

    const effectiveState = getEffectiveCertificateState(previousCert)
    if (effectiveState.status !== "EXPIRED") {
      return NextResponse.json(
        { error: "Solo se puede recertificar una certificacion vencida" },
        { status: 400 }
      )
    }

    const existingRecertification = await prisma.certificationRecord.findFirst({
      where: { previousCertId: params.id },
      include: {
        collaborator: {
          select: {
            id: true,
            fullName: true,
            email: true,
            dni: true,
            user: { select: { id: true } },
          },
        },
        course: {
          select: {
            id: true,
            code: true,
            name: true,
            validity: true,
            currentVersion: true,
            duration: true,
          },
        },
        previousCert: {
          select: { id: true, certificateNumber: true, issuedAt: true },
        },
        courseProgress: {
          select: {
            id: true,
            status: true,
            progressPercent: true,
            certifiedAt: true,
            enrollmentId: true,
          },
        },
      },
      orderBy: { issuedAt: "desc" },
    })

    if (existingRecertification) {
      return NextResponse.json(serializeCertification(existingRecertification))
    }

    const latestCertification = await prisma.certificationRecord.findFirst({
      where: { courseProgressId: previousCert.courseProgressId },
      select: { id: true },
      orderBy: { issuedAt: "desc" },
    })

    if (latestCertification?.id !== previousCert.id) {
      return NextResponse.json(
        { error: "Solo se puede recertificar la certificacion mas reciente" },
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
          select: {
            id: true,
            fullName: true,
            email: true,
            dni: true,
            user: { select: { id: true } },
          },
        },
        course: {
          select: {
            id: true,
            code: true,
            name: true,
            validity: true,
            currentVersion: true,
            duration: true,
          },
        },
        previousCert: {
          select: { id: true, certificateNumber: true, issuedAt: true },
        },
        courseProgress: {
          select: {
            id: true,
            status: true,
            progressPercent: true,
            certifiedAt: true,
            enrollmentId: true,
          },
        },
      },
    })

    await prisma.courseProgress.update({
      where: { id: previousCert.courseProgressId },
      data: {
        certifiedAt: new Date(),
        status: courseProgress.status === "EXEMPTED" ? "EXEMPTED" : "PASSED",
      },
    })

    return NextResponse.json(serializeCertification(newCertification), {
      status: 201,
    })
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
