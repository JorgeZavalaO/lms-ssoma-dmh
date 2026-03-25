import { NextResponse } from "next/server"
import * as XLSX from "xlsx"
import { auth } from "@/auth"
import { requireStaff } from "@/lib/authorization"

export async function GET(req: Request) {
  const session = await auth()
  const staffError = requireStaff(session)
  if (staffError) return staffError

  const url = new URL(req.url)
  const format = (url.searchParams.get("format") ?? "xlsx").toLowerCase()

  const headers = [
    "DNI",
    "Nombres",
    "Email",
    "Password",
    "Area",
    "Puesto",
    "Sede",
    "Estado",
    "FechaIngreso",
  ]

  const rows = [
    ["12345678", "Juan Perez Garcia", "juan.perez@empresa.com", "", "ADM", "Analista", "SEDE_LIMA", "ACTIVO", "2024-01-15"],
    ["87654321", "Maria Lopez Sanchez", "maria.lopez@empresa.com", "", "OPS", "Coordinador", "SEDE_CUSCO", "ACTIVO", "2024-02-20"],
    ["11223344", "Carlos Ruiz Diaz", "", "", "FIN", "Asistente", "SEDE_LIMA", "INACTIVO", "2023-05-10"],
  ]

  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows])

  const notesHeaders = ["Campo", "Tipo", "Requerido", "Descripcion", "Ejemplo"]
  const notes = [
    ["DNI", "Texto", "Si", "Documento de identidad (8-15 caracteres)", "12345678"],
    ["Nombres", "Texto", "Si", "Nombre completo (minimo 3 caracteres)", "Juan Perez Garcia"],
    ["Email", "Texto", "Condicional", "Email valido y unico. Obligatorio si se proporciona Password", "juan@empresa.com"],
    ["Password", "Texto", "Condicional", "Contrasena temporal opcional (min 6 caracteres). Requiere Email. Dejar vacio si no necesita cuenta", ""],
    ["Area", "Codigo", "No", "Codigo del area (se creara si no existe)", "ADM, OPS, FIN"],
    ["Puesto", "Texto", "No", "Nombre del puesto (se creara si no existe)", "Analista, Coordinador"],
    ["Sede", "Codigo", "No", "Codigo de la sede (se creara si no existe)", "SEDE_LIMA, SEDE_CUSCO"],
    ["Estado", "Texto", "No", "Estado del colaborador (ACTIVO o INACTIVO)", "ACTIVO"],
    ["FechaIngreso", "Fecha", "Si", "Fecha de ingreso con formato YYYY-MM-DD", "2024-01-15"],
    ["", "", "", "", ""],
    ["NOTA IMPORTANTE", "", "", "Si proporciona Password, debe incluir Email. La contrasena debe generarse de forma segura y cambiarse en el primer acceso.", ""],
    ["NOTA IMPORTANTE", "", "", "Si deja Email y Password vacios, el colaborador se registrara sin cuenta de acceso al sistema.", ""],
  ]
  const wsNotes = XLSX.utils.aoa_to_sheet([notesHeaders, ...notes])

  ws["!cols"] = [
    { wch: 12 },
    { wch: 25 },
    { wch: 30 },
    { wch: 15 },
    { wch: 10 },
    { wch: 15 },
    { wch: 15 },
    { wch: 10 },
    { wch: 15 },
  ]

  wsNotes["!cols"] = [
    { wch: 15 },
    { wch: 12 },
    { wch: 12 },
    { wch: 60 },
    { wch: 30 },
  ]

  XLSX.utils.book_append_sheet(wb, ws, "Template")
  XLSX.utils.book_append_sheet(wb, wsNotes, "Instrucciones")

  if (format === "csv") {
    const csv = XLSX.utils.sheet_to_csv(ws)
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="colaboradores_template.csv"',
      },
    })
  }

  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" })
  return new NextResponse(buf, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition":
        'attachment; filename="colaboradores_template.xlsx"',
    },
  })
}
