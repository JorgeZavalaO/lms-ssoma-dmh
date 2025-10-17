import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// POST /api/progress/alerts/generate - Generar alertas automáticas
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user?.role || !["ADMIN", "SUPERADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const now = new Date();
    const thirtyDaysFromNow = new Date(now);
    thirtyDaysFromNow.setDate(now.getDate() + 30);

    const alertsCreated = [];

    // 1. Alertas de cursos próximos a vencer (30 días)
    const expiringSoon = await prisma.courseProgress.findMany({
      where: {
        expiresAt: {
          gte: now,
          lte: thirtyDaysFromNow,
        },
        status: "PASSED",
      },
      include: {
        collaborator: true,
        course: true,
      },
    });

    for (const progress of expiringSoon) {
      // Verificar que no exista una alerta similar reciente
      const existingAlert = await prisma.progressAlert.findFirst({
        where: {
          collaboratorId: progress.collaboratorId,
          courseId: progress.courseId,
          type: "EXPIRING_SOON",
          createdAt: {
            gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), // últimos 7 días
          },
        },
      });

      if (!existingAlert) {
        const daysRemaining = Math.ceil(
          (progress.expiresAt!.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );

        const alert = await prisma.progressAlert.create({
          data: {
            collaboratorId: progress.collaboratorId,
            courseId: progress.courseId,
            type: "EXPIRING_SOON",
            severity: daysRemaining <= 7 ? 3 : 2,
            title: `Curso próximo a vencer`,
            message: `El curso "${progress.course.name}" expirará en ${daysRemaining} días`,
            dueDate: progress.expiresAt,
            metadata: {
              expiresAt: progress.expiresAt,
              daysRemaining,
            } as any,
          },
        });

        alertsCreated.push(alert);
      }
    }

    // 2. Alertas de cursos vencidos
    const expired = await prisma.courseProgress.findMany({
      where: {
        expiresAt: {
          lt: now,
        },
        status: "PASSED",
      },
      include: {
        collaborator: true,
        course: true,
      },
    });

    for (const progress of expired) {
      // Verificar que no exista una alerta similar reciente
      const existingAlert = await prisma.progressAlert.findFirst({
        where: {
          collaboratorId: progress.collaboratorId,
          courseId: progress.courseId,
          type: "EXPIRED",
          createdAt: {
            gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000), // últimos 30 días
          },
        },
      });

      if (!existingAlert) {
        const daysExpired = Math.ceil(
          (now.getTime() - progress.expiresAt!.getTime()) / (1000 * 60 * 60 * 24)
        );

        const alert = await prisma.progressAlert.create({
          data: {
            collaboratorId: progress.collaboratorId,
            courseId: progress.courseId,
            type: "EXPIRED",
            severity: 3,
            title: `Curso vencido`,
            message: `El curso "${progress.course.name}" expiró hace ${daysExpired} días`,
            dueDate: progress.expiresAt,
            metadata: {
              expiresAt: progress.expiresAt,
              daysExpired,
            } as any,
          },
        });

        alertsCreated.push(alert);

        // Actualizar estado del progreso a EXPIRED
        await prisma.courseProgress.update({
          where: { id: progress.id },
          data: { status: "EXPIRED" },
        });
      }
    }

    // 3. Alertas de recertificación (certificaciones que expiran en 60 días)
    const sixtyDaysFromNow = new Date(now);
    sixtyDaysFromNow.setDate(now.getDate() + 60);

    const certificationsExpiring = await prisma.certificationRecord.findMany({
      where: {
        expiresAt: {
          gte: now,
          lte: sixtyDaysFromNow,
        },
        isValid: true,
      },
      include: {
        collaborator: true,
        course: true,
      },
    });

    for (const cert of certificationsExpiring) {
      const existingAlert = await prisma.progressAlert.findFirst({
        where: {
          collaboratorId: cert.collaboratorId,
          courseId: cert.courseId,
          type: "RECERTIFICATION",
          createdAt: {
            gte: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000), // últimos 14 días
          },
        },
      });

      if (!existingAlert) {
        const daysRemaining = Math.ceil(
          (cert.expiresAt!.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );

        const alert = await prisma.progressAlert.create({
          data: {
            collaboratorId: cert.collaboratorId,
            courseId: cert.courseId,
            type: "RECERTIFICATION",
            severity: daysRemaining <= 30 ? 3 : 2,
            title: `Recertificación requerida`,
            message: `Requiere recertificación en "${cert.course.name}" en ${daysRemaining} días`,
            dueDate: cert.expiresAt,
            metadata: {
              certificationId: cert.id,
              expiresAt: cert.expiresAt,
              daysRemaining,
            } as any,
          },
        });

        alertsCreated.push(alert);
      }
    }

    return NextResponse.json({
      message: `Se generaron ${alertsCreated.length} alertas`,
      alertsCreated: alertsCreated.length,
      breakdown: {
        expiringSoon: alertsCreated.filter((a) => a.type === "EXPIRING_SOON").length,
        expired: alertsCreated.filter((a) => a.type === "EXPIRED").length,
        recertification: alertsCreated.filter((a) => a.type === "RECERTIFICATION").length,
      },
    });
  } catch (error: any) {
    console.error("Error generating alerts:", error);
    return NextResponse.json(
      { error: error.message || "Error al generar alertas" },
      { status: 500 }
    );
  }
}
