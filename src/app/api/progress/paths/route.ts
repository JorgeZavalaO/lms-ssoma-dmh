import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { resolveCollaboratorScope } from "@/lib/authorization"

async function getAccessibleLearningPathIds(
  collaboratorId: string,
  options?: {
    pathId?: string | null
    publishedOnly?: boolean
  }
) {
  const enrollments = await prisma.enrollment.findMany({
    where: {
      collaboratorId,
      learningPathId: options?.pathId ?? { not: null },
      status: { not: "CANCELLED" },
      ...(options?.publishedOnly && {
        learningPath: {
          status: "PUBLISHED",
        },
      }),
    },
    select: {
      learningPathId: true,
    },
  })

  return Array.from(
    new Set(
      enrollments
        .map((enrollment) => enrollment.learningPathId)
        .filter((learningPathId): learningPathId is string => Boolean(learningPathId))
    )
  )
}

// GET /api/progress/paths - Obtener progreso de rutas de aprendizaje
export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const requestedCollaboratorId = searchParams.get("collaboratorId")
    const pathId = searchParams.get("pathId")
    const isStaff =
      session.user.role === "ADMIN" || session.user.role === "SUPERADMIN"

    const scope = resolveCollaboratorScope(session, requestedCollaboratorId)
    if (!scope.ok) return scope.response
    const collaboratorId = scope.collaboratorId

    const where: Record<string, unknown> = {}
    if (collaboratorId) {
      where.collaboratorId = collaboratorId

      const accessiblePathIds = await getAccessibleLearningPathIds(collaboratorId, {
        pathId,
        publishedOnly: !isStaff,
      })

      if (pathId && !accessiblePathIds.includes(pathId)) {
        return NextResponse.json(
          { error: "No tienes una asignacion activa para esta ruta de aprendizaje" },
          { status: 403 }
        )
      }

      where.learningPathId = pathId ? pathId : { in: accessiblePathIds }
    } else if (pathId) {
      where.learningPathId = pathId
    }

    const pathProgress = await prisma.learningPathProgress.findMany({
      where,
      include: {
        learningPath: {
          include: {
            courses: {
              include: {
                course: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    })

    if (pathProgress.length === 0 && pathId && collaboratorId) {
      const path = await prisma.learningPath.findUnique({
        where: { id: pathId },
        include: {
          courses: {
            include: {
              course: true,
            },
          },
        },
      })

      if (path) {
        if (!isStaff && path.status !== "PUBLISHED") {
          return NextResponse.json(
            { error: "La ruta de aprendizaje no esta disponible" },
            { status: 403 }
          )
        }

        const totalCourses = path.courses.length
        const completedCourses = await prisma.courseProgress.count({
          where: {
            collaboratorId,
            courseId: {
              in: path.courses.map((learningPathCourse) => learningPathCourse.courseId),
            },
            status: "PASSED",
          },
        })

        const progressPercent =
          totalCourses > 0 ? Math.round((completedCourses / totalCourses) * 100) : 0

        return NextResponse.json([
          {
            id: null,
            learningPathId: pathId,
            collaboratorId,
            progressPercent,
            completedCourses,
            totalCourses,
            startedAt: null,
            completedAt: null,
            createdAt: new Date(),
            updatedAt: new Date(),
            learningPath: path,
          },
        ])
      }
    }

    const updatedProgress = await Promise.all(
      pathProgress.map(async (progress) => {
        const totalCourses = progress.learningPath.courses.length
        const completedCourses = await prisma.courseProgress.count({
          where: {
            collaboratorId: progress.collaboratorId,
            courseId: {
              in: progress.learningPath.courses.map(
                (learningPathCourse) => learningPathCourse.courseId
              ),
            },
            status: "PASSED",
          },
        })

        const progressPercent =
          totalCourses > 0 ? Math.round((completedCourses / totalCourses) * 100) : 0

        return {
          ...progress,
          progressPercent,
          completedCourses,
          totalCourses,
        }
      })
    )

    return NextResponse.json(updatedProgress)
  } catch (error: any) {
    console.error("Error fetching learning path progress:", error)
    return NextResponse.json(
      { error: "Error al obtener progreso de rutas de aprendizaje" },
      { status: 500 }
    )
  }
}

// POST /api/progress/paths - Crear/actualizar progreso de ruta
export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const body = await req.json()
    const { learningPathId, collaboratorId } = body
    const scope = resolveCollaboratorScope(session, collaboratorId, {
      requireForStaff: true,
    })
    if (!scope.ok) return scope.response

    const targetCollaboratorId = scope.collaboratorId!
    const isStaff =
      session.user.role === "ADMIN" || session.user.role === "SUPERADMIN"

    if (!learningPathId) {
      return NextResponse.json(
        { error: "learningPathId es requerido" },
        { status: 400 }
      )
    }

    const path = await prisma.learningPath.findUnique({
      where: { id: learningPathId },
      include: {
        courses: {
          include: {
            course: true,
          },
        },
      },
    })

    if (!path) {
      return NextResponse.json(
        { error: "Ruta de aprendizaje no encontrada" },
        { status: 404 }
      )
    }

    const enrollment = await prisma.enrollment.findFirst({
      where: {
        collaboratorId: targetCollaboratorId,
        learningPathId,
        status: { not: "CANCELLED" },
      },
      select: { id: true },
    })

    if (!enrollment) {
      return NextResponse.json(
        { error: "No existe una asignacion activa para esta ruta de aprendizaje" },
        { status: 403 }
      )
    }

    if (!isStaff && path.status !== "PUBLISHED") {
      return NextResponse.json(
        { error: "La ruta de aprendizaje no esta disponible" },
        { status: 403 }
      )
    }

    const totalCourses = path.courses.length
    const completedCourses = await prisma.courseProgress.count({
      where: {
        collaboratorId: targetCollaboratorId,
        courseId: {
          in: path.courses.map((learningPathCourse) => learningPathCourse.courseId),
        },
        status: "PASSED",
      },
    })

    const progressPercent =
      totalCourses > 0 ? Math.round((completedCourses / totalCourses) * 100) : 0

    let pathProgress = await prisma.learningPathProgress.findFirst({
      where: {
        learningPathId,
        collaboratorId: targetCollaboratorId,
      },
    })

    if (pathProgress) {
      pathProgress = await prisma.learningPathProgress.update({
        where: { id: pathProgress.id },
        data: {
          progressPercent,
          coursesCompleted: completedCourses,
          coursesTotal: totalCourses,
          completedAt: progressPercent === 100 ? new Date() : null,
          lastActivityAt: new Date(),
        },
        include: {
          learningPath: {
            include: {
              courses: {
                include: {
                  course: {
                    select: { id: true, name: true },
                  },
                },
              },
            },
          },
        },
      })
    } else {
      pathProgress = await prisma.learningPathProgress.create({
        data: {
          learningPathId,
          collaboratorId: targetCollaboratorId,
          progressPercent,
          coursesCompleted: completedCourses,
          coursesTotal: totalCourses,
          startedAt: new Date(),
          completedAt: progressPercent === 100 ? new Date() : null,
          lastActivityAt: new Date(),
        },
        include: {
          learningPath: {
            include: {
              courses: {
                include: {
                  course: {
                    select: { id: true, name: true },
                  },
                },
              },
            },
          },
        },
      })
    }

    return NextResponse.json(pathProgress)
  } catch (error: any) {
    console.error("Error creating/updating learning path progress:", error)
    return NextResponse.json(
      { error: error.message || "Error al actualizar progreso de ruta" },
      { status: 500 }
    )
  }
}
