import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// GET /api/progress/paths - Obtener progreso de rutas de aprendizaje
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const collaboratorId = searchParams.get("collaboratorId") || session.user.id;
    const pathId = searchParams.get("pathId");

    // Si no es admin, solo puede ver su propio progreso
    if (
      collaboratorId !== session.user.id &&
      (!session.user.role || !["ADMIN", "SUPERADMIN"].includes(session.user.role))
    ) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const where: any = { collaboratorId };
    if (pathId) where.learningPathId = pathId;

    // Obtener progreso existente o calcular
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
    });

    // Si no hay progreso guardado, calcular dinámicamente
    if (pathProgress.length === 0 && pathId) {
      const path = await prisma.learningPath.findUnique({
        where: { id: pathId },
        include: {
          courses: {
            include: {
              course: true,
            },
          },
        },
      });

      if (path) {
        const totalCourses = path.courses.length;
        const completedCourses = await prisma.courseProgress.count({
          where: {
            collaboratorId,
            courseId: {
              in: path.courses.map((lpc) => lpc.courseId),
            },
            status: "PASSED",
          },
        });

        const progressPercent = totalCourses > 0 
          ? Math.round((completedCourses / totalCourses) * 100) 
          : 0;

        return NextResponse.json([{
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
        }]);
      }
    }

    // Actualizar porcentajes en tiempo real
    const updatedProgress = await Promise.all(
      pathProgress.map(async (progress) => {
        const totalCourses = progress.learningPath.courses.length;
        const completedCourses = await prisma.courseProgress.count({
          where: {
            collaboratorId,
            courseId: {
              in: progress.learningPath.courses.map((lpc) => lpc.courseId),
            },
            status: "PASSED",
          },
        });

        const progressPercent = totalCourses > 0 
          ? Math.round((completedCourses / totalCourses) * 100) 
          : 0;

        return {
          ...progress,
          progressPercent,
          completedCourses,
          totalCourses,
        };
      })
    );

    return NextResponse.json(updatedProgress);
  } catch (error: any) {
    console.error("Error fetching learning path progress:", error);
    return NextResponse.json(
      { error: "Error al obtener progreso de rutas de aprendizaje" },
      { status: 500 }
    );
  }
}

// POST /api/progress/paths - Crear/actualizar progreso de ruta
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const body = await req.json();
    const { learningPathId, collaboratorId } = body;

    const targetCollaboratorId = collaboratorId || session.user.id;

    // Si no es admin, solo puede crear su propio progreso
    if (
      targetCollaboratorId !== session.user.id &&
      (!session.user.role || !["ADMIN", "SUPERADMIN"].includes(session.user.role))
    ) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    if (!learningPathId) {
      return NextResponse.json(
        { error: "learningPathId es requerido" },
        { status: 400 }
      );
    }

    // Verificar que la ruta existe
    const path = await prisma.learningPath.findUnique({
      where: { id: learningPathId },
      include: {
        courses: {
          include: {
            course: true,
          },
        },
      },
    });

    if (!path) {
      return NextResponse.json(
        { error: "Ruta de aprendizaje no encontrada" },
        { status: 404 }
      );
    }

    // Calcular progreso
    const totalCourses = path.courses.length;
    const completedCourses = await prisma.courseProgress.count({
      where: {
        collaboratorId: targetCollaboratorId,
        courseId: {
          in: path.courses.map((lpc) => lpc.courseId),
        },
        status: "PASSED",
      },
    });

    const progressPercent = totalCourses > 0 
      ? Math.round((completedCourses / totalCourses) * 100) 
      : 0;

    // Buscar progreso existente
    let pathProgress = await prisma.learningPathProgress.findFirst({
      where: {
        learningPathId,
        collaboratorId: targetCollaboratorId,
      },
    });

    if (pathProgress) {
      // Actualizar
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
      });
    } else {
      // Crear
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
      });
    }

    return NextResponse.json(pathProgress);
  } catch (error: any) {
    console.error("Error creating/updating learning path progress:", error);
    return NextResponse.json(
      { error: error.message || "Error al actualizar progreso de ruta" },
      { status: 500 }
    );
  }
}
