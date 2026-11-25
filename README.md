# Apna Kirana · अपना किराना

A full-stack neighborhood kirana grocery platform built for Indian local stores (`Asia/Kolkata` IST, `₹` INR, bilingual English/Hindi catalog, Cash on Delivery, slot-based delivery, and zero-cost local SQLite + OTP fallback).

## Monorepo Structure

- `apps/web` — Next.js 16 (App Router) customer storefront, dukaanidar admin portal (`/admin`), and REST API + Prisma ORM (SQLite locally, Postgres/Neon ready).
- `apps/mobile` — Expo (React Native, SDK 58) customer mobile app connecting to the `apps/web` API.

## Quick Start

1. **Environment variables**

   ```bash
   cp .env.example apps/web/.env
   ```

   Edit `apps/web/.env` to set `JWT_SECRET`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD`.
   - `FAST2SMS_API_KEY` is optional. When left empty, customer login OTPs appear directly on `/admin/otps`.
   - `EXPO_ACCESS_TOKEN` is optional for Expo push notifications.

2. **Install dependencies, push schema & seed database**

   ```bash
   pnpm install
   pnpm db:push
   pnpm db:seed
   ```

   Seeding populates 21 everyday kirana SKUs across 6 categories (`atta_dal`, `oil_masala`, `dairy`, `veggies`, `snacks`, `personal`), default `StoreSettings`, and a sample `Offer`.

3. **Run the Web Storefront & Admin Portal**

   ```bash
   pnpm dev
   ```

   - **Customer Storefront:** `http://localhost:3000`
   - **Dukaanidar Admin Portal:** `http://localhost:3000/admin` (logs in via `ADMIN_EMAIL` / `ADMIN_PASSWORD` in `apps/web/.env`)
   - **Local OTP Screen:** `http://localhost:3000/admin/otps`

4. **Run the Mobile App**

   ```bash
   pnpm dev:mobile
   ```

   - By default, the mobile app connects to `http://localhost:3000` (`http://10.0.2.2:3000` on Android emulators), or set `EXPO_PUBLIC_API_URL`, or update the Server URL inside the **Account** tab when testing on a physical phone over LAN.

## Key Features

- **Customer Web & Mobile:** Category & bilingual search, MRP vs selling price (`₹`), low-stock & out-of-stock indicators, Repeat Last Order (`Dobara Mangwayein`), Your Usuals, saved addresses, delivery slots, COD checkout, live 5-step order tracking, and 1-tap Reorder.
- **Dukaanidar Admin (`/admin`):**
  - `/admin` — Today's IST sales & order count, open orders, low-stock alerts (`≤ 5`), active OTP count.
  - `/admin/orders` — Filter by status and advance orders (`placed` → `accepted` → `packed` → `out_for_delivery` → `delivered` / `cancelled`) with automatic stock deduction & restoration on cancel.
  - `/admin/products` — Add SKUs and update MRP, selling price, stock quantities, and visibility.
  - `/admin/otps` — Live OTP viewer (auto-refreshes every 5s) for local/no-SMS mode.
  - `/admin/customers` — Customer list, order counts, and last order summary.
  - `/admin/offers` — Toggle promotional banner on the storefront.
  - `/admin/settings` — Edit store name (EN/HI), area, PIN, minimum order (`₹`), hours, delivery slots, and contact details.

## Verification Commands

```bash
pnpm build                          # Prisma generate + Next.js production build
pnpm --filter web lint              # Web ESLint
pnpm --filter mobile typecheck      # Mobile TypeScript check
```

## Real-World Cloud Hosting (₹0 Starter Stack)

For small-to-medium neighborhood scale, the lowest-cost production setup is **Neon Postgres (Free Tier)** + **Vercel Hobby (Free Tier)**:

1. **Cloud Database (Neon Postgres — Free 0.5 GB, `ap-south-1` Mumbai or Singapore)**
   - Create a project on [neon.tech](https://neon.tech) in the closest Asia region (`ap-south-1` / `ap-southeast-1`) and copy the connection string (`postgresql://...`).
   - Push the schema and seed the initial catalog once from your machine:
     ```bash
     DATABASE_URL="postgresql://..." pnpm --filter web db:push
     DATABASE_URL="postgresql://..." ADMIN_EMAIL="owner@yourstore.in" ADMIN_PASSWORD="strong-password" pnpm --filter web db:seed
     ```
   - Note: `scripts/prisma-prepare.mjs` automatically selects `apps/web/prisma/schema.postgres.prisma` whenever `DATABASE_URL` starts with `postgres://` or `postgresql://`, and `db:seed` is idempotent (it will never wipe existing customer orders unless `SEED_RESET=true`).

2. **Web & Admin Hosting (Vercel — Free Hobby Tier, HTTPS URL)**
   - Push this repo to GitHub and import it on [vercel.com](https://vercel.com).
   - Set **Root Directory** to `apps/web` (or leave root if using `pnpm --filter web build`).
   - Add Environment Variables in Vercel:
     - `DATABASE_URL` = your Neon Postgres URL
     - `JWT_SECRET` = a long random string (`openssl rand -base64 32`)
     - `ADMIN_EMAIL` = your shop owner email
     - `ADMIN_PASSWORD` = a strong password (or bcrypt hash)
     - `FAST2SMS_API_KEY` = optional (leave empty to keep using `/admin/otps` screen, or add Fast2SMS key for real SMS OTPs)
   - Deploy. Your customers get `https://<your-app>.vercel.app`, and the shopkeeper uses `https://<your-app>.vercel.app/admin`.

3. **Mobile App (Optional Android APK / Store Build)**
   - Set `EXPO_PUBLIC_API_URL=https://<your-app>.vercel.app` and build with EAS (`npx eas-cli build -p android`).

