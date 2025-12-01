import { NextResponse } from "next/server"
import * as XLSX from "xlsx"
import { prisma } from "@/lib/prisma"
import { CollaboratorSchema } from "@/validations/collaborators"
import { auth } from "@/auth"
import bcrypt from "bcryptjs"

export const maxDuration = 60 

export async function POST(req: Request) {
  const session = await auth()
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUPERADMIN")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const form = await req.formData()
  const file = form.get("file") as File | null
  if (!file) return NextResponse.json({ error: "file requerido" }, { status: 400 })

  const buf = Buffer.from(await file.arrayBuffer())
  const wb = XLSX.read(buf, { type: "buffer" })
  const ws = wb.Sheets[wb.SheetNames[0]]
  const rows: Array<Record<string, unknown>> = XLSX.utils.sheet_to_json(ws, { defval: "" })

  let created = 0, skipped = 0, updated = 0
  const errors: Array<{ row: number; message: string }> = []

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i]
    // Espera columnas: DNI, Nombres, Email, Password, Area, Puesto, Sede, Estado, FechaIngreso(YYYY-MM-DD)
    const email = String(r.Email ?? "").trim()
    const password = String(r.Password ?? r.Contraseña ?? "").trim()
    
    const parsed = CollaboratorSchema.safeParse({
      dni: String(r.DNI).trim(),
      fullName: String(r.Nombres ?? r.Nombre ?? "").trim(),
      email: email.length > 0 ? email : "",
      areaCode: r.Area ? String(r.Area).trim() : null,
      positionName: r.Puesto ? String(r.Puesto).trim() : null,
      siteCode: r.Sede ? String(r.Sede).trim() : null,
      status: String(r.Estado ?? "ACTIVE").toUpperCase() === "INACTIVO" ? "INACTIVE" : "ACTIVE",
      entryDate: r.FechaIngreso ?? r.Fecha_de_Ingreso ?? r["Fecha Ingreso"],
      password: password.length > 0 ? password : "",
      createUser: email.length > 0 && password.length >= 6,
    })

    if (!parsed.success) {
      errors.push({ row: i + 2, message: parsed.error.issues.map(e => e.message).join(", ") })
      skipped++
      continue
    }
    const data = parsed.data

    try {
      const site = data.siteCode ? await prisma.site.upsert({
        where: { code: data.siteCode },
        update: {},
        create: { code: data.siteCode, name: data.siteCode },
      }) : null

      const area = data.areaCode ? await prisma.area.upsert({
        where: { code: data.areaCode },
        update: {},
        create: { code: data.areaCode, name: data.areaCode },
      }) : null

      const position = data.positionName && area ? await prisma.position.upsert({
        where: { name_areaId: { name: data.positionName, areaId: area.id } },
        update: {},
        create: { name: data.positionName, areaId: area.id },
      }) : null

      const existing = await prisma.collaborator.findFirst({
        where: { OR: [{ dni: data.dni }, { email: data.email }] },
      })

      if (!existing) {
        // Crear colaborador con o sin usuario
        const collaboratorData: any = {
          dni: data.dni,
          fullName: data.fullName,
          email: data.email && data.email.length > 0 ? data.email : `${data.dni}@noemail.local`,
          status: data.status,
          entryDate: data.entryDate,
          siteId: site?.id,
          areaId: area?.id,
          positionId: position?.id,
          history: {
            create: {
              siteId: site?.id,
              areaId: area?.id,
              positionId: position?.id,
            },
          },
        }
        
        // Si hay email y password válidos, crear usuario
        if (data.email && data.email.length > 0 && data.password && data.password.length >= 6) {
          const hashedPassword = await bcrypt.hash(data.password, 10)
          
          collaboratorData.user = {
            create: {
              email: data.email,
              name: data.fullName,
              hashedPassword,
              role: data.role || "COLLABORATOR",
            },
          }
        }
        
        await prisma.collaborator.create({ data: collaboratorData })
        created++
      } else {
        await prisma.$transaction([
          prisma.collaborator.update({
            where: { id: existing.id },
            data: {
              fullName: data.fullName,
              email: data.email,
              status: data.status,
              entryDate: data.entryDate,
              siteId: site?.id,
              areaId: area?.id,
              positionId: position?.id,
            },
          }),
          prisma.collaboratorAssignmentHistory.updateMany({
            where: { collaboratorId: existing.id, endDate: null },
            data: { endDate: new Date() },
          }),
          prisma.collaboratorAssignmentHistory.create({
            data: {
              collaboratorId: existing.id,
              siteId: site?.id,
              areaId: area?.id,
              positionId: position?.id,
              startDate: new Date(),
            },
          }),
        ])
        updated++
      }
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Error desconocido"
      errors.push({ row: i + 2, message })
      skipped++
    }
  }

  return NextResponse.json({ created, updated, skipped, errors })
}
