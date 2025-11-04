import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import ClientCollaborators from "./table"
import { Users } from "lucide-react"

async function fetchPage(page = 1, pageSize = 10, q = "") {
  const where = q
    ? {
        OR: [
          { dni: { contains: q, mode: "insensitive" as const } },
          { fullName: { contains: q, mode: "insensitive" as const } },
          { email: { contains: q, mode: "insensitive" as const } },
        ],
      }
    : {}

  const [items, total] = await Promise.all([
    prisma.collaborator.findMany({
      where,
      include: { site: true, area: true, position: true, user: true },
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { fullName: "asc" },
    }),
    prisma.collaborator.count({ where }),
  ])

  // Serializar fechas para evitar problemas con React
  const serializedItems = items.map(item => ({
    ...item,
    entryDate: item.entryDate.toISOString(),
    user: item.user ? {
      ...item.user,
      emailVerified: item.user.emailVerified?.toISOString() ?? null,
    } : null,
  }))

  return { items: serializedItems, total, page, pageSize }
}

export default async function CollaboratorsPage() {
  const session = await auth()
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUPERADMIN")) {
    // El middleware ya protege, esto es por si navegan directo
    return null
  }
  const { items, total, page, pageSize } = await fetchPage(1, 10, "")
  const initial = { items, total, page, pageSize }

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-8 space-y-2">
        <div className="flex items-center gap-2">
          <Users className="h-6 w-6 text-emerald-600" />
          <h1 className="text-3xl font-bold text-slate-900">Colaboradores</h1>
        </div>
        <p className="text-sm text-slate-600 ml-8">
          Gestiona el equipo de trabajo, roles y permisos de acceso
        </p>
      </div>

      {/* Client table */}
      <ClientCollaborators initial={initial} />
    </div>
  )
}
