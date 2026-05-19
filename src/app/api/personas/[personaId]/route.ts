import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializePersona } from "@/lib/api/serializers";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ personaId: string }> }
) {
  const { personaId } = await params;
  const persona = await prisma.persona.findUnique({
    where: { id: personaId },
  });

  if (!persona) {
    return NextResponse.json({ error: "Persona not found" }, { status: 404 });
  }

  return NextResponse.json(serializePersona(persona));
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ personaId: string }> }
) {
  const { personaId } = await params;
  const body = await request.json();

  const persona = await prisma.persona.update({
    where: { id: personaId },
    data: body,
  });

  return NextResponse.json(serializePersona(persona));
}
