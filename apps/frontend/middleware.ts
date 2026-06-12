import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtDecode } from "jwt-decode";

interface TokenPayload {
  role: string;
  exp: number;
}

const ROLE_ROUTES: Record<string, string[]> = {
  "/audit-logs": ["admin"],
  "/users": ["admin"],
  "/reports": ["admin", "store_manager"],
};

export function middleware(req: NextRequest) {
  const token = req.cookies.get("token")?.value;

  if (!token) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  try {
    const payload = jwtDecode<TokenPayload>(token);
    if (payload.exp * 1000 < Date.now()) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    const restricted = ROLE_ROUTES[req.nextUrl.pathname];
    if (restricted && !restricted.includes(payload.role)) {
      return NextResponse.redirect(new URL("/", req.url));
    }
  } catch {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!login|signup|verify-email|forgot-password|reset-password|_next|api|favicon.ico).*)"],
};
