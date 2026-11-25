import { json } from "@/lib/api";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const q = searchParams.get("q")?.trim();
  const products = await prisma.product.findMany({
    where: {
      isActive: true,
      ...(category ? { category } : {}),
      ...(q
        ? {
            OR: [
              { name: { contains: q } },
              { nameHi: { contains: q } },
            ],
          }
        : {}),
    },
    orderBy: { name: "asc" },
  });
  return json({ products });
}
