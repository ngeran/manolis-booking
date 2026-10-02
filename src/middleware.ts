import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;

  const publicRoutes = ["/login", "/api/auth"];
  const isPublic = publicRoutes.some((r) => pathname.startsWith(r));

  if (isPublic) return NextResponse.next();

  if (!isLoggedIn) {
    // API callers should get JSON, not a redirect to the login page's HTML
    if (pathname.startsWith("/api")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (pathname.startsWith("/settings")) {
    const role = (req.auth?.user as { role?: string })?.role;
    if (role !== "admin") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  // Public assets (PWA manifest, icons, favicon) must bypass auth
  matcher: ["/((?!_next|favicon|manifest.webmanifest|icon-|apple-touch-icon).*)"],
};
