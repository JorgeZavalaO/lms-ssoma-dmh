import { HardDrive, Link2 } from "lucide-react"
import { auth } from "@/auth"
import ClientFiles from "./table"
import { listFileInventory } from "@/lib/file-inventory"

export default async function FilesPage() {
  const session = await auth()
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUPERADMIN")) {
    return null
  }

  const initial = await listFileInventory({ page: 1, pageSize: 10 })

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 space-y-3">
        <div className="flex items-center gap-3">
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-2.5">
            <HardDrive className="h-6 w-6 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Repositorio de Archivos</h1>
            <p className="text-sm text-slate-600">
              Inventario centralizado de archivos en blob con trazabilidad por curso, lección y contenido embebido.
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 text-sm text-slate-600">
          <div className="flex items-start gap-3">
            <Link2 className="mt-0.5 h-4 w-4 text-emerald-600" />
            <div>
              V3 agrega un flujo seguro de ciclo de vida: primero deshabilita para sacarlo de circulación y solo permite
              eliminar el blob cuando no se detectan referencias directas ni heurísticas.
            </div>
          </div>
        </div>
      </div>

      <ClientFiles initial={{
        ...initial,
        filters: {
          fileType: "ALL",
          usageState: "ALL",
          lifecycleStatus: "ALL",
          tag: "ALL",
          q: "",
        },
      }} />
    </div>
  )
}
