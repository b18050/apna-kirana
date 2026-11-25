import { json } from "@/lib/api";
import { getCustomerFromAuth } from "@/lib/auth";

export async function GET(req: Request) {
  const customer = await getCustomerFromAuth(req.headers.get("authorization"));
  if (!customer) return json({ error: "login chahiye" }, 401);
  return json({ customer });
}

export async function PUT(req: Request) {
  const customer = await getCustomerFromAuth(req.headers.get("authorization"));
  if (!customer) return json({ error: "login chahiye" }, 401);
  const { name } = (await req.json()) as { name?: string };
  const updated = await (await import("@/lib/prisma")).prisma.customer.update({
    where: { id: customer.id },
    data: { name: (name ?? customer.name).trim() || customer.name },
  });
  return json({ customer: updated });
}
