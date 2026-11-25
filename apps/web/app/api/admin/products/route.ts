import { json } from "@/lib/api";
import { requireAdmin } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;
  const products = await prisma.product.findMany({ orderBy: { name: "asc" } });
  return json({ products });
}

export async function POST(req: Request) {
  const { error } = await requireAdmin();
  if (error) return error;
  const body = await req.json();
  const product = await prisma.product.create({
    data: {
      name: body.name,
      nameHi: body.nameHi ?? body.name,
      category: body.category,
      unit: body.unit,
      mrpPaise: Math.round(Number(body.mrpRupees ?? 0) * 100),
      pricePaise: Math.round(Number(body.priceRupees ?? 0) * 100),
      stockQty: Number(body.stockQty ?? 0),
      imageEmoji: body.imageEmoji ?? "🛒",
      isActive: body.isActive !== false,
    },
  });
  return json({ product });
}
