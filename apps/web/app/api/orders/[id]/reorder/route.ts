import { json } from "@/lib/api";
import { getCustomerFromAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const customer = await getCustomerFromAuth(req.headers.get("authorization"));
  if (!customer) return json({ error: "login chahiye" }, 401);
  const { id } = await ctx.params;
  const order = await prisma.order.findFirst({
    where: { id, customerId: customer.id },
    include: { items: true },
  });
  if (!order) return json({ error: "Order nahi mila" }, 404);

  const products = await prisma.product.findMany({
    where: { id: { in: order.items.map((i) => i.productId) } },
  });
  const byId = new Map(products.map((p) => [p.id, p]));

  const available: { productId: string; qty: number; skipped?: boolean }[] = [];
  const skipped: string[] = [];
  for (const item of order.items) {
    const p = byId.get(item.productId);
    if (!p || !p.isActive || p.stockQty < item.qty) {
      skipped.push(item.nameHi || item.name);
      continue;
    }
    available.push({ productId: p.id, qty: item.qty });
  }
  return json({ available, skipped, slotLabel: order.slotLabel, addressId: order.addressId });
}
