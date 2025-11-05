import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getCertificateData } from '@/lib/certificates'
import { GenerateCertificateSchema } from '@/validations/certificates'
import { renderToBuffer } from '@react-pdf/renderer'
import { createCertificatePDF } from '@/components/certificates/certificate-pdf'

/**
 * K1 - POST /api/certificates/generate
 * Genera un certificado PDF para una certificación
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    // Solo admins y superadmins pueden generar certificados
    if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const body = await req.json()
    const validation = GenerateCertificateSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: validation.error.issues },
        { status: 400 }
      )
    }

    const { certificationId } = validation.data

    // Obtener datos del certificado
    const certificateData = await getCertificateData(certificationId)

    // Generar PDF usando la función helper
    const certificatePDF = createCertificatePDF(certificateData)
    const pdfBuffer = await renderToBuffer(certificatePDF)

    // Convertir a Base64 para almacenar o enviar
    const pdfBase64 = pdfBuffer.toString('base64')

    // En producción, aquí subirías el PDF a un servicio de almacenamiento
    // Por ahora, devolvemos el PDF directamente
    const pdfUrl = `data:application/pdf;base64,${pdfBase64}`

    // Guardar URL del PDF en la base de datos
    // await updateCertificatePdf(certificationId, pdfUrl, {
    //   size: pdfBuffer.length,
    //   generatedAt: new Date().toISOString(),
    // })

    return NextResponse.json({
      success: true,
      certificateId: certificationId,
      verificationCode: certificateData.verificationCode,
      pdfUrl, // En producción, esta sería una URL real
      message: 'Certificado generado exitosamente',
    })
  } catch (error) {
    console.error('Error generando certificado:', error)
    const message = error instanceof Error ? error.message : 'Error al generar certificado'
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}
