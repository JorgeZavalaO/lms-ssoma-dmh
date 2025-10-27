import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { CourseSchema } from "@/validations/courses"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const status = searchParams.get("status")
    
    const where = status ? { status: status as "DRAFT" | "PUBLISHED" | "ARCHIVED" } : {}
    
    const items = await prisma.course.findMany({
      where,
      include: {
        _count: {
          select: {
            versions: true,
            pathCourses: true,
          }
        }
      },
      orderBy: { createdAt: "desc" }
    })
    
    return NextResponse.json(items)
  } catch (err) {
    console.error("Error fetching courses:", err)
    return NextResponse.json({ error: "Error fetching courses" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUPERADMIN")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    
    const body = await req.json()
    const validatedData = CourseSchema.parse(body)
    
    // Generar código automático si no se proporciona
    // eslint-disable-next-line prefer-const
    let data = { ...validatedData }
    if (!data.code) {
      const lastCourse = await prisma.course.findFirst({
        orderBy: { createdAt: "desc" },
        select: { code: true }
      })
      
      let nextNumber = 1
      if (lastCourse?.code) {
        const match = lastCourse.code.match(/CRS-(\d+)/)
        if (match) {
          nextNumber = parseInt(match[1]) + 1
        }
      }
      
      data.code = `CRS-${nextNumber.toString().padStart(3, '0')}`
    }
    
    // Crear el curso y su primera versión
    const created = await prisma.course.create({
      data: {
        ...data,
        versions: {
          create: {
            version: 1,
            name: data.name,
            description: data.description,
            objective: data.objective,
            duration: data.duration,
            modality: data.modality,
            validity: data.validity,
            requirements: data.requirements,
            status: data.status,
            createdBy: session.user.id,
          }
        }
      },
      include: {
        versions: true,
      }
    })
    
    return NextResponse.json(created, { status: 201 })
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    return NextResponse.json({ error: "Error creating course" }, { status: 500 })
  }
}
