import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

/** GET /api/accounts/:accountId/connections — List social connections */
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
    if (!membership) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const connections = await prisma.socialConnection.findMany({
      where: { accountId },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(
      connections.map((c) => ({
        id: c.id,
        platform: c.platform,
        handle: c.handle,
        display_name: c.displayName,
        connected: c.connected,
        connected_at: c.connectedAt?.toISOString() ?? null,
      }))
    );
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

/** POST /api/accounts/:accountId/connections — Add a social connection */
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

    const { platform, handle, displayName } = await request.json();

    if (!platform || !handle) {
      return NextResponse.json(
        { error: "Platform and handle are required" },
        { status: 400 }
      );
    }

    // Placeholder: In production, this would initiate an OAuth flow
    // For now, we create the connection as "connected" with the handle
    const connection = await prisma.socialConnection.create({
      data: {
        accountId,
        platform,
        handle,
        displayName: displayName || handle,
        connected: true,
        connectedAt: new Date(),
      },
    });

    return NextResponse.json(
      {
        id: connection.id,
        platform: connection.platform,
        handle: connection.handle,
        display_name: connection.displayName,
        connected: connection.connected,
        connected_at: connection.connectedAt?.toISOString() ?? null,
      },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { error: "Failed to create connection" },
      { status: 500 }
    );
  }
}

/** DELETE /api/accounts/:accountId/connections — Remove a connection by id (query param) */
export async function DELETE(
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

    const { searchParams } = new URL(request.url);
    const connectionId = searchParams.get("id");
    if (!connectionId) {
      return NextResponse.json({ error: "Connection id required" }, { status: 400 });
    }

    await prisma.socialConnection.delete({
      where: { id: connectionId, accountId },
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
