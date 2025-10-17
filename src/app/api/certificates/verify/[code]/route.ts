import { NextRequest, NextResponse } from 'next/server'
import { verifyCertificate } from '@/lib/certificates'

/**
 * K2 - GET /api/certificates/verify/[code]
 * Verifica un certificado por código
 * Endpoint público - no requiere autenticación
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params

    if (!code) {
      return NextResponse.json(
        { error: 'Código de verificación requerido' },
        { status: 400 }
      )
    }

    // Verificar el certificado
    const certificate = await verifyCertificate(code)

    if (!certificate) {
      return NextResponse.json(
        { error: 'Certificado no encontrado', valid: false },
        { status: 404 }
      )
    }

    // Devolver datos públicos del certificado
    return NextResponse.json({
      valid: certificate.isValid,
      certificate: {
        certificateNumber: certificate.certificateNumber,
        collaboratorName: certificate.collaboratorName,
        courseName: certificate.courseName,
        issuedAt: certificate.issuedAt,
        expiresAt: certificate.expiresAt,
        courseHours: certificate.courseHours,
        score: certificate.score,
        isValid: certificate.isValid,
      },
    })
  } catch (error: any) {
    console.error('Error verificando certificado:', error)
    return NextResponse.json(
      { error: error.message || 'Error al verificar certificado' },
      { status: 500 }
    )
  }
}
