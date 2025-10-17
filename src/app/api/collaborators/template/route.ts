import { NextResponse } from "next/server"
import * as XLSX from "xlsx"

export async function GET(req: Request) {
  const url = new URL(req.url)
  const format = (url.searchParams.get("format") ?? "xlsx").toLowerCase()

  const headers = [
    "DNI","Nombres","Email","Area","Puesto","Sede","Estado","FechaIngreso"
  ]
  const rows = [
    ["12345678","Juan Pérez","juan@example.com","ADM","Asistente","SEDE1","ACTIVO","2024-01-15"],
  ]
  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows])
  XLSX.utils.book_append_sheet(wb, ws, "Template")

  if (format === "csv") {
    const csv = XLSX.utils.sheet_to_csv(ws)
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="colaboradores_template.csv"`,
      },
    })
  }

  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" })
  return new NextResponse(buf, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="colaboradores_template.xlsx"`,
    },
  })
}