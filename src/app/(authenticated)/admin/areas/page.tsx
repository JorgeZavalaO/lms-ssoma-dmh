import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import ClientAreas from "./table"

async function fetchAreas() {
  return await prisma.area.findMany({
    include: { positions: true, _count: { select: { collaborators: true } } },
    orderBy: { name: "asc" }
  })
}

export default async function AreasPage() {
  const session = await auth()
  if (!session) return null
  const items = await fetchAreas()
  return (
    <div className="p-6 space-y-2">
      <div>
        <h1 className="text-2xl font-bold">Áreas</h1>
        <p className="text-sm text-muted-foreground">Administra áreas, sus jefaturas y puestos asociados.</p>
      </div>
      <ClientAreas initial={items} />
    </div>
  )
}
