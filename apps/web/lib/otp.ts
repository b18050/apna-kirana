import { prisma } from "./prisma";

export function randomOtp() {
  return String(Math.floor(1000 + Math.random() * 9000));
}

export async function sendOtpSms(phone: string, code: string) {
  const key = process.env.FAST2SMS_API_KEY;
  if (!key) return { sent: false as const, via: "admin_screen" };

  const res = await fetch("https://www.fast2sms.com/dev/bulkV2", {
    method: "POST",
    headers: {
      authorization: key,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      route: "otp",
      variables_values: code,
      numbers: phone,
    }),
  });
  if (!res.ok) return { sent: false as const, via: "admin_screen" };
  return { sent: true as const, via: "fast2sms" };
}

export async function issueOtp(phone: string) {
  const recent = await prisma.otpChallenge.findFirst({
    where: {
      phone,
      consumed: false,
      createdAt: { gt: new Date(Date.now() - 30 * 1000) },
    },
    orderBy: { createdAt: "desc" },
  });
  if (recent) {
    return {
      sent: false as const,
      via: process.env.FAST2SMS_API_KEY ? ("fast2sms" as const) : ("admin_screen" as const),
      throttled: true as const,
    };
  }

  const code = randomOtp();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
  await prisma.otpChallenge.updateMany({
    where: { phone, consumed: false },
    data: { consumed: true },
  });
  await prisma.otpChallenge.create({ data: { phone, code, expiresAt } });
  const sms = await sendOtpSms(phone, code);
  return { ...sms, code: sms.sent ? undefined : code, throttled: false as const };
}
