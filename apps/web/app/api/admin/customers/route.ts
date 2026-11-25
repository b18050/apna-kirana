import { json } from "@/lib/api";
import { requireAdmin } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;
  const customers = await prisma.customer.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      orders: { orderBy: { createdAt: "desc" }, take: 1 },
      _count: { select: { orders: true } },
    },
  });
  return json({ customers });
}
