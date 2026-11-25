import { json } from "@/lib/api";
import { requireAdmin } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { error } = await requireAdmin();
  if (error) return error;
  const { id } = await ctx.params;
  const body = await req.json();
  const data: Record<string, unknown> = {};
  if (body.name != null) data.name = body.name;
  if (body.nameHi != null) data.nameHi = body.nameHi;
  if (body.category != null) data.category = body.category;
  if (body.unit != null) data.unit = body.unit;
  if (body.mrpRupees != null) data.mrpPaise = Math.round(Number(body.mrpRupees) * 100);
  if (body.priceRupees != null) data.pricePaise = Math.round(Number(body.priceRupees) * 100);
  if (body.stockQty != null) data.stockQty = Number(body.stockQty);
  if (body.imageEmoji != null) data.imageEmoji = body.imageEmoji;
  if (body.isActive != null) data.isActive = Boolean(body.isActive);
  const product = await prisma.product.update({ where: { id }, data });
  return json({ product });
}
