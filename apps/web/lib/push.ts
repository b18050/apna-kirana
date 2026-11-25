import { prisma } from "./prisma";
import { STATUS_LABEL } from "./inr";

export async function notifyOrderStatus(customerId: string, status: string, orderId: string) {
  const tokens = await prisma.pushToken.findMany({ where: { customerId } });
  if (tokens.length === 0) return;

  const label = STATUS_LABEL[status] ?? { en: status, hi: status };
  const messages = tokens.map((t) => ({
    to: t.token,
    sound: "default" as const,
    title: `Apna Kirana · ${label.hi}`,
    body: `${label.en}. Order ${orderId.slice(-6).toUpperCase()}`,
    data: { orderId, kind: "order" as const, status },
  }));

  const expoToken = process.env.EXPO_ACCESS_TOKEN;
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (expoToken) headers.Authorization = `Bearer ${expoToken}`;

  try {
    await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers,
      body: JSON.stringify(messages),
    });
  } catch (err) {
    console.warn("push failed", err);
  }
}
