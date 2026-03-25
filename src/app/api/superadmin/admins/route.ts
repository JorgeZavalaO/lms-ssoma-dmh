import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

/**
 * GET /api/superadmin/admins
 * Lista todos los administradores del sistema
 * Solo accesible para SUPERADMIN
 */
export async function GET(req: NextRequest) {
  try {
    void req
    const session = await auth()

    if (!session?.user || session.user.role !== "SUPERADMIN") {
      return NextResponse.json(
        { error: "No autorizado - Solo SUPERADMIN" },
        { status: 403 }
      )
    }

    const admins = await prisma.user.findMany({
      where: {
        role: {
          in: ["ADMIN", "SUPERADMIN"],
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
      orderBy: {
        email: "asc",
      },
    })

    const adminsWithMetadata = admins.map((admin) => ({
      id: admin.id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
      createdAt: null,
      lastLogin: null,
    }))

    return NextResponse.json({ admins: adminsWithMetadata })
  } catch (error) {
    console.error("Error obteniendo administradores:", error)
    const message =
      error instanceof Error ? error.message : "Error al obtener administradores"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

/**
 * POST /api/superadmin/admins
 * Crea un nuevo administrador
 * Solo accesible para SUPERADMIN
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user || session.user.role !== "SUPERADMIN") {
      return NextResponse.json(
        { error: "No autorizado - Solo SUPERADMIN" },
        { status: 403 }
      )
    }

    const body = await req.json()
    const { name, email, password, role } = body

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Nombre, email y contrasena son requeridos" },
        { status: 400 }
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "La contrasena debe tener al menos 8 caracteres" },
        { status: 400 }
      )
    }

    if (!["ADMIN", "SUPERADMIN"].includes(role)) {
      return NextResponse.json({ error: "Rol invalido" }, { status: 400 })
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "El email ya esta registrado" },
        { status: 400 }
      )
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const newAdmin = await prisma.user.create({
      data: {
        name,
        email,
        hashedPassword,
        role,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    })

    console.log("Nuevo admin creado:", newAdmin.email, "por", session.user.email)

    return NextResponse.json({
      success: true,
      admin: newAdmin,
    })
  } catch (error) {
    console.error("Error creando administrador:", error)
    const message =
      error instanceof Error ? error.message : "Error al crear administrador"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
