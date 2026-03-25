import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { renderToBuffer } from "@react-pdf/renderer"
import { createCertificatePDF } from "@/components/certificates/certificate-pdf"
import {
  getCertificateData,
  persistCertificatePdfArtifact,
} from "@/lib/certificates"
import { requireStaff } from "@/lib/authorization"
import { GenerateCertificateSchema } from "@/validations/certificates"

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    const staffError = requireStaff(session)
    if (staffError) return staffError

    const body = await req.json()
    const validation = GenerateCertificateSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: "Datos invalidos", details: validation.error.issues },
        { status: 400 }
      )
    }

    const { certificationId } = validation.data
    const certificateData = await getCertificateData(certificationId)

    const certificatePDF = createCertificatePDF(certificateData)
    const pdfBuffer = await renderToBuffer(certificatePDF)
    const pdfUrl = await persistCertificatePdfArtifact(
      certificationId,
      pdfBuffer.length
    )

    return NextResponse.json({
      success: true,
      certificateId: certificationId,
      verificationCode: certificateData.verificationCode,
      pdfUrl,
      deliveryMode: "ON_DEMAND_DOWNLOAD",
      message: "Certificado generado exitosamente",
    })
  } catch (error) {
    console.error("Error generando certificado:", error)

    if (error instanceof Error && error.message === "Certificado no encontrado") {
      return NextResponse.json({ error: error.message }, { status: 404 })
    }

    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Error al generar certificado",
      },
      { status: 500 }
    )
  }
}
