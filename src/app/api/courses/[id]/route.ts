import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { CourseUpdateSchema } from "@/validations/courses"

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const course = await prisma.course.findUnique({
      where: { id },
      include: {
        versions: {
          orderBy: { version: "desc" }
        },
        _count: {
          select: {
            areaLinks: true,
            posLinks: true,
            siteLinks: true,
            collLinks: true,
            pathCourses: true,
          }
        }
      }
    })
    
    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 })
    }
    
    return NextResponse.json(course)
  } catch (err) {
    console.error("Error fetching course:", err)
    return NextResponse.json({ error: "Error fetching course" }, { status: 500 })
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
    const data = CourseUpdateSchema.parse(body)
    
    // Verificar si el curso existe
    const existing = await prisma.course.findUnique({
      where: { id },
      include: { versions: { orderBy: { version: "desc" }, take: 1 } }
    })
    
    if (!existing) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 })
    }
    
    // Crear nueva versión si hay cambios significativos
    const hasSignificantChanges = 
      (data.name && data.name !== existing.name) ||
      (data.objective && data.objective !== existing.objective) ||
      (data.duration && data.duration !== existing.duration) ||
      (data.modality && data.modality !== existing.modality) ||
      (data.validity && data.validity !== existing.validity)
    
    const newVersion = hasSignificantChanges ? existing.currentVersion + 1 : existing.currentVersion
    
    const updated = await prisma.course.update({
      where: { id },
      data: {
        ...data,
        currentVersion: newVersion,
        ...(hasSignificantChanges && {
          versions: {
            create: {
              version: newVersion,
              name: data.name || existing.name,
              description: data.description ?? existing.description,
              objective: data.objective ?? existing.objective,
              duration: data.duration ?? existing.duration,
              modality: data.modality || existing.modality,
              validity: data.validity ?? existing.validity,
              requirements: data.requirements ?? existing.requirements,
              status: data.status || existing.status,
              createdBy: session.user.id,
            }
          }
        })
      },
      include: {
        versions: { orderBy: { version: "desc" } }
      }
    })
    
    return NextResponse.json(updated)
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    return NextResponse.json({ error: "Error updating course" }, { status: 500 })
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
    
    // Verificar si tiene asignaciones
    const course = await prisma.course.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            areaLinks: true,
            posLinks: true,
            siteLinks: true,
            collLinks: true,
            pathCourses: true,
          }
        }
      }
    })
    
    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 })
    }
    
    const totalLinks = 
      course._count.areaLinks +
      course._count.posLinks +
      course._count.siteLinks +
      course._count.collLinks +
      course._count.pathCourses
    
    if (totalLinks > 0) {
      return NextResponse.json(
        { error: "No se puede eliminar el curso porque tiene asignaciones activas" },
        { status: 400 }
      )
    }
    
    await prisma.course.delete({ where: { id } })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    return NextResponse.json({ error: "Error deleting course" }, { status: 500 })
  }
}
