import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

/**
 * DELETE /api/superadmin/admins/[id]
 * Elimina un administrador
 * Solo accesible para SUPERADMIN
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user || session.user.role !== 'SUPERADMIN') {
      return NextResponse.json(
        { error: 'No autorizado - Solo SUPERADMIN' },
        { status: 403 }
      )
    }

    const { id } = await params

    // Verificar que el usuario existe y no es SUPERADMIN
    const user = await prisma.user.findUnique({
      where: { id },
      select: { role: true, email: true }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      )
    }

    if (user.role === 'SUPERADMIN') {
      return NextResponse.json(
        { error: 'No se pueden eliminar superadministradores' },
        { status: 403 }
      )
    }

    // Eliminar el usuario
    await prisma.user.delete({
      where: { id }
    })

    console.log('✓ Admin eliminado:', user.email, 'por', session.user.email)

    return NextResponse.json({
      success: true,
      message: 'Administrador eliminado exitosamente'
    })
  } catch (error) {
    console.error('Error eliminando administrador:', error)
    const message = error instanceof Error ? error.message : 'Error al eliminar administrador'
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}
