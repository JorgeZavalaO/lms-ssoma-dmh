import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import ClientCollaborators from "./table"

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
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">Colaboradores</h1>
      {/* Client table */}
      <ClientCollaborators initial={initial} />
    </div>
  )
}
