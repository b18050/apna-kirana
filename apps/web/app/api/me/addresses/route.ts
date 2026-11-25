import { json } from "@/lib/api";
import { getCustomerFromAuth } from "@/lib/auth";
import { isValidPin } from "@/lib/inr";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const customer = await getCustomerFromAuth(req.headers.get("authorization"));
  if (!customer) return json({ error: "login chahiye" }, 401);
  const addresses = await prisma.address.findMany({
    where: { customerId: customer.id },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
  });
  return json({ addresses });
}

export async function POST(req: Request) {
  const customer = await getCustomerFromAuth(req.headers.get("authorization"));
  if (!customer) return json({ error: "login chahiye" }, 401);
  const body = (await req.json()) as {
    line1?: string;
    landmark?: string;
    area?: string;
    pin?: string;
  };
  if (!body.line1?.trim() || !body.area?.trim() || !isValidPin(body.pin ?? "")) {
    return json({ error: "Ghar, area aur 6 digit PIN zaroori hai" }, 400);
  }
  await prisma.address.updateMany({
    where: { customerId: customer.id },
    data: { isDefault: false },
  });
  const address = await prisma.address.create({
    data: {
      customerId: customer.id,
      line1: body.line1.trim(),
      landmark: (body.landmark ?? "").trim(),
      area: body.area.trim(),
      pin: body.pin!,
      isDefault: true,
    },
  });
  return json({ address });
}
