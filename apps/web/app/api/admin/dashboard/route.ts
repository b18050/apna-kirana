import { json } from "@/lib/api";
import { requireAdmin } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";
import { todayIstRange } from "@/lib/inr";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;
  const { start, end } = todayIstRange();
  const [todayOrders, lowStock, pendingOtps, openCount] = await Promise.all([
    prisma.order.findMany({
      where: { createdAt: { gte: start, lte: end } },
      orderBy: { createdAt: "desc" },
      include: { customer: true, items: true },
    }),
    prisma.product.findMany({
      where: { isActive: true, stockQty: { lte: 5 } },
      orderBy: { stockQty: "asc" },
    }),
    prisma.otpChallenge.count({
      where: { consumed: false, expiresAt: { gt: new Date() } },
    }),
    prisma.order.count({
      where: { status: { in: ["placed", "accepted", "packed", "out_for_delivery"] } },
    }),
  ]);
  const todayTotal = todayOrders
    .filter((o) => o.status !== "cancelled")
    .reduce((s, o) => s + o.totalPaise, 0);
  return json({ todayOrders, todayTotal, lowStock, pendingOtps, openCount });
}
