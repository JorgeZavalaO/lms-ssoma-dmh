import { NextRequest, NextResponse } from "next/server"
import { renderToBuffer } from "@react-pdf/renderer"
import { auth } from "@/auth"
import { createCertificatePDF } from "@/components/certificates/certificate-pdf"
import {
  getCertificateData,
  persistCertificatePdfArtifact,
} from "@/lib/certificates"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const { id } = await params
    const certificateData = await getCertificateData(id)

    const isAdmin =
      session.user.role === "ADMIN" || session.user.role === "SUPERADMIN"
    const isOwner =
      session.user.role === "COLLABORATOR" &&
      session.user.collaboratorId === certificateData.collaboratorId

    if (!isAdmin && !isOwner) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    const certificatePDF = createCertificatePDF(certificateData)
    const pdfBuffer = await renderToBuffer(certificatePDF)
    await persistCertificatePdfArtifact(id, pdfBuffer.length)

    const fileName = `Certificado_${certificateData.certificateNumber}.pdf`

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Content-Length": pdfBuffer.length.toString(),
      },
    })
  } catch (error) {
    console.error("Error descargando certificado:", error)
    const message =
      error instanceof Error ? error.message : "Error al descargar certificado"

    return NextResponse.json({ error: message }, { status: 500 })
  }
}
