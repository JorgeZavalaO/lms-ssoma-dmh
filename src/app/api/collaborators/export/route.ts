import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import * as XLSX from "xlsx"

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "SUPERADMIN")) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const format = request.nextUrl.searchParams.get("format") || "xlsx"

    // Traer todos los colaboradores
    const collaborators = await prisma.collaborator.findMany({
      include: {
        site: true,
        area: true,
        position: true,
        user: true,
      },
      orderBy: { fullName: "asc" },
    })

    if (format === "csv") {
      return exportToCSV(collaborators)
    } else {
      return exportToExcel(collaborators)
    }
  } catch (error) {
    console.error("Export error:", error)
    return NextResponse.json(
      { error: "Error al exportar colaboradores" },
      { status: 500 }
    )
  }
}

function exportToCSV(collaborators: any[]) {
  // Formato CSV para re-importación (con códigos)
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

  const rows = collaborators.map(c => [
    c.dni,
    c.fullName,
    c.email && !c.email.includes('@noemail.local') ? c.email : "",
    "", // Password vacío por seguridad
    c.area?.code || "",
    c.position?.name || "",
    c.site?.code || "",
    c.status === "ACTIVE" ? "ACTIVO" : "INACTIVO",
    c.entryDate ? new Date(c.entryDate).toISOString().split('T')[0] : "",
  ])

  const csv = [
    headers.join(","),
    ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(",")),
  ].join("\n")

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="colaboradores_${new Date().toISOString().split("T")[0]}.csv"`,
    },
  })
}

function exportToExcel(collaborators: any[]) {
  // Formato para re-importación (con códigos)
  const dataForImport = collaborators.map(c => ({
    DNI: c.dni,
    Nombres: c.fullName,
    Email: c.email && !c.email.includes('@noemail.local') ? c.email : "",
    Password: "", // Vacío por seguridad - debe llenarse manualmente si se requiere
    Area: c.area?.code || "",
    Puesto: c.position?.name || "",
    Sede: c.site?.code || "",
    Estado: c.status === "ACTIVE" ? "ACTIVO" : "INACTIVO",
    FechaIngreso: c.entryDate ? new Date(c.entryDate).toISOString().split('T')[0] : "",
  }))
  
  // Formato detallado (con nombres legibles)
  const dataDetailed = collaborators.map(c => ({
    DNI: c.dni,
    "Nombre Completo": c.fullName,
    Email: c.email,
    Estado: c.status === "ACTIVE" ? "Activo" : "Inactivo",
    "Fecha Ingreso": new Date(c.entryDate).toLocaleDateString("es-PE"),
    "Área (Código)": c.area?.code || "",
    "Área (Nombre)": c.area?.name || "",
    "Puesto": c.position?.name || "",
    "Sede (Código)": c.site?.code || "",
    "Sede (Nombre)": c.site?.name || "",
    "Rol Usuario": c.user?.role || "Sin usuario",
  }))

  const workbook = XLSX.utils.book_new()
  
  // Hoja 1: Formato para re-importación directa
  const wsImport = XLSX.utils.json_to_sheet(dataForImport)
  wsImport["!cols"] = [
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
  
  // Hoja 2: Formato detallado con nombres completos
  const wsDetailed = XLSX.utils.json_to_sheet(dataDetailed)
  wsDetailed["!cols"] = [
    { wch: 12 }, // DNI
    { wch: 25 }, // Nombre Completo
    { wch: 30 }, // Email
    { wch: 12 }, // Estado
    { wch: 15 }, // Fecha Ingreso
    { wch: 12 }, // Área (Código)
    { wch: 20 }, // Área (Nombre)
    { wch: 18 }, // Puesto
    { wch: 12 }, // Sede (Código)
    { wch: 20 }, // Sede (Nombre)
    { wch: 15 }, // Rol Usuario
  ]

  XLSX.utils.book_append_sheet(workbook, wsImport, "Para Reimportar")
  XLSX.utils.book_append_sheet(workbook, wsDetailed, "Datos Detallados")
  
  const buffer = XLSX.write(workbook, { bookType: "xlsx", type: "buffer" })
  
  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="colaboradores_${new Date().toISOString().split("T")[0]}.xlsx"`,
    },
  })
}
