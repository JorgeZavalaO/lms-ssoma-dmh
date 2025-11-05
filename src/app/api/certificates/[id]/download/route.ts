import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getCertificateData } from '@/lib/certificates'
import { renderToBuffer } from '@react-pdf/renderer'
import { createCertificatePDF } from '@/components/certificates/certificate-pdf'

/**
 * K1 - GET /api/certificates/[id]/download
 * Descarga el certificado PDF
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    // Admins, superadmins, o el propio colaborador pueden descargar
    const { id } = await params

    // Obtener datos del certificado
    const certificateData = await getCertificateData(id)

    // Generar PDF usando la función helper
    const certificatePDF = createCertificatePDF(certificateData)
    const pdfBuffer = await renderToBuffer(certificatePDF)

    // Nombre del archivo
    const fileName = `Certificado_${certificateData.certificateNumber}.pdf`

    // Devolver el PDF como descarga
    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    })
  } catch (error) {
    console.error('Error descargando certificado:', error)
    const message = error instanceof Error ? error.message : 'Error al descargar certificado'
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}
