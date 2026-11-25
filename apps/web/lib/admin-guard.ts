import { getAdmin } from "./auth";
import { json } from "./api";

export async function requireAdmin() {
  const admin = await getAdmin();
  if (!admin) return { error: json({ error: "login chahiye" }, 401), admin: null };
  return { error: null, admin };
}
