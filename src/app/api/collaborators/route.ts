import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { CollaboratorSchema } from "@/validations/collaborators"
import { auth } from "@/auth"
import { Prisma } from "@prisma/client"
import { applyAutoEnrollmentRules } from "@/lib/enrollment"
import { generateSimplePassword, hashPassword } from "@/lib/password"

const PaginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(20),
  q: z.string().optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
})

export async function GET(req: Request) {
  const session = await auth()
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUPERADMIN")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  const url = new URL(req.url)
  const { page, pageSize, q, status } = PaginationSchema.parse({
    page: url.searchParams.get("page") || "1",
    pageSize: url.searchParams.get("pageSize") || "20",
    q: url.searchParams.get("q") ?? undefined,
    status: url.searchParams.get("status") || undefined,
  })
  const includeUser = url.searchParams.get("includeUser") === "1"

  const where: Prisma.CollaboratorWhereInput = {
    ...(q
      ? {
          OR: [
            { dni: { contains: q, mode: "insensitive" } },
            { fullName: { contains: q, mode: "insensitive" } },
            { email: { contains: q, mode: "insensitive" } },
          ],
        }
      : {}),
    ...(status && { status }),
  }

  const [items, total] = await Promise.all([
    prisma.collaborator.findMany({
      where,
      include: { site: true, area: true, position: true, ...(includeUser ? { user: true } : {}) },
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { fullName: "asc" },
    }),
    prisma.collaborator.count({ where }),
  ])

  return NextResponse.json({ items, total, page, pageSize })
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUPERADMIN")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  const json = await req.json()
  const data = CollaboratorSchema.parse(json)

  // Validar duplicados
  const dup = await prisma.collaborator.findFirst({
    where: { OR: [{ dni: data.dni }, { email: data.email }] },
    select: { id: true },
  })
  if (dup) return NextResponse.json({ error: "Duplicado DNI/Email" }, { status: 409 })

  // Validar si el email ya existe en usuarios
  const existingUser = await prisma.user.findUnique({
    where: { email: data.email },
    select: { id: true },
  })
  if (existingUser) {
    return NextResponse.json({ error: "El email ya está registrado como usuario" }, { status: 409 })
  }

  const site = data.siteCode
    ? await prisma.site.findUnique({ where: { code: data.siteCode } })
    : null
  const area = data.areaCode
    ? await prisma.area.findUnique({ where: { code: data.areaCode } })
    : null
  const position =
    data.positionName && area
      ? await prisma.position.findFirst({ where: { name: data.positionName, areaId: area.id } })
      : null

  // Generar contraseña si no se proporciona una
  const password = data.password || generateSimplePassword(8)
  const hashedPassword = await hashPassword(password)

  // Crear colaborador y usuario en una transacción
  const created = await prisma.$transaction(async (tx) => {
    // 1. Crear el colaborador
    const collaborator = await tx.collaborator.create({
      data: {
        dni: data.dni,
        fullName: data.fullName,
        email: data.email || `${data.dni}@noemail.local`, // Generar email si no se proporciona
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
            startDate: new Date(),
          },
        },
      },
      include: { site: true, area: true, position: true },
    })

    // 2. Crear usuario asociado si createUser es true y hay email válido
    if (data.createUser !== false && data.email && data.email.length > 0) {
      await tx.user.create({
        data: {
          email: data.email,
          name: data.fullName,
          hashedPassword: hashedPassword,
          role: data.role || "COLLABORATOR",
          collaboratorId: collaborator.id,
        },
      })
    }

    return collaborator
  })

  // E1 - Aplicar reglas de inscripción automática
  await applyAutoEnrollmentRules(created.id)

  // Retornar con la contraseña generada (solo se muestra una vez)
  return NextResponse.json(
    { 
      collaborator: created, 
      generatedPassword: data.password ? undefined : password,
      message: data.password 
        ? "Colaborador creado con contraseña personalizada" 
        : "Colaborador creado. Guarde la contraseña generada, no se mostrará nuevamente."
    }, 
    { status: 201 }
  )
}
