import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { CreateQuestionSchema } from "@/validations/quiz";

// GET /api/questions - Listar todas las preguntas (con filtros opcionales)
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "SUPERADMIN")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");
    const topic = searchParams.get("topic");
    const courseVersionId = searchParams.get("courseVersionId");

    const where: any = {};
    if (type) where.type = type;
    if (topic) where.topic = { contains: topic, mode: "insensitive" };
    if (courseVersionId) where.courseVersionId = courseVersionId;

    const questions = await prisma.question.findMany({
      where,
      include: {
        options: {
          orderBy: { order: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(questions);
  } catch (error) {
    console.error("Error al obtener preguntas:", error);
    return NextResponse.json(
      { error: "Error al obtener preguntas" },
      { status: 500 }
    );
  }
}

// POST /api/questions - Crear nueva pregunta
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "SUPERADMIN")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await req.json();
    const validatedData = CreateQuestionSchema.parse(body);

    const { options, ...questionData } = validatedData;

    const question = await prisma.question.create({
      data: {
        ...questionData,
        createdBy: session.user.id,
        options: {
          create: options,
        },
      },
      include: {
        options: {
          orderBy: { order: "asc" },
        },
      },
    });

    return NextResponse.json(question, { status: 201 });
  } catch (error: any) {
    console.error("Error al crear pregunta:", error);
    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Error al crear pregunta" },
      { status: 500 }
    );
  }
}
