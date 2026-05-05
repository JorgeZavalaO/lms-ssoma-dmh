import { NextRequest, NextResponse } from "next/server"
import { renderToBuffer } from "@react-pdf/renderer"
import { randomUUID } from "crypto"
import { auth } from "@/auth"
import { createCertificatePDF } from "@/components/certificates/certificate-pdf"
import type { CertificateData } from "@/lib/certificates"
import {
  generateQRCode,
  generateUniqueCertificationIdentifiers,
} from "@/lib/certificates"
import { prisma } from "@/lib/prisma"
import { requireStaff } from "@/lib/authorization"
import { DemoCertificateSchema } from "@/validations/certificates"

function calculateExpirationDate(validityMonths?: number | null) {
  if (!validityMonths) return null

  const expiresAt = new Date()
  expiresAt.setMonth(expiresAt.getMonth() + validityMonths)
  return expiresAt
}

function sanitizeFileName(value: string) {
  const sanitized = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9_-]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 80)

  return sanitized || "certificado"
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    const staffError = requireStaff(session)
    if (staffError) return staffError

    const body = await req.json()
    const validation = DemoCertificateSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: "Datos invalidos", details: validation.error.issues },
        { status: 400 }
      )
    }

    const input = validation.data

    const course = await prisma.course.findFirst({
      where: {
        id: input.courseId,
        status: "PUBLISHED",
      },
      select: {
        id: true,
        name: true,
        duration: true,
        validity: true,
      },
    })

    if (!course) {
      return NextResponse.json(
        { error: "Curso publicado no encontrado" },
        { status: 404 }
      )
    }

    const recipient =
      input.recipientMode === "existing"
        ? await prisma.collaborator.findFirst({
            where: {
              id: input.collaboratorId,
              status: "ACTIVE",
            },
            select: {
              id: true,
              fullName: true,
              dni: true,
            },
          })
        : {
            id: "demo-manual",
            fullName: input.collaboratorName,
            dni: input.collaboratorDni,
          }

    if (!recipient) {
      return NextResponse.json(
        { error: "Colaborador activo no encontrado" },
        { status: 404 }
      )
    }

    const { certificateNumber, verificationCode } =
      await generateUniqueCertificationIdentifiers()
    const verificationUrl = `${
      process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    }/verify/${verificationCode}`

    const certificateData: CertificateData = {
      id: `demo-${randomUUID()}`,
      certificateNumber,
      verificationCode,
      collaboratorId: recipient.id,
      collaboratorName: recipient.fullName,
      collaboratorDni: recipient.dni,
      courseName: course.name,
      courseHours: course.duration || 0,
      score: input.score,
      issuedAt: new Date(),
      expiresAt: calculateExpirationDate(course.validity),
      qrCodeDataUrl: await generateQRCode(verificationUrl),
    }

    const certificatePDF = createCertificatePDF(certificateData)
    const pdfBuffer = await renderToBuffer(certificatePDF)
    const fileName = `Certificado_Demo_${sanitizeFileName(
      recipient.fullName
    )}_${sanitizeFileName(course.name)}.pdf`

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Content-Length": pdfBuffer.length.toString(),
        "Cache-Control": "no-store",
      },
    })
  } catch (error) {
    console.error("Error generando certificado demo:", error)

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Error al generar certificado demo",
      },
      { status: 500 }
    )
  }
}
