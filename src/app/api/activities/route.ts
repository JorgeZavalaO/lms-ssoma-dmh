import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { InteractiveActivitySchema } from "@/validations/content"

// GET - Listar actividades
export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const courseId = searchParams.get("courseId")

    const activities = await prisma.interactiveActivity.findMany({
      where: courseId ? { courseId } : undefined,
      include: {
        _count: {
          select: { attempts: true },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(activities)
  } catch (error) {
    console.error("Error fetching activities:", error)
    return NextResponse.json(
      { error: "Error al obtener actividades" },
      { status: 500 }
    )
  }
}

// POST - Crear actividad
export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "SUPERADMIN")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    const body = await req.json()
    const validated = InteractiveActivitySchema.parse(body)

    const activity = await prisma.interactiveActivity.create({
      data: validated,
    })

    return NextResponse.json(activity, { status: 201 })
  } catch (error: unknown) {
    console.error("Error creating activity:", error)
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Datos inválidos" }, { status: 400 })
    }
    return NextResponse.json(
      { error: "Error al crear actividad" },
      { status: 500 }
    )
  }
}
