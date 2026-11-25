import { json } from "@/lib/api";
import { requireAdmin } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;
  const settings =
    (await prisma.storeSettings.findUnique({ where: { id: "store" } })) ??
    (await prisma.storeSettings.create({ data: { id: "store" } }));
  return json({ settings });
}

export async function PATCH(req: Request) {
  const { error } = await requireAdmin();
  if (error) return error;
  const body = await req.json();
  const settings = await prisma.storeSettings.update({
    where: { id: "store" },
    data: {
      storeName: body.storeName,
      storeNameHi: body.storeNameHi,
      area: body.area,
      pin: body.pin,
      minOrderPaise: body.minOrderRupees != null ? Math.round(Number(body.minOrderRupees) * 100) : undefined,
      hours: body.hours,
      slotsJson: body.slots ? JSON.stringify(body.slots) : undefined,
      contactPhone: body.contactPhone,
      contactEmail: body.contactEmail,
    },
  });
  return json({ settings });
}
