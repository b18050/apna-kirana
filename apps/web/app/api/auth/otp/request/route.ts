import { json } from "@/lib/api";
import { isValidInPhone } from "@/lib/inr";
import { issueOtp } from "@/lib/otp";

export async function POST(req: Request) {
  const { phone } = (await req.json()) as { phone?: string };
  const cleaned = (phone ?? "").replace(/\D/g, "").slice(-10);
  if (!isValidInPhone(cleaned)) {
    return json({ error: "Sahi 10 digit mobile daaliye" }, 400);
  }
  const result = await issueOtp(cleaned);
  if (result.throttled) {
    return json({ error: "Thoda rukiye — 30 second baad dobara OTP mangwayein" }, 429);
  }
  return json({
    ok: true,
    via: result.via,
    hint:
      result.via === "admin_screen"
        ? "OTP dukaan ke laptop par /admin/otps pe dikhega"
        : "SMS bhej diya",
  });
}
