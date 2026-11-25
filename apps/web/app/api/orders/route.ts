import { json } from "@/lib/api";
import { getCustomerFromAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notifyOrderStatus } from "@/lib/push";

export async function GET(req: Request) {
  const customer = await getCustomerFromAuth(req.headers.get("authorization"));
  if (!customer) return json({ error: "login chahiye" }, 401);
  const orders = await prisma.order.findMany({
    where: { customerId: customer.id },
    orderBy: { createdAt: "desc" },
    include: { items: true, address: true },
  });
  return json({ orders });
}

export async function POST(req: Request) {
  const customer = await getCustomerFromAuth(req.headers.get("authorization"));
  if (!customer) return json({ error: "login chahiye" }, 401);
  const body = (await req.json()) as {
    addressId?: string;
    slotLabel?: string;
    items?: { productId: string; qty: number }[];
    notes?: string;
  };
  const slotLabel = body.slotLabel?.trim();
  if (!body.addressId || !slotLabel || !body.items?.length) {
    return json({ error: "Address, slot aur saman chahiye" }, 400);
  }

  const address = await prisma.address.findFirst({
    where: { id: body.addressId, customerId: customer.id },
  });
  if (!address) return json({ error: "Address nahi mila" }, 400);

  // Aggregate duplicate productIds so combined qty cannot bypass stock checks
  const qtyByProduct = new Map<string, number>();
  for (const item of body.items) {
    if (!item.productId || !Number.isFinite(item.qty) || item.qty <= 0) continue;
    qtyByProduct.set(item.productId, (qtyByProduct.get(item.productId) ?? 0) + item.qty);
  }
  if (qtyByProduct.size === 0) return json({ error: "Cart khali hai" }, 400);

  const settings = await prisma.storeSettings.findUnique({ where: { id: "store" } });
  const products = await prisma.product.findMany({
    where: { id: { in: [...qtyByProduct.keys()] }, isActive: true },
  });
  const byId = new Map(products.map((p) => [p.id, p]));

  const lines: {
    productId: string;
    name: string;
    nameHi: string;
    unit: string;
    qty: number;
    pricePaise: number;
  }[] = [];

  for (const [productId, qty] of qtyByProduct.entries()) {
    const p = byId.get(productId);
    if (!p) continue;
    if (p.stockQty < qty) {
      return json({ error: `${p.name} khatam / kam hai` }, 400);
    }
    lines.push({
      productId: p.id,
      name: p.name,
      nameHi: p.nameHi,
      unit: p.unit,
      qty,
      pricePaise: p.pricePaise,
    });
  }
  if (!lines.length) return json({ error: "Cart khali hai" }, 400);

  const totalPaise = lines.reduce((s, l) => s + Math.round(l.pricePaise * l.qty), 0);
  if (settings && totalPaise < settings.minOrderPaise) {
    return json({ error: "Minimum order poora nahi hua" }, 400);
  }

  const order = await prisma.order.create({
    data: {
      customerId: customer.id,
      addressId: address.id,
      slotLabel: slotLabel.slice(0, 80),
      paymentMethod: "cod",
      totalPaise,
      notes: (body.notes ?? "").trim().slice(0, 300),
      items: { create: lines },
    },
    include: { items: true, address: true },
  });

  await notifyOrderStatus(customer.id, "placed", order.id);
  return json({ order });
}
