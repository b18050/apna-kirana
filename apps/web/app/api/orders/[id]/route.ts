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
    include: { items: true, address: true },
  });
  if (!order) return json({ error: "Order nahi mila" }, 404);
  return json({ order });
}
