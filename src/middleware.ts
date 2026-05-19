import { updateSession } from "@/lib/supabase/middleware";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  // Protect all routes except auth, static files, and public assets
  matcher: [
    "/((?!auth|_next/static|_next/image|favicon.ico).*)",
  ],
};
