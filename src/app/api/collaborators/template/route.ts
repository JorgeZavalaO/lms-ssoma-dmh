import { NextResponse } from "next/server"
import * as XLSX from "xlsx"

export async function GET(req: Request) {
  const url = new URL(req.url)
  const format = (url.searchParams.get("format") ?? "xlsx").toLowerCase()

  // Columnas requeridas para importación (usar CÓDIGOS para Area/Puesto/Sede)
  const headers = [
    "DNI","Nombres","Email","Password","Area","Puesto","Sede","Estado","FechaIngreso"
  ]
  
  // Ejemplos con códigos correctos
  const rows = [
    ["12345678","Juan Pérez García","juan.perez@empresa.com","Pass1234","ADM","Analista","SEDE_LIMA","ACTIVO","2024-01-15"],
    ["87654321","María López Sánchez","maria.lopez@empresa.com","Secure2024","OPS","Coordinador","SEDE_CUSCO","ACTIVO","2024-02-20"],
    ["11223344","Carlos Ruiz Díaz","","","FIN","Asistente","SEDE_LIMA","INACTIVO","2023-05-10"],
  ]
  
  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows])
  
  // Agregar notas explicativas en una segunda hoja
  const notesHeaders = ["Campo", "Tipo", "Requerido", "Descripción", "Ejemplo"]
  const notes = [
    ["DNI", "Texto", "Sí", "Documento de identidad (8-15 caracteres)", "12345678"],
    ["Nombres", "Texto", "Sí", "Nombre completo (mínimo 3 caracteres)", "Juan Pérez García"],
    ["Email", "Texto", "Condicional", "Email válido y único. OBLIGATORIO si se proporciona Password", "juan@empresa.com"],
    ["Password", "Texto", "Condicional", "Contraseña para acceso al sistema (mín 6 caracteres). Requiere Email. Dejar vacío si no necesita cuenta", "Pass1234"],
    ["Area", "Código", "No", "Código del área (se creará si no existe)", "ADM, OPS, FIN"],
    ["Puesto", "Texto", "No", "Nombre del puesto (se creará si no existe)", "Analista, Coordinador"],
    ["Sede", "Código", "No", "Código de la sede (se creará si no existe)", "SEDE_LIMA, SEDE_CUSCO"],
    ["Estado", "Texto", "No", "Estado del colaborador (ACTIVO o INACTIVO)", "ACTIVO"],
    ["FechaIngreso", "Fecha", "Sí", "Fecha de ingreso formato YYYY-MM-DD", "2024-01-15"],
    ["", "", "", "", ""],
    ["NOTA IMPORTANTE", "", "", "Si proporciona Password, DEBE incluir Email. Esto creará automáticamente una cuenta de usuario con rol COLLABORATOR", ""],
    ["NOTA IMPORTANTE", "", "", "Si deja Email y Password vacíos, el colaborador se registrará SIN cuenta de acceso al sistema", ""],
  ]
  const wsNotes = XLSX.utils.aoa_to_sheet([notesHeaders, ...notes])
  
  // Ajustar anchos de columnas
  ws["!cols"] = [
    { wch: 12 }, // DNI
    { wch: 25 }, // Nombres
    { wch: 30 }, // Email
    { wch: 15 }, // Password
    { wch: 10 }, // Area
    { wch: 15 }, // Puesto
    { wch: 15 }, // Sede
    { wch: 10 }, // Estado
    { wch: 15 }, // FechaIngreso
  ]
  
  wsNotes["!cols"] = [
    { wch: 15 }, // Campo
    { wch: 12 }, // Tipo
    { wch: 12 }, // Requerido
    { wch: 50 }, // Descripción
    { wch: 30 }, // Ejemplo
  ]
  
  XLSX.utils.book_append_sheet(wb, ws, "Template")
  XLSX.utils.book_append_sheet(wb, wsNotes, "Instrucciones")

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