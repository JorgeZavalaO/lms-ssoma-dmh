import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { LearningPathSchema } from "@/validations/courses"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const status = searchParams.get("status")
    
    const where = status ? { status: status as "DRAFT" | "PUBLISHED" | "ARCHIVED" } : {}
    
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
