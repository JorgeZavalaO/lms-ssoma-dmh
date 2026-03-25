import { NextResponse } from "next/server"

export async function POST(req: Request) {
  void req
  return NextResponse.json(
    {
      error:
        "El registro público está deshabilitado. Solicita tu cuenta al administrador del LMS.",
    },
    { status: 410 }
  )
}
