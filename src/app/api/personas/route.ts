import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializePersona } from "@/lib/api/serializers";

export async function GET(request: NextRequest) {
  const accountId = request.nextUrl.searchParams.get("accountId");
  if (!accountId) {
    return NextResponse.json({ error: "accountId is required" }, { status: 400 });
  }
  try {
    const personas = await prisma.persona.findMany({ where: { accountId } });
    return NextResponse.json(personas.map(serializePersona));
  } catch (err) {
    console.error("[GET /api/personas]", err);
    return NextResponse.json({ error: "Failed to fetch personas" }, { status: 500 });
  }
}
