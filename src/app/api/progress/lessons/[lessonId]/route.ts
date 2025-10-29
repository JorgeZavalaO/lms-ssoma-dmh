import { NextResponse } from "next/server";

// Consolidación: este endpoint ha sido retirado. No hay proxy activo.
// Usa /api/lessons/[lessonId]/progress (GET/PUT).

export async function GET() {
  return NextResponse.json(
    { error: "Endpoint deprecado. Usa /api/lessons/[lessonId]/progress" },
    { status: 410 }
  );
}

export async function PUT() {
  return NextResponse.json(
    { error: "Endpoint deprecado. Usa /api/lessons/[lessonId]/progress" },
    { status: 410 }
  );
}

export async function POST() {
  return NextResponse.json(
    { error: "Endpoint deprecado. Usa /api/lessons/[lessonId]/progress" },
    { status: 410 }
  );
}

export async function PATCH() {
  return NextResponse.json(
    { error: "Endpoint deprecado. Usa /api/lessons/[lessonId]/progress" },
    { status: 410 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { error: "Endpoint deprecado. Usa /api/lessons/[lessonId]/progress" },
    { status: 410 }
  );
}
