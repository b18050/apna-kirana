import { checkAdminPassword, signToken } from "@/lib/auth";
import { json } from "@/lib/api";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  const body = (await req.json()) as { email?: string; password?: string };
  const email = body.email?.trim() ?? "";
  const password = body.password ?? "";
  if (!(await checkAdminPassword(email, password))) {
    return json({ error: "Galat email ya password" }, 401);
  }
  const token = await signToken({ role: "admin", email });
  const isHttps =
    req.url.startsWith("https://") ||
    req.headers.get("x-forwarded-proto") === "https";
  const jar = await cookies();
  jar.set("ak_admin", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: isHttps,
    path: "/",
    maxAge: 60 * 60 * 24 * 14,
  });
  return json({ ok: true, email });
}
