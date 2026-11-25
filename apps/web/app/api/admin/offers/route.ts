import { json } from "@/lib/api";
import { requireAdmin } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;
  const offers = await prisma.offer.findMany({ orderBy: { createdAt: "desc" } });
  return json({ offers, comingSoon: true });
}

export async function PATCH(req: Request) {
  const { error } = await requireAdmin();
  if (error) return error;
  const body = (await req.json()) as {
    id?: string;
    isActive?: boolean;
    title?: string;
    titleHi?: string;
    body?: string;
    bodyHi?: string;
  };
  if (!body.id) return json({ error: "Offer id chahiye" }, 400);
  const offer = await prisma.offer.update({
    where: { id: body.id },
    data: {
      ...(body.isActive != null ? { isActive: Boolean(body.isActive) } : {}),
      ...(body.title != null ? { title: body.title } : {}),
      ...(body.titleHi != null ? { titleHi: body.titleHi } : {}),
      ...(body.body != null ? { body: body.body } : {}),
      ...(body.bodyHi != null ? { bodyHi: body.bodyHi } : {}),
    },
  });
  return json({ offer });
}
