import { json } from "@/lib/api";
import { cookies } from "next/headers";

export async function POST() {
  (await cookies()).delete("ak_admin");
  return json({ ok: true });
}
