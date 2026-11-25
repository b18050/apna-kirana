"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  KeyRound,
  LayoutDashboard,
  LogOut,
  Package,
  Settings,
  ShoppingCart,
  Sparkles,
  Store,
  Users,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/orders", label: "Orders", icon: ShoppingCart },
  { href: "/admin/products", label: "Products & Stock", icon: Package },
  { href: "/admin/otps", label: "Customer OTPs", icon: KeyRound },
  { href: "/admin/customers", label: "Customers", icon: Users },
  { href: "/admin/offers", label: "Offers", icon: Sparkles },
  { href: "/admin/settings", label: "Store Settings", icon: Settings },
];

export default function AdminShell({
  title,
  subtitle,
  actions,
  children,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [adminEmail, setAdminEmail] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/admin/me", { cache: "no-store" })
      .then(async (res) => {
        if (!res.ok) {
          router.replace("/admin/login");
          return;
        }
        const data = (await res.json()) as { email: string };
        if (!cancelled) {
          setAdminEmail(data.email);
          setChecking(false);
        }
      })
      .catch(() => {
        if (!cancelled) router.replace("/admin/login");
      });
    return () => {
      cancelled = true;
    };
  }, [router]);

  const handleLogout = async () => {
    await fetch("/api/auth/admin/logout", { method: "POST" });
    router.replace("/admin/login");
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FFFBF5] text-stone-500 text-sm">
        Dukaanidar session check ho raha hai...
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#FFFBF5] text-stone-900">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-white border-b md:border-b-0 md:border-r border-stone-200 flex flex-col">
        <div className="p-4 border-b border-stone-200 flex items-center justify-between md:justify-start gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-orange-600 text-white flex items-center justify-center">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-sm leading-tight">Apna Kirana</p>
              <p className="text-[11px] text-stone-500">Dukaanidar Admin</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="md:hidden p-2 rounded-lg text-stone-500 hover:bg-stone-100"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>

        <nav className="p-2 md:p-3 flex md:flex-col gap-1 overflow-x-auto">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-medium whitespace-nowrap transition ${
                  active
                    ? "bg-orange-600 text-white shadow-xs"
                    : "text-stone-700 hover:bg-stone-100"
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="hidden md:flex mt-auto p-4 border-t border-stone-200 flex-col gap-2">
          <p className="text-xs text-stone-500 truncate">{adminEmail}</p>
          <div className="flex items-center justify-between gap-2">
            <Link
              href="/"
              className="text-xs font-semibold text-orange-700 hover:underline"
            >
              ← View Storefront
            </Link>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1 text-xs font-medium text-stone-600 hover:text-red-600"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8">
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-stone-900">
                {title}
              </h1>
              {subtitle && (
                <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
                  {subtitle}
                </p>
              )}
            </div>
            {actions && <div className="flex items-center gap-2">{actions}</div>}
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}
