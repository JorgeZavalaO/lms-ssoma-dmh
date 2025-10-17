import { prisma } from "@/lib/prisma"
import ClientPositions from "./table"

async function fetchPositions() {
  return await prisma.position.findMany({
    include: { area: true },
    orderBy: { name: "asc" }
  })
}

export default async function PositionsPage() {
  const items = await fetchPositions()
  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">Puestos</h1>
      <ClientPositions initial={items} />
    </div>
  )
}
