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
  const headers = [
    "DNI",
    "Nombre Completo",
    "Email",
    "Estado",
    "Fecha de Entrada",
    "Área",
    "Puesto",
    "Sede",
    "Rol",
  ]

  const rows = collaborators.map(c => [
    c.dni,
    c.fullName,
    c.email,
    c.status,
    new Date(c.entryDate).toLocaleDateString("es-PE"),
    c.area?.name || "",
    c.position?.name || "",
    c.site?.name || "",
    c.user?.role || "N/A",
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
  const data = collaborators.map(c => ({
    DNI: c.dni,
    "Nombre Completo": c.fullName,
    Email: c.email,
    Estado: c.status === "ACTIVE" ? "Activo" : "Inactivo",
    "Fecha de Entrada": new Date(c.entryDate).toLocaleDateString("es-PE"),
    Área: c.area?.name || "",
    Puesto: c.position?.name || "",
    Sede: c.site?.name || "",
    Rol: c.user?.role || "N/A",
  }))

  const workbook = XLSX.utils.book_new()
  const worksheet = XLSX.utils.json_to_sheet(data)
  
  // Ajustar ancho de columnas
  const colWidths = [
    { wch: 12 }, // DNI
    { wch: 25 }, // Nombre Completo
    { wch: 25 }, // Email
    { wch: 12 }, // Estado
    { wch: 15 }, // Fecha de Entrada
    { wch: 15 }, // Área
    { wch: 15 }, // Puesto
    { wch: 15 }, // Sede
    { wch: 12 }, // Rol
  ]
  worksheet["!cols"] = colWidths

  XLSX.utils.book_append_sheet(workbook, worksheet, "Colaboradores")
  
  const buffer = XLSX.write(workbook, { bookType: "xlsx", type: "buffer" })
  
  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="colaboradores_${new Date().toISOString().split("T")[0]}.xlsx"`,
    },
  })
}
