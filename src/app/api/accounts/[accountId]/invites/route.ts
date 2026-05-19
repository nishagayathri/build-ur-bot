import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { randomBytes } from "crypto";

/** GET /api/accounts/:accountId/invites — List pending invites */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ accountId: string }> }
) {
  try {
    const userId = await requireAuth();
    const { accountId } = await params;

    const membership = await prisma.accountMember.findUnique({
      where: { userId_accountId: { userId, accountId } },
    });
    if (!membership || !["OWNER", "ADMIN"].includes(membership.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const invites = await prisma.accountInvite.findMany({
      where: { accountId, acceptedAt: null },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(
      invites.map((inv) => ({
        id: inv.id,
        email: inv.email,
        role: inv.role,
        expires_at: inv.expiresAt.toISOString(),
        accepted_at: inv.acceptedAt?.toISOString() ?? null,
      }))
    );
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

/** POST /api/accounts/:accountId/invites — Send invites */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ accountId: string }> }
) {
  try {
    const userId = await requireAuth();
    const { accountId } = await params;

    const membership = await prisma.accountMember.findUnique({
      where: { userId_accountId: { userId, accountId } },
    });
    if (!membership || !["OWNER", "ADMIN"].includes(membership.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { invites } = await request.json();

    if (!Array.isArray(invites) || invites.length === 0) {
      return NextResponse.json(
        { error: "Invites array is required" },
        { status: 400 }
      );
    }

    const created = await prisma.$transaction(
      invites.map((inv: { email: string; role: string }) =>
        prisma.accountInvite.create({
          data: {
            email: inv.email.toLowerCase(),
            accountId,
            role: (inv.role as "ADMIN" | "EDITOR" | "VIEWER") || "VIEWER",
            token: randomBytes(32).toString("hex"),
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
          },
        })
      )
    );

    return NextResponse.json(
      created.map((inv) => ({
        id: inv.id,
        email: inv.email,
        role: inv.role,
        expires_at: inv.expiresAt.toISOString(),
      })),
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { error: "Failed to create invites" },
      { status: 500 }
    );
  }
}
