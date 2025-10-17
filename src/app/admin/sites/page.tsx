import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import ClientSites from "./table"

async function fetchSites() {
  return await prisma.site.findMany({
    include: { _count: { select: { collaborators: true } } },
    orderBy: { name: "asc" }
  })
}

export default async function SitesPage() {
  const session = await auth()
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUPERADMIN")) {
    return null
  }
  const items = await fetchSites()
  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">Sedes</h1>
      <ClientSites initial={items} />
    </div>
  )
}