import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(req: NextRequest) {
  if (req.nextUrl.pathname.startsWith("/api") && req.method === "OPTIONS") {
    return new NextResponse(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Authorization, Content-Type",
        "Access-Control-Allow-Methods": "GET,POST,PATCH,PUT,OPTIONS",
      },
    });
  }
  return NextResponse.next();
}

export const config = { matcher: ["/api/:path*"] };
