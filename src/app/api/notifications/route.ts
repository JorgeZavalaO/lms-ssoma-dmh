import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { z } from "zod"

const PaginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(20),
  isRead: z.enum(["true", "false"]).optional(),
  isArchived: z.enum(["true", "false"]).optional(),
})

// GET /api/notifications - Listar notificaciones del usuario
export async function GET(req: Request) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const url = new URL(req.url)
  const { page, pageSize, isRead, isArchived } = PaginationSchema.parse({
    page: url.searchParams.get("page") || "1",
    pageSize: url.searchParams.get("pageSize") || "20",
    isRead: url.searchParams.get("isRead") || undefined,
    isArchived: url.searchParams.get("isArchived") || undefined,
  })

  const where = {
    userId: session.user.id,
    ...(isRead !== undefined && { isRead: isRead === "true" }),
    ...(isArchived !== undefined && { isArchived: isArchived === "true" }),
  }

  const [items, total] = await Promise.all([
    prisma.notification.findMany({
      where,
      include: {
        template: true,
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: "desc" },
    }),
    prisma.notification.count({ where }),
  ])

  return NextResponse.json({ items, total, page, pageSize })
}
