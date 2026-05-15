import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function parseApiCorsAllowedOrigins(): string[] {
  const raw = process.env.API_CORS_ALLOWED_ORIGINS?.trim();
  if (!raw) return [];
  return raw.split(",").map((s) => s.trim()).filter(Boolean);
}

export function middleware(request: NextRequest) {
  const allowed = parseApiCorsAllowedOrigins();
  if (!allowed.length) {
    return NextResponse.next();
  }

  const origin = request.headers.get("origin");

  if (request.method === "OPTIONS") {
    if (origin && allowed.includes(origin)) {
      return new NextResponse(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": origin,
          "Access-Control-Allow-Credentials": "true",
          "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
          "Access-Control-Allow-Headers":
            "Content-Type, Cookie, Authorization, X-Latch-Chrome-Extension-Id, X-Chrome-Extension-Id",
          "Access-Control-Max-Age": "86400",
          Vary: "Origin",
        },
      });
    }
    return new NextResponse(null, { status: 204 });
  }

  const res = NextResponse.next();
  if (origin && allowed.includes(origin)) {
    res.headers.set("Access-Control-Allow-Origin", origin);
    res.headers.set("Access-Control-Allow-Credentials", "true");
    res.headers.append("Vary", "Origin");
  }
  return res;
}

export const config = {
  matcher: "/api/:path*",
};
