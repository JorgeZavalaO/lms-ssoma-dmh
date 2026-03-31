import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { requireStaff } from "@/lib/authorization"
import { getComplianceReport } from "@/lib/reports"
import * as XLSX from "xlsx"

const STATUS_LABELS: Record<string, string> = {
  COMPLIANT: "Cumple",
  EXPIRING_SOON: "Por vencer",
  EXPIRED: "Vencido",
  NOT_ENROLLED: "No inscrito",
}

function fmtDate(value: Date | string | null | undefined): string {
  if (!value) return "-"
  const d = typeof value === "string" ? new Date(value) : value
  if (isNaN(d.getTime())) return "-"
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    const authError = await requireStaff(session)
    if (authError) return authError

    // área por nombre (el cliente filtra por nombre, no ID)
    const areaName = new URL(req.url).searchParams.get("area") || undefined

    const matrix = await getComplianceReport({})
    const filtered = areaName ? matrix.filter((r) => r.area === areaName) : matrix

    // ── Stats ──────────────────────────────────────────────────────
    const compliant = filtered.filter((r) => r.courses.every((c) => c.status === "COMPLIANT")).length
    const expiringSoon = filtered.filter((r) => r.courses.some((c) => c.status === "EXPIRING_SOON")).length
    const critical = filtered.filter((r) =>
      r.courses.some((c) => c.status === "EXPIRED" || c.status === "NOT_ENROLLED")
    ).length
    const complianceRate =
      filtered.length > 0 ? ((compliant / filtered.length) * 100).toFixed(1) : "0.0"

    const wb = XLSX.utils.book_new()

    // ── Hoja 1: Resumen ────────────────────────────────────────────
    const summaryRows: (string | number)[][] = [
      ["Métrica", "Valor"],
      ["Total Colaboradores", filtered.length],
      ["Cumplen Requisitos (100%)", compliant],
      ["Por Vencer (≤30 días)", expiringSoon],
      ["Con Alertas Críticas", critical],
      ["Tasa de Cumplimiento", `${complianceRate}%`],
      [],
      ["Generado el", fmtDate(new Date())],
    ]
    if (areaName) summaryRows.push(["Filtro Área", areaName])
    const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows)
    wsSummary["!cols"] = [{ wch: 32 }, { wch: 20 }]
    XLSX.utils.book_append_sheet(wb, wsSummary, "Resumen")

    // ── Hoja 2: Detalle (colaborador × curso) ─────────────────────
    const detailHeaders = [
      "Colaborador", "Área", "Cargo", "Curso", "Obligatorio",
      "Estado", "Fecha Vencimiento", "Días Restantes",
    ]
    const detailRows: (string | number)[][] = [detailHeaders]
    for (const record of filtered) {
      for (const course of record.courses) {
        detailRows.push([
          record.fullName,
          record.area ?? "-",
          record.position ?? "-",
          course.courseName,
          course.isRequired ? "Sí" : "No",
          STATUS_LABELS[course.status] ?? course.status,
          course.expiresAt ? fmtDate(new Date(course.expiresAt)) : "-",
          course.daysUntilExpiration !== null ? course.daysUntilExpiration : "-",
        ])
      }
    }
    const wsDetail = XLSX.utils.aoa_to_sheet(detailRows)
    wsDetail["!cols"] = [
      { wch: 28 }, { wch: 20 }, { wch: 22 }, { wch: 35 },
      { wch: 12 }, { wch: 14 }, { wch: 16 }, { wch: 14 },
    ]
    XLSX.utils.book_append_sheet(wb, wsDetail, "Detalle")

    // ── Hoja 3: Por Área ──────────────────────────────────────────
    const areaNames = Array.from(
      new Set(filtered.map((r) => r.area).filter(Boolean))
    ) as string[]
    const areaHeaderRow = ["Área", "Total", "Cumplen", "Por Vencer", "Críticos", "% Cumplimiento"]
    const areaRows: (string | number)[][] = [areaHeaderRow]
    for (const area of areaNames.sort()) {
      const areaData = filtered.filter((r) => r.area === area)
      const ac = areaData.filter((r) => r.courses.every((c) => c.status === "COMPLIANT")).length
      const ae = areaData.filter((r) => r.courses.some((c) => c.status === "EXPIRING_SOON")).length
      const ax = areaData.filter((r) =>
        r.courses.some((c) => c.status === "EXPIRED" || c.status === "NOT_ENROLLED")
      ).length
      areaRows.push([
        area,
        areaData.length,
        ac,
        ae,
        ax,
        areaData.length > 0 ? `${((ac / areaData.length) * 100).toFixed(1)}%` : "0%",
      ])
    }
    const wsArea = XLSX.utils.aoa_to_sheet(areaRows)
    wsArea["!cols"] = [{ wch: 24 }, { wch: 10 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 16 }]
    XLSX.utils.book_append_sheet(wb, wsArea, "Por Área")

    const buffer = XLSX.write(wb, { bookType: "xlsx", type: "buffer" })
    const filename = `Cumplimiento_SSOMA_${new Date().toISOString().split("T")[0]}.xlsx`

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
      },
    })
  } catch (error) {
    console.error("[compliance/export] Error:", error)
    return NextResponse.json({ error: "Error al generar el reporte" }, { status: 500 })
  }
}
