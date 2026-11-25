import { json } from "@/lib/api";
import { getCustomerFromAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(req: Request) {
  const customer = await getCustomerFromAuth(req.headers.get("authorization"));
  if (!customer) return json({ error: "login chahiye" }, 401);
  const { token, platform } = (await req.json()) as { token?: string; platform?: string };
  if (!token) return json({ error: "token chahiye" }, 400);
  const saved = await prisma.pushToken.upsert({
    where: { customerId_token: { customerId: customer.id, token } },
    update: { platform: platform ?? "unknown" },
    create: {
      customerId: customer.id,
      token,
      platform: platform ?? "unknown",
    },
  });
  return json({ ok: true, id: saved.id });
}
