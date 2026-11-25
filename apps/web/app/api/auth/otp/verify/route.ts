import { json } from "@/lib/api";
import { signToken } from "@/lib/auth";
import { isValidInPhone } from "@/lib/inr";
import { prisma } from "@/lib/prisma";

// Max wrong attempts per phone per 10 minutes before lockout
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 10 * 60 * 1000;

export async function POST(req: Request) {
  const { phone, code, name } = (await req.json()) as {
    phone?: string;
    code?: string;
    name?: string;
  };
  const cleaned = (phone ?? "").replace(/\D/g, "").slice(-10);
  if (!isValidInPhone(cleaned) || !code) {
    return json({ error: "Phone aur OTP dono chahiye" }, 400);
  }

  // Brute-force protection: count recent failed attempts across all unconsumed challenges for this phone
  const recentFailures = await prisma.otpAttempt.count({
    where: {
      phone: cleaned,
      success: false,
      createdAt: { gt: new Date(Date.now() - WINDOW_MS) },
    },
  });
  if (recentFailures >= MAX_ATTEMPTS) {
    return json(
      { error: "Bahut zyada galat koshish. 10 minute baad try karein." },
      429
    );
  }

  const challenge = await prisma.otpChallenge.findFirst({
    where: { phone: cleaned, consumed: false, code: code.trim() },
    orderBy: { createdAt: "desc" },
  });

  if (!challenge || challenge.expiresAt < new Date()) {
    // Log failed attempt
    await prisma.otpAttempt.create({ data: { phone: cleaned, success: false } });
    return json({ error: "OTP galat ya expire ho gaya" }, 400);
  }

  await Promise.all([
    prisma.otpChallenge.update({
      where: { id: challenge.id },
      data: { consumed: true },
    }),
    // Log success so the window resets cleanly
    prisma.otpAttempt.create({ data: { phone: cleaned, success: true } }),
  ]);

  const displayName = (name ?? "").trim() || "Grahak";
  const customer = await prisma.customer.upsert({
    where: { phone: cleaned },
    update: name?.trim() ? { name: displayName } : {},
    create: { phone: cleaned, name: displayName },
  });

  const token = await signToken({ role: "customer", customerId: customer.id });
  return json({ token, customer });
}
