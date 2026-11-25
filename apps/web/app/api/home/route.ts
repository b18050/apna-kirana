import { json } from "@/lib/api";
import { getCustomerFromAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const customer = await getCustomerFromAuth(req.headers.get("authorization"));
  const products = await prisma.product.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });
  const settings = await prisma.storeSettings.findUnique({ where: { id: "store" } });
  const offer = await prisma.offer.findFirst({
    where: { isActive: true },
    orderBy: { createdAt: "desc" },
  });

  if (!customer) {
    return json({
      products,
      settings,
      offer,
      lastOrder: null,
      usuals: [],
      openOrders: [],
      addresses: [],
    });
  }

  const lastOrder = await prisma.order.findFirst({
    where: { customerId: customer.id, status: { not: "cancelled" } },
    orderBy: { createdAt: "desc" },
    include: { items: true, address: true },
  });

  const openOrders = await prisma.order.findMany({
    where: {
      customerId: customer.id,
      status: { in: ["placed", "accepted", "packed", "out_for_delivery"] },
    },
    orderBy: { createdAt: "desc" },
    include: { items: true },
  });

  const pastItems = await prisma.orderItem.findMany({
    where: { order: { customerId: customer.id, status: { not: "cancelled" } } },
    select: { productId: true },
  });
  const counts = new Map<string, number>();
  for (const row of pastItems) {
    counts.set(row.productId, (counts.get(row.productId) ?? 0) + 1);
  }
  const usualIds = [...counts.entries()].filter(([, n]) => n > 1).map(([id]) => id);
  const usuals = usualIds.length
    ? await prisma.product.findMany({
        where: { id: { in: usualIds }, isActive: true },
      })
    : [];

  const addresses = await prisma.address.findMany({
    where: { customerId: customer.id },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
  });

  return json({
    products,
    settings,
    offer,
    lastOrder,
    usuals,
    openOrders,
    addresses,
    customer,
  });
}
