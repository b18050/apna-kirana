import { connection } from "next/server";
import { json } from "@/lib/api";
import { prisma } from "@/lib/prisma";

export async function GET() {
  await connection();
  try {
    await prisma.$queryRaw`SELECT 1`;
    return json({ ok: true, db: "connected", locale: "en-IN", tz: "Asia/Kolkata", currency: "INR" });
  } catch {
    return json({ ok: false, db: "error", locale: "en-IN", tz: "Asia/Kolkata", currency: "INR" }, 503);
  }
}
