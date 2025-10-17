import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { put } from "@vercel/blob"

// GET - Listar archivos
export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const tags = searchParams.get("tags")?.split(",") || []
    const fileType = searchParams.get("fileType") as "PDF" | "PPT" | "IMAGE" | "VIDEO" | "DOCUMENT" | "OTHER" | null

    const where: { fileType?: "PDF" | "PPT" | "IMAGE" | "VIDEO" | "DOCUMENT" | "OTHER"; tags?: { hasSome: string[] } } = {}
    if (fileType) where.fileType = fileType
    if (tags.length > 0) where.tags = { hasSome: tags }

    const files = await prisma.fileRepository.findMany({
      where,
      orderBy: { uploadedAt: "desc" },
    })

    return NextResponse.json(files)
  } catch (error) {
    console.error("Error fetching files:", error)
    return NextResponse.json(
      { error: "Error al obtener archivos" },
      { status: 500 }
    )
  }
}

// POST - Subir archivo
export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "SUPERADMIN")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    const formData = await req.formData()
    const file = formData.get("file") as File
    const name = formData.get("name") as string
    const description = formData.get("description") as string | null
    const fileType = formData.get("fileType") as string
    const tags = JSON.parse(formData.get("tags") as string || "[]")
    const previousVersionId = formData.get("previousVersionId") as string | null

    if (!file) {
      return NextResponse.json({ error: "No se proporcionó archivo" }, { status: 400 })
    }

    // Límite de 10MB
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "El archivo excede el límite de 10MB" }, { status: 400 })
    }

    // Subir a Vercel Blob
    const blob = await put(file.name, file, {
      access: "public",
    })

    // Determinar versión
    let version = 1
    if (previousVersionId) {
      const previousVersion = await prisma.fileRepository.findUnique({
        where: { id: previousVersionId },
        select: { version: true },
      })
      if (previousVersion) {
        version = previousVersion.version + 1
      }
    }

    // Guardar en base de datos
    const fileRecord = await prisma.fileRepository.create({
      data: {
        name: name || file.name,
        description,
        fileType: fileType as "PDF" | "PPT" | "IMAGE" | "VIDEO" | "DOCUMENT" | "OTHER",
        blobUrl: blob.url,
        size: file.size,
        mimeType: file.type,
        tags,
        version,
        previousVersionId,
        uploadedBy: session.user.id,
      },
    })

    return NextResponse.json(fileRecord, { status: 201 })
  } catch (error) {
    console.error("Error uploading file:", error)
    return NextResponse.json(
      { error: "Error al subir archivo" },
      { status: 500 }
    )
  }
}
