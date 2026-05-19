import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

/**
 * GET /api/auth/social/callback?platform=X&accountId=xxx&handle=xxx&token=xxx
 *
 * Stub OAuth callback. In production the platform would redirect here
 * with a real auth code that we exchange for tokens. For now we accept
 * mock params and create the SocialConnection directly, then redirect
 * the user back to the onboarding page.
 */
export async function GET(request: Request) {
  try {
    const userId = await requireAuth();
    const { searchParams } = new URL(request.url);

    const platform = searchParams.get("platform");
    const accountId = searchParams.get("accountId");
    const handle = searchParams.get("handle");
    const token = searchParams.get("token");

    if (!platform || !accountId || !handle) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    // Verify membership
    const membership = await prisma.accountMember.findUnique({
      where: { userId_accountId: { userId, accountId } },
    });
    if (!membership || !["OWNER", "ADMIN"].includes(membership.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Check if platform is already connected
    const existing = await prisma.socialConnection.findFirst({
      where: { accountId, platform: platform as never },
    });

    if (!existing) {
      await prisma.socialConnection.create({
        data: {
          accountId,
          platform: platform as never,
          handle,
          displayName: `@${handle}`,
          accessToken: token,
          connected: true,
          connectedAt: new Date(),
        },
      });
    }

    // Redirect back to the onboarding page with a success indicator
    const redirectUrl = new URL("/onboarding", request.url);
    redirectUrl.searchParams.set("connected", platform);

    return NextResponse.redirect(redirectUrl.toString());
  } catch {
    // On auth failure, redirect to sign-in
    const signInUrl = new URL("/auth/signin", request.url);
    return NextResponse.redirect(signInUrl.toString());
  }
}
