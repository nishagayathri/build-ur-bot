import { NextResponse } from "next/server";

/**
 * GET /api/auth/social/:platform?accountId=xxx
 *
 * Stub OAuth initiation. In production this would redirect to the
 * platform's real OAuth consent screen. For now it redirects straight
 * to our callback with mock params simulating a successful auth.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ platform: string }> }
) {
  const { platform } = await params;
  const { searchParams } = new URL(request.url);
  const accountId = searchParams.get("accountId");

  if (!accountId) {
    return NextResponse.json(
      { error: "accountId query parameter is required" },
      { status: 400 }
    );
  }

  const validPlatforms = [
    "X",
    "INSTAGRAM",
    "LINKEDIN",
    "TIKTOK",
    "YOUTUBE",
    "THREADS",
    "REDDIT",
    "TELEGRAM",
  ];

  const platformUpper = platform.toUpperCase();
  if (!validPlatforms.includes(platformUpper)) {
    return NextResponse.json(
      { error: "Unsupported platform" },
      { status: 400 }
    );
  }

  // Build callback URL with mock auth data
  const callbackUrl = new URL("/api/auth/social/callback", request.url);
  callbackUrl.searchParams.set("platform", platformUpper);
  callbackUrl.searchParams.set("accountId", accountId);
  callbackUrl.searchParams.set("handle", `${platformUpper.toLowerCase()}_user`);
  callbackUrl.searchParams.set("token", `mock_token_${Date.now()}`);

  return NextResponse.redirect(callbackUrl.toString());
}
