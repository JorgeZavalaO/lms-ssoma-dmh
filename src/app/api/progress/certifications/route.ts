import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import type { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { requireStaff } from "@/lib/authorization"
import {
  ensureCertificationForProgress,
  serializeCertification,
} from "@/lib/certificates"
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
    } = {}

    if (collaboratorId) where.collaboratorId = collaboratorId
    if (courseId) where.courseId = courseId

    const certifications = await prisma.certificationRecord.findMany({
      where,
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

    const transformedCertifications = certifications
      .map(serializeCertification)
      .filter((certification) =>
        isValid === null ? true : certification.isValid === (isValid === "true")
      )

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

    const result = await ensureCertificationForProgress(validated.courseProgressId, {
      expiresAt: validated.expiresAt ? new Date(validated.expiresAt) : undefined,
      certificateData:
        validated.certificateData as Prisma.InputJsonValue | undefined,
      trigger: "MANUAL",
    })

    return NextResponse.json(serializeCertification(result.certification), {
      status: result.created ? 201 : 200,
    })
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
