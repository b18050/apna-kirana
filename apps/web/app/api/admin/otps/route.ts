import { json } from "@/lib/api";
import { requireAdmin } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;
  const otps = await prisma.otpChallenge.findMany({
    where: { consumed: false, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
  });
  return json({ otps });
}
