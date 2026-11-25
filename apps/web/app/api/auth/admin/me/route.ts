import { getAdmin } from "@/lib/auth";
import { json } from "@/lib/api";

export async function GET() {
  const admin = await getAdmin();
  if (!admin) return json({ error: "login chahiye" }, 401);
  return json({ email: admin.email });
}
