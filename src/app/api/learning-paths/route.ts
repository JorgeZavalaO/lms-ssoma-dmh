import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { LearningPathSchema } from "@/validations/courses"

export async function GET(req: Request) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const status = searchParams.get("status")
    
    const where: Record<string, unknown> = {}
    if (status) where.status = status as "DRAFT" | "PUBLISHED" | "ARCHIVED"
    
    // Filtrar por colaborador si es COLLABORATOR
    if (session.user.role === "COLLABORATOR") {
      if (!session.user.collaboratorId) {
        return NextResponse.json(
          { error: "Usuario sin colaborador asociado" },
          { status: 400 }
        )
      }
      // Solo mostrar rutas donde el colaborador tiene progreso (está asignado)
      where.progress = {
        some: {
          collaboratorId: session.user.collaboratorId,
        },
      }
    }
    
    const items = await prisma.learningPath.findMany({
      where,
      include: {
        courses: {
          include: {
            course: {
              select: {
                id: true,
                code: true,
                name: true,
                duration: true,
                status: true,
              }
            },
            prerequisite: {
              include: {
                course: {
                  select: {
                    id: true,
                    code: true,
                    name: true,
                  }
                }
              }
            }
          },
          orderBy: { order: "asc" }
        },
        // Incluir progreso si es colaborador
        ...(session.user.role === "COLLABORATOR" && session.user.collaboratorId
          ? {
              progress: {
                where: { collaboratorId: session.user.collaboratorId },
                select: {
                  progressPercent: true,
                  coursesCompleted: true,
                  coursesTotal: true,
                  startedAt: true,
                  completedAt: true,
                },
              },
            }
          : {}),
        _count: {
          select: {
            courses: true,
          }
        }
      },
      orderBy: { createdAt: "desc" }
    })
    
    return NextResponse.json(items)
  } catch (err) {
    console.error("Error fetching learning paths:", err)
    return NextResponse.json({ error: "Error fetching learning paths" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUPERADMIN")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    
    const body = await req.json()
    const data = LearningPathSchema.parse(body)
    
    const created = await prisma.learningPath.create({
      data,
      include: {
        courses: true,
      }
    })
    
    return NextResponse.json(created, { status: 201 })
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    return NextResponse.json({ error: "Error creating learning path" }, { status: 500 })
  }
}
