import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { listCertificates } from '@/lib/certificates'
import { CertificateFiltersSchema } from '@/validations/certificates'

/**
 * GET /api/certificates
 * Lista certificados con filtros
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    // Solo admins pueden listar todos los certificados
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    // Obtener parámetros de búsqueda
    const { searchParams } = new URL(req.url)
    const filters = {
      collaboratorId: searchParams.get('collaboratorId') || undefined,
      courseId: searchParams.get('courseId') || undefined,
      isValid: searchParams.get('isValid') === 'true' ? true : searchParams.get('isValid') === 'false' ? false : undefined,
      hasVerificationCode: searchParams.get('hasVerificationCode') === 'true' ? true : searchParams.get('hasVerificationCode') === 'false' ? false : undefined,
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined,
    }

    const validation = CertificateFiltersSchema.safeParse(filters)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Filtros inválidos', details: validation.error.issues },
        { status: 400 }
      )
    }

    const certificates = await listCertificates(validation.data)

    return NextResponse.json({
      certificates,
      total: certificates.length,
    })
  } catch (error: any) {
    console.error('Error listando certificados:', error)
    return NextResponse.json(
      { error: error.message || 'Error al listar certificados' },
      { status: 500 }
    )
  }
}
