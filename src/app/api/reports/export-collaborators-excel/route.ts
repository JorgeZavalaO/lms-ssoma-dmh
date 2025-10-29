import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import * as XLSX from "xlsx"

interface CollaboratorProgressData {
  collaboratorId: string
  dni: string
  fullName: string
  email: string
  position: string | null
  area: string | null
  site: string | null
  entryDate: string
  totalEnrollments: number
  coursesCompleted: number
  coursesInProgress: number
  coursesPending: number
  averageProgress: number
  courses: Array<{
    courseName: string
    enrollmentStatus: string
    enrollmentDate: string
    progressPercent: number
    completedAt: string | null
    expiresAt: string | null
    daysUntilExpiration: number | null
  }>
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    // Verificar que sea admin o superadmin
    if (!session || !session.user || !["ADMIN", "SUPERADMIN"].includes(session.user.role)) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 403 }
      )
    }

    // Obtener todos los colaboradores con sus inscripciones y progreso
    const collaborators = await prisma.collaborator.findMany({
      include: {
        position: true,
        area: true,
        site: true,
        enrollments: {
          where: {
            courseId: {
              not: null,
            },
          },
          include: {
            course: true,
            courseProgress: true,
          },
        },
      },
      orderBy: {
        fullName: "asc",
      },
    })

    // Preparar datos para exportar
    const reportData: CollaboratorProgressData[] = collaborators.map(
      (collab) => {
        const enrollments = collab.enrollments || []
        const completedCourses = enrollments.filter(
          (e) => e.courseProgress?.status === "PASSED"
        ).length
        const inProgressCourses = enrollments.filter(
          (e) => e.courseProgress?.status === "IN_PROGRESS"
        ).length
        const pendingCourses = enrollments.filter(
          (e) => e.courseProgress?.status === "NOT_STARTED"
        ).length

        const progressPercents = enrollments
          .map((e) => e.courseProgress?.progressPercent || 0)
          .filter((p) => p > 0)
        const averageProgress =
          progressPercents.length > 0
            ? Math.round(
                progressPercents.reduce((a: number, b: number) => a + b, 0) /
                  progressPercents.length
              )
            : 0

        return {
          collaboratorId: collab.id,
          dni: collab.dni,
          fullName: collab.fullName,
          email: collab.email,
          position: collab.position?.name || null,
          area: collab.area?.name || null,
          site: collab.site?.name || null,
          entryDate: collab.entryDate.toISOString().split("T")[0],
          totalEnrollments: enrollments.length,
          coursesCompleted: completedCourses,
          coursesInProgress: inProgressCourses,
          coursesPending: pendingCourses,
          averageProgress,
          courses: enrollments.map((enrollment) => {
            const daysUntilExp = enrollment.courseProgress?.expiresAt
              ? Math.ceil(
                  (new Date(enrollment.courseProgress.expiresAt).getTime() -
                    new Date().getTime()) /
                    (1000 * 60 * 60 * 24)
                )
              : null

            return {
              courseName: enrollment.course!.name,
              enrollmentStatus: enrollment.status,
              enrollmentDate: enrollment.enrolledAt
                .toISOString()
                .split("T")[0],
              progressPercent: enrollment.courseProgress?.progressPercent || 0,
              completedAt: enrollment.courseProgress?.completedAt
                ? enrollment.courseProgress.completedAt.toISOString().split("T")[0]
                : null,
              expiresAt: enrollment.courseProgress?.expiresAt
                ? enrollment.courseProgress.expiresAt.toISOString().split("T")[0]
                : null,
              daysUntilExpiration: daysUntilExp,
            }
          }),
        }
      }
    )

    // Crear datos para Excel
    const totalCollaborators = reportData.length
    const totalEnrollments = reportData.reduce(
      (sum, c) => sum + c.totalEnrollments,
      0
    )
    const totalCompleted = reportData.reduce(
      (sum, c) => sum + c.coursesCompleted,
      0
    )
    const totalInProgress = reportData.reduce(
      (sum, c) => sum + c.coursesInProgress,
      0
    )
    const overallAverage = Math.round(
      reportData.reduce((sum, c) => sum + c.averageProgress, 0) /
        (totalCollaborators || 1)
    )

    // Hoja 1: Resumen
    const summaryData = [
      ["Métrica", "Valor"],
      ["Total de Colaboradores", totalCollaborators],
      ["Total de Inscripciones", totalEnrollments],
      ["Cursos Completados", totalCompleted],
      ["Cursos en Progreso", totalInProgress],
      ["Promedio General de Avance", `${overallAverage}%`],
    ]

    // Hoja 2: Colaboradores
    const collaboratorsData = [
      ["DNI", "Nombre Completo", "Email", "Puesto", "Área", "Sede", "Fecha Entrada", "Total Inscripciones", "Completados", "En Progreso", "Pendientes", "Avance Promedio"],
      ...reportData.map((collab) => [
        collab.dni,
        collab.fullName,
        collab.email,
        collab.position || "-",
        collab.area || "-",
        collab.site || "-",
        collab.entryDate,
        collab.totalEnrollments,
        collab.coursesCompleted,
        collab.coursesInProgress,
        collab.coursesPending,
        `${collab.averageProgress}%`,
      ]),
    ]

    // Hoja 3: Detalle de Cursos
    const detailData = [
      ["DNI Colaborador", "Colaborador", "Curso", "Estado Inscripción", "Fecha Inscripción", "Avance %", "Fecha Completado", "Fecha Expiración", "Días Hasta Expiración"],
    ]
    
    reportData.forEach((collab) => {
      collab.courses.forEach((course) => {
        const daysText = course.daysUntilExpiration
          ? course.daysUntilExpiration >= 0
            ? `${course.daysUntilExpiration} días`
            : "VENCIDO"
          : "-"

        detailData.push([
          collab.dni,
          collab.fullName,
          course.courseName,
          course.enrollmentStatus,
          course.enrollmentDate,
          `${course.progressPercent}%`,
          course.completedAt || "-",
          course.expiresAt || "-",
          daysText,
        ])
      })
    })

    // Crear workbook
    const workbook = XLSX.utils.book_new()
    
    // Agregar hojas
    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData)
    const collaboratorsSheet = XLSX.utils.aoa_to_sheet(collaboratorsData)
    const detailSheet = XLSX.utils.aoa_to_sheet(detailData)

    // Ajustar ancho de columnas
    summarySheet["!cols"] = [{ wch: 30 }, { wch: 20 }]
    collaboratorsSheet["!cols"] = [
      { wch: 12 }, { wch: 25 }, { wch: 25 }, { wch: 20 },
      { wch: 20 }, { wch: 20 }, { wch: 15 }, { wch: 15 },
      { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 },
    ]
    detailSheet["!cols"] = [
      { wch: 12 }, { wch: 25 }, { wch: 30 }, { wch: 15 },
      { wch: 15 }, { wch: 12 }, { wch: 15 }, { wch: 15 }, { wch: 18 },
    ]

    XLSX.utils.book_append_sheet(workbook, summarySheet, "Resumen")
    XLSX.utils.book_append_sheet(workbook, collaboratorsSheet, "Colaboradores")
    XLSX.utils.book_append_sheet(workbook, detailSheet, "Detalle Cursos")

    // Generar buffer
    const buffer = XLSX.write(workbook, { bookType: "xlsx", type: "buffer" })

    // Enviar como descarga
    const filename = `Reporte_Colaboradores_${new Date()
      .toISOString()
      .split("T")[0]}.xlsx`

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error("Error generating report:", error)
    return NextResponse.json(
      { error: "Error al generar reporte" },
      { status: 500 }
    )
  }
}
