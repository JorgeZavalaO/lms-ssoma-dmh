import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { LearningPathSchema } from "@/validations/courses"

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const path = await prisma.learningPath.findUnique({
      where: { id },
      include: {
        courses: {
          include: {
            course: true,
            prerequisite: {
              include: {
                course: true
              }
            },
            dependents: {
              include: {
                course: true
              }
            }
          },
          orderBy: { order: "asc" }
        }
      }
    })
    
    if (!path) {
      return NextResponse.json({ error: "Learning path not found" }, { status: 404 })
    }
    
    return NextResponse.json(path)
  } catch (err) {
    console.error("Error fetching learning path:", err)
    return NextResponse.json({ error: "Error fetching learning path" }, { status: 500 })
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUPERADMIN")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    
    const { id } = await params
    const body = await req.json()
    const data = LearningPathSchema.partial().parse(body)
    
    const updated = await prisma.learningPath.update({
      where: { id },
      data,
      include: {
        courses: {
          include: {
            course: true,
          },
          orderBy: { order: "asc" }
        }
      }
    })
    
    return NextResponse.json(updated)
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    return NextResponse.json({ error: "Error updating learning path" }, { status: 500 })
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUPERADMIN")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    
    const { id } = await params
    
    await prisma.learningPath.delete({ where: { id } })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    return NextResponse.json({ error: "Error deleting learning path" }, { status: 500 })
  }
}
