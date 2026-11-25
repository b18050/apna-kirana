import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { compare } from "bcryptjs";
import { prisma } from "./prisma";

const secret = () =>
  new TextEncoder().encode(process.env.JWT_SECRET ?? "dev-apna-kirana-secret");

export async function signToken(payload: Record<string, string>, days = 14) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${days}d`)
    .sign(secret());
}

export async function verifyToken<T extends Record<string, string>>(token: string) {
  const { payload } = await jwtVerify(token, secret());
  return payload as T;
}

export async function getAdmin() {
  const jar = await cookies();
  const token = jar.get("ak_admin")?.value;
  if (!token) return null;
  try {
    const p = await verifyToken<{ role: string; email: string }>(token);
    if (p.role !== "admin") return null;
    return p;
  } catch {
    return null;
  }
}

export async function getCustomerFromAuth(header?: string | null) {
  const raw = header?.startsWith("Bearer ") ? header.slice(7) : null;
  if (!raw) return null;
  try {
    const p = await verifyToken<{ role: string; customerId: string }>(raw);
    if (p.role !== "customer" || !p.customerId) return null;
    return prisma.customer.findUnique({ where: { id: p.customerId } });
  } catch {
    return null;
  }
}

export async function checkAdminPassword(email: string, password: string) {
  const expected = process.env.ADMIN_EMAIL ?? "owner@apnakirana.in";
  const pass = process.env.ADMIN_PASSWORD ?? "kirana123";
  if (email.trim().toLowerCase() !== expected.toLowerCase()) return false;
  if (password === pass) return true;
  try {
    return await compare(password, pass);
  } catch {
    return false;
  }
}
