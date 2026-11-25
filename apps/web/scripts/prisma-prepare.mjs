import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

function readEnvFile(envPath) {
  if (!fs.existsSync(envPath)) return {};
  const result = {};
  const lines = fs.readFileSync(envPath, "utf8").split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const val = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
    result[key] = val;
  }
  return result;
}

function readEnvDatabaseUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  // Check .env.local first (Neon pulls env here), then .env
  const envLocal = readEnvFile(path.join(process.cwd(), ".env.local"));
  if (envLocal.DATABASE_URL) return envLocal.DATABASE_URL;
  const env = readEnvFile(path.join(process.cwd(), ".env"));
  return env.DATABASE_URL ?? "";
}

function injectNeonEnv() {
  // Load .env.local vars into process.env so Prisma and other tools pick them up
  const envLocalPath = path.join(process.cwd(), ".env.local");
  if (!fs.existsSync(envLocalPath)) return;
  // Also check root-level .env.local (neon deploy writes it at repo root)
  const rootEnvLocal = path.join(process.cwd(), "..", ".env.local");
  for (const p of [rootEnvLocal, envLocalPath]) {
    const vars = readEnvFile(p);
    for (const [k, v] of Object.entries(vars)) {
      if (!process.env[k]) process.env[k] = v;
    }
  }
}

const cmd = process.argv[2] ?? "generate";
const dbUrl = readEnvDatabaseUrl();
const isPostgres =
  dbUrl.startsWith("postgres://") || dbUrl.startsWith("postgresql://");
const schema = isPostgres
  ? "prisma/schema.postgres.prisma"
  : "prisma/schema.prisma";

if (cmd === "push") {
  execSync(`prisma db push --schema=${schema}`, { stdio: "inherit" });
} else {
  execSync(`prisma generate --schema=${schema}`, { stdio: "inherit" });
}
