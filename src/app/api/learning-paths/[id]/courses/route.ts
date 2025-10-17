import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { LearningPathCourseSchema } from "@/validations/courses"

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUPERADMIN")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    
    const { id: pathId } = await params
    const body = await req.json()
    const data = LearningPathCourseSchema.parse(body)
    
    const created = await prisma.learningPathCourse.create({
      data: {
        pathId,
        ...data,
      },
      include: {
        course: true,
        prerequisite: {
          include: {
            course: true
          }
        }
      }
    })
    
    return NextResponse.json(created, { status: 201 })
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    return NextResponse.json({ error: "Error adding course to path" }, { status: 500 })
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
    
    const { id: pathId } = await params
    const { searchParams } = new URL(req.url)
    const courseId = searchParams.get("courseId")
    
    if (!courseId) {
      return NextResponse.json({ error: "courseId is required" }, { status: 400 })
    }
    
    await prisma.learningPathCourse.deleteMany({
      where: {
        pathId,
        courseId,
      }
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    return NextResponse.json({ error: "Error removing course from path" }, { status: 500 })
  }
}
