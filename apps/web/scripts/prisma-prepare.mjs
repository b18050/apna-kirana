import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

function readEnvDatabaseUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  const envPath = path.join(process.cwd(), ".env");
  if (!fs.existsSync(envPath)) return "";
  const lines = fs.readFileSync(envPath, "utf8").split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    if (key === "DATABASE_URL") {
      return trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
    }
  }
  return "";
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
