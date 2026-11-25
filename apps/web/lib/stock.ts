import type { PrismaClient } from "@prisma/client";

const APPLIES = new Set(["accepted", "packed", "out_for_delivery", "delivered"]);

export async function syncStockForStatus(
  prisma: PrismaClient,
  orderId: string,
  nextStatus: string,
) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });
  if (!order) return;

  const shouldHold = APPLIES.has(nextStatus);
  if (shouldHold && !order.stockApplied) {
    for (const item of order.items) {
      await prisma.product.update({
        where: { id: item.productId },
        data: { stockQty: { decrement: item.qty } },
      });
    }
    await prisma.order.update({
      where: { id: orderId },
      data: { stockApplied: true },
    });
  }

  if (nextStatus === "cancelled" && order.stockApplied) {
    for (const item of order.items) {
      await prisma.product.update({
        where: { id: item.productId },
        data: { stockQty: { increment: item.qty } },
      });
    }
    await prisma.order.update({
      where: { id: orderId },
      data: { stockApplied: false },
    });
  }
}
