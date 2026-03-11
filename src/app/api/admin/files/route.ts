import { NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/auth"
import { listFileInventory } from "@/lib/file-inventory"

const FileInventoryQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(10),
  q: z.string().optional(),
  fileType: z.enum(["ALL", "PDF", "PPT", "IMAGE", "VIDEO", "DOCUMENT", "OTHER"]).optional(),
  usageState: z.enum(["ALL", "IN_USE", "UNUSED", "HEURISTIC_ONLY"]).optional(),
  tag: z.string().optional(),
})

export async function GET(req: Request) {
  const session = await auth()
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUPERADMIN")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    const url = new URL(req.url)
    const query = FileInventoryQuerySchema.parse({
      page: url.searchParams.get("page") || "1",
      pageSize: url.searchParams.get("pageSize") || "10",
      q: url.searchParams.get("q") ?? undefined,
      fileType: url.searchParams.get("fileType") ?? undefined,
      usageState: url.searchParams.get("usageState") ?? undefined,
      tag: url.searchParams.get("tag") ?? undefined,
    })

    const result = await listFileInventory(query)
    return NextResponse.json(result)
  } catch (error) {
    console.error("Error fetching admin file inventory:", error)
    return NextResponse.json({ error: "No se pudo obtener el inventario de archivos" }, { status: 500 })
  }
}
