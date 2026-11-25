import { json } from "@/lib/api";
import { requireAdmin } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { error } = await requireAdmin();
  if (error) return error;
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const orders = await prisma.order.findMany({
    where: status ? { status } : {},
    orderBy: { createdAt: "desc" },
    include: { customer: true, items: true, address: true },
    take: 200,
  });
  return json({ orders });
}
