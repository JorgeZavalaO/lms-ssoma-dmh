import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import * as XLSX from "xlsx"
import { requireStaff, resolveCollaboratorScope } from "@/lib/authorization"
import { mapProgressStatusForClient } from "@/lib/progress-status"

const STATUS_LABELS: Record<string, string> = {
  NOT_STARTED: "No Iniciado",
  IN_PROGRESS: "En Progreso",
  PASSED: "Completado",
  FAILED: "Fallido",
  EXEMPTED: "Exento",
  EXPIRED: "Vencido",
}

function fmtDate(value: string | Date | null | undefined): string {
  if (!value) return "-"
  const d = typeof value === "string" ? new Date(value) : value
  if (isNaN(d.getTime())) return "-"
  const dd = String(d.getDate()).padStart(2, "0")
  const mm = String(d.getMonth() + 1).padStart(2, "0")
  return `${dd}/${mm}/${d.getFullYear()}`
}

// GET /api/progress/courses/export
export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session || !session.user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const staffCheck = await requireStaff(session)
    if (staffCheck) return staffCheck

    const { searchParams } = new URL(req.url)
    const requestedCollaboratorId = searchParams.get("collaboratorId")
    const status = searchParams.get("status")
    const search = searchParams.get("search")?.trim() || ""

    const scope = resolveCollaboratorScope(session, requestedCollaboratorId)
    if (!scope.ok) return scope.response
    const collaboratorId = scope.collaboratorId

    // Where base
    const where: Record<string, unknown> = {}
    if (collaboratorId) where.collaboratorId = collaboratorId
    if (status && status !== "all") where.status = status
    if (search) {
      where.OR = [
        { collaborator: { fullName: { contains: search, mode: "insensitive" } } },
        { collaborator: { email: { contains: search, mode: "insensitive" } } },
        { collaborator: { dni: { contains: search, mode: "insensitive" } } },
        { course: { name: { contains: search, mode: "insensitive" } } },
        { course: { code: { contains: search, mode: "insensitive" } } },
      ]
    }

    const progressData = await prisma.courseProgress.findMany({
      where,
      include: {
        collaborator: {
          select: {
            id: true,
            fullName: true,
            email: true,
            dni: true,
            area: { select: { name: true } },
            position: { select: { name: true } },
            site: { select: { name: true } },
          },
        },
        course: {
          select: { id: true, name: true, code: true },
        },
      },
      orderBy: [
        { collaborator: { fullName: "asc" } },
        { course: { name: "asc" } },
      ],
    })

    // Mapear estado a etiqueta legible
    const rows = progressData.map((p) => {
      const clientStatus = mapProgressStatusForClient(p.status)
      return {
        dni: p.collaborator.dni,
        nombre: p.collaborator.fullName,
        email: p.collaborator.email,
        area: p.collaborator.area?.name ?? "-",
        cargo: p.collaborator.position?.name ?? "-",
        sede: p.collaborator.site?.name ?? "-",
        curso: p.course.name,
        codigo: p.course.code ?? "-",
        estado: STATUS_LABELS[clientStatus] ?? clientStatus,
        progreso: p.progressPercent ?? 0,
        fechaInicio: fmtDate(p.startedAt),
        fechaCompletado: fmtDate(p.completedAt),
        fechaVencimiento: fmtDate(p.expiresAt),
        certificado: p.certifiedAt ? "Sí" : "No",
      }
    })

    // ── Hoja 1: Resumen ────────────────────────────────────────────────
    const byStatus: Record<string, number> = {}
    for (const r of rows) {
      byStatus[r.estado] = (byStatus[r.estado] ?? 0) + 1
    }
    const summaryRows: (string | number)[][] = [
      ["Métrica", "Valor"],
      ["Total de registros", rows.length],
      ...Object.entries(byStatus).map(([k, v]) => [k, v]),
      [],
      ["Generado el", fmtDate(new Date())],
    ]
    if (search) summaryRows.push(["Filtro búsqueda", search])
    if (status && status !== "all") summaryRows.push(["Filtro estado", STATUS_LABELS[status] ?? status])

    // ── Hoja 2: Tracking de Avance ─────────────────────────────────────
    const headers = [
      "DNI",
      "Nombre Completo",
      "Email",
      "Área",
      "Cargo",
      "Sede",
      "Curso",
      "Código Curso",
      "Estado",
      "Avance %",
      "Fecha Inicio",
      "Fecha Completado",
      "Fecha Vencimiento",
      "Certificado",
    ]
    const dataRows = rows.map((r) => [
      r.dni,
      r.nombre,
      r.email,
      r.area,
      r.cargo,
      r.sede,
      r.curso,
      r.codigo,
      r.estado,
      r.progreso,
      r.fechaInicio,
      r.fechaCompletado,
      r.fechaVencimiento,
      r.certificado,
    ])

    // ── Construir workbook ─────────────────────────────────────────────
    const wb = XLSX.utils.book_new()

    const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows)
    wsSummary["!cols"] = [{ wch: 28 }, { wch: 20 }]
    XLSX.utils.book_append_sheet(wb, wsSummary, "Resumen")

    const wsTracking = XLSX.utils.aoa_to_sheet([headers, ...dataRows])
    wsTracking["!cols"] = [
      { wch: 12 }, // DNI
      { wch: 28 }, // Nombre
      { wch: 28 }, // Email
      { wch: 20 }, // Área
      { wch: 22 }, // Cargo
      { wch: 18 }, // Sede
      { wch: 35 }, // Curso
      { wch: 14 }, // Código
      { wch: 14 }, // Estado
      { wch: 10 }, // Avance %
      { wch: 14 }, // Fecha Inicio
      { wch: 16 }, // Fecha Completado
      { wch: 16 }, // Fecha Vencimiento
      { wch: 12 }, // Certificado
    ]
    XLSX.utils.book_append_sheet(wb, wsTracking, "Tracking de Avance")

    // Buffer en formato xlsx (binary string interno de SheetJS — encoding correcto)
    const buffer = XLSX.write(wb, { bookType: "xlsx", type: "buffer" })

    const filename = `Tracking_Avance_${new Date().toISOString().split("T")[0]}.xlsx`

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
      },
    })
  } catch (error) {
    console.error("[progress/courses/export] Error:", error)
    return NextResponse.json({ error: "Error al generar el reporte" }, { status: 500 })
  }
}
