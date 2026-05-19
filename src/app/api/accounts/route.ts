import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

/** GET /api/accounts — List accounts the current user belongs to */
export async function GET() {
  try {
    const userId = await requireAuth();

    // Auto-accept any pending invites for this user's email
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
    if (user?.email) {
      const pendingInvites = await prisma.accountInvite.findMany({
        where: { email: user.email.toLowerCase(), acceptedAt: null, expiresAt: { gt: new Date() } },
      });

      for (const invite of pendingInvites) {
        const existing = await prisma.accountMember.findUnique({
          where: { userId_accountId: { userId, accountId: invite.accountId } },
        });
        if (!existing) {
          await prisma.$transaction([
            prisma.accountMember.create({
              data: { userId, accountId: invite.accountId, role: invite.role, acceptedAt: new Date() },
            }),
            prisma.accountInvite.update({
              where: { id: invite.id },
              data: { acceptedAt: new Date() },
            }),
          ]);
        }
      }
    }

    const memberships = await prisma.accountMember.findMany({
      where: { userId },
      include: {
        account: {
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
            color: true,
            onboardingStep: true,
            onboardingComplete: true,
          },
        },
      },
      orderBy: { invitedAt: "asc" },
    });

    const accounts = memberships.map((m) => ({
      id: m.account.id,
      name: m.account.name,
      slug: m.account.slug,
      description: m.account.description,
      color: m.account.color,
      onboardingStep: m.account.onboardingStep,
      onboardingComplete: m.account.onboardingComplete,
      role: m.role,
    }));

    return NextResponse.json(accounts);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

/** POST /api/accounts — Create a new account */
export async function POST(request: Request) {
  try {
    const userId = await requireAuth();
    const { name, slug, description, color } = await request.json();

    if (!name || !slug) {
      return NextResponse.json(
        { error: "Name and slug are required" },
        { status: 400 }
      );
    }

    // Check slug uniqueness
    const existing = await prisma.account.findUnique({ where: { slug } });
    if (existing) {
      return NextResponse.json(
        { error: "This slug is already taken" },
        { status: 409 }
      );
    }

    // Create account and set the user as OWNER in a transaction
    const account = await prisma.$transaction(async (tx) => {
      const acc = await tx.account.create({
        data: {
          name,
          slug: slug.toLowerCase().replace(/[^a-z0-9-]/g, "-"),
          description: description || null,
          color: color || null,
        },
      });

      await tx.accountMember.create({
        data: {
          userId,
          accountId: acc.id,
          role: "OWNER",
          acceptedAt: new Date(),
        },
      });

      return acc;
    });

    return NextResponse.json(
      {
        id: account.id,
        name: account.name,
        slug: account.slug,
        description: account.description,
        color: account.color,
        onboardingStep: account.onboardingStep,
        onboardingComplete: account.onboardingComplete,
        role: "OWNER",
      },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { error: "Failed to create account" },
      { status: 500 }
    );
  }
}
