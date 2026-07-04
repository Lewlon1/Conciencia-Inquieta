import { updateSession } from "@/lib/supabase/middleware";
import { type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

// Scoped to /admin only. The public site is static — running updateSession
// (which calls supabase.auth.getUser and can write Set-Cookie) on public
// routes would make them non-cacheable and add a request-time round-trip.
export const config = {
  matcher: ["/admin/:path*"],
};
