import { json } from "@/lib/api";
import { requireAdmin } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";
import { ORDER_STATUSES } from "@/lib/inr";
import { syncStockForStatus } from "@/lib/stock";
import { notifyOrderStatus } from "@/lib/push";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { error } = await requireAdmin();
  if (error) return error;
  const { id } = await ctx.params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: { customer: true, items: true, address: true },
  });
  if (!order) return json({ error: "nahi mila" }, 404);
  return json({ order });
}

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { error } = await requireAdmin();
  if (error) return error;
  const { id } = await ctx.params;
  const { status } = (await req.json()) as { status?: string };
  if (!status || !ORDER_STATUSES.includes(status as (typeof ORDER_STATUSES)[number])) {
    return json({ error: "galat status" }, 400);
  }
  await syncStockForStatus(prisma, id, status);
  const order = await prisma.order.update({
    where: { id },
    data: { status },
    include: { customer: true, items: true, address: true },
  });
  await notifyOrderStatus(order.customerId, status, order.id);
  return json({ order });
}
