import { NextRequest, NextResponse } from "next/server"
import * as XLSX from "xlsx"
import { z } from "zod"
import { auth } from "@/auth"
import { listFileInventory, listFileInventoryForExport } from "@/lib/file-inventory"

const ExportQuerySchema = z.object({
  format: z.enum(["csv", "xlsx"]).default("xlsx"),
  q: z.string().optional(),
  fileType: z.enum(["ALL", "PDF", "PPT", "IMAGE", "VIDEO", "DOCUMENT", "OTHER"]).optional(),
  usageState: z.enum(["ALL", "IN_USE", "UNUSED", "HEURISTIC_ONLY"]).optional(),
  tag: z.string().optional(),
})

function exportToCSV(rows: Array<Record<string, string | number>>) {
  const headers = Object.keys(rows[0] ?? {})
  const csv = [
    headers.join(","),
    ...rows.map((row) => headers.map((header) => `"${String(row[header] ?? "").replace(/"/g, '""')}"`).join(",")),
  ].join("\n")

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="repositorio_archivos_${new Date().toISOString().split("T")[0]}.csv"`,
    },
  })
}

function exportToExcel(summary: Record<string, string | number>, rows: Array<Record<string, string | number>>) {
  const workbook = XLSX.utils.book_new()
  const summarySheet = XLSX.utils.json_to_sheet([summary])
  const inventorySheet = XLSX.utils.json_to_sheet(rows)

  summarySheet["!cols"] = [
    { wch: 18 },
    { wch: 18 },
    { wch: 18 },
    { wch: 18 },
    { wch: 18 },
    { wch: 20 },
    { wch: 20 },
  ]

  inventorySheet["!cols"] = [
    { wch: 28 },
    { wch: 14 },
    { wch: 12 },
    { wch: 18 },
    { wch: 18 },
    { wch: 14 },
    { wch: 14 },
    { wch: 16 },
    { wch: 18 },
    { wch: 28 },
    { wch: 22 },
    { wch: 20 },
    { wch: 18 },
    { wch: 70 },
    { wch: 80 },
  ]

  XLSX.utils.book_append_sheet(workbook, summarySheet, "Resumen")
  XLSX.utils.book_append_sheet(workbook, inventorySheet, "Inventario")

  const buffer = XLSX.write(workbook, { bookType: "xlsx", type: "buffer" })
  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="repositorio_archivos_${new Date().toISOString().split("T")[0]}.xlsx"`,
    },
  })
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "SUPERADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const parsed = ExportQuerySchema.parse({
      format: request.nextUrl.searchParams.get("format") ?? "xlsx",
      q: request.nextUrl.searchParams.get("q") ?? undefined,
      fileType: request.nextUrl.searchParams.get("fileType") ?? undefined,
      usageState: request.nextUrl.searchParams.get("usageState") ?? undefined,
      tag: request.nextUrl.searchParams.get("tag") ?? undefined,
    })

    const [items, inventory] = await Promise.all([
      listFileInventoryForExport(parsed),
      listFileInventory({ ...parsed, page: 1, pageSize: 100 }),
    ])

    const rows = items.map((item) => ({
      Nombre: item.name,
      Tipo: item.fileType,
      TamañoBytes: item.size,
      EstadoUso: item.usageState,
      PrioridadRevision: item.reviewPriority,
      DiasDesdeCarga: item.daysSinceUpload,
      ReferenciasDirectas: item.directUsageCount,
      ReferenciasHeuristicas: item.heuristicUsageCount,
      Etiquetas: item.tags.join(", "),
      CursoRelacionado: item.relatedCourseName ?? "",
      UbicacionPrincipal: item.primaryLocation,
      Recomendacion: item.reviewRecommendation,
      FechaCarga: item.uploadedAt,
      BlobUrl: item.blobUrl,
    }))

    if (parsed.format === "csv") {
      return exportToCSV(rows)
    }

    const summary = {
      TotalArchivos: inventory.stats.totalFiles,
      UsoDirecto: inventory.stats.inUseFiles,
      SinUsoDetectado: inventory.stats.unusedFiles,
      Heuristicos: inventory.stats.heuristicOnlyFiles,
      CandidatosRevision: inventory.stats.reviewCandidates,
      BytesSinUso: inventory.stats.unusedBytes,
      BytesHeuristicos: inventory.stats.heuristicBytes,
    }

    return exportToExcel(summary, rows)
  } catch (error) {
    console.error("File inventory export error:", error)
    return NextResponse.json({ error: "No se pudo exportar el inventario de archivos" }, { status: 500 })
  }
}
