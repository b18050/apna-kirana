import { json } from "@/lib/api";
import { signToken } from "@/lib/auth";
import { isValidInPhone } from "@/lib/inr";
import { prisma } from "@/lib/prisma";

// In-memory brute-force guard: max 5 wrong attempts per phone per 10 min
const attempts = new Map<string, { count: number; resetAt: number }>();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 10 * 60 * 1000; // 10 minutes

function checkBruteForce(phone: string): boolean {
  const now = Date.now();
  const rec = attempts.get(phone);
  if (!rec || rec.resetAt < now) {
    attempts.set(phone, { count: 1, resetAt: now + WINDOW_MS });
    return true; // allowed
  }
  if (rec.count >= MAX_ATTEMPTS) return false; // blocked
  rec.count++;
  return true;
}

function resetAttempts(phone: string) {
  attempts.delete(phone);
}

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

  if (!checkBruteForce(cleaned)) {
    return json(
      { error: "Bahut zyada galat koshishein. 10 minute baad try karein." },
      429
    );
  }

  const challenge = await prisma.otpChallenge.findFirst({
    where: { phone: cleaned, consumed: false, code: code.trim() },
    orderBy: { createdAt: "desc" },
  });
  if (!challenge || challenge.expiresAt < new Date()) {
    return json({ error: "OTP galat ya expire ho gaya" }, 400);
  }

  resetAttempts(cleaned);

  await prisma.otpChallenge.update({
    where: { id: challenge.id },
    data: { consumed: true },
  });

  const displayName = (name ?? "").trim() || "Grahak";
  const customer = await prisma.customer.upsert({
    where: { phone: cleaned },
    update: name?.trim() ? { name: displayName } : {},
    create: { phone: cleaned, name: displayName },
  });

  const token = await signToken({ role: "customer", customerId: customer.id });
  return json({ token, customer });
}
