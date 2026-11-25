"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  KeyRound,
  PackageCheck,
  RefreshCw,
  ShoppingCart,
} from "lucide-react";
import AdminShell from "@/components/AdminShell";
import { STATUS_LABEL, formatIst, paiseToInr } from "@/lib/inr";
import { OrderDTO, ProductDTO } from "@/lib/types";

interface DashboardData {
  todayOrders: OrderDTO[];
  todayTotal: number;
  lowStock: ProductDTO[];
  pendingOtps: number;
  openCount: number;
}

export default function AdminDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/dashboard", { cache: "no-store" });
      if (res.ok) setData(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchDashboard();
  }, [fetchDashboard]);

  const load = () => {
    setLoading(true);
    void fetchDashboard();
  };

  return (
    <AdminShell
      title="Aaj ka Hisaab · Dashboard"
      subtitle="IST (Asia/Kolkata) ke hisaab se aaj ke orders aur stock"
      actions={
        <button
          onClick={load}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-xs font-semibold"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      }
    >
      {loading && !data ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-28 rounded-2xl bg-white border border-stone-200 animate-pulse"
            />
          ))}
        </div>
      ) : data ? (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-2xl bg-white border border-stone-200 p-4">
              <p className="text-xs font-medium text-stone-500">Aaj ke Orders</p>
              <p className="text-2xl font-bold text-stone-900 mt-1">
                {data.todayOrders.length}
              </p>
              <p className="text-xs text-emerald-700 font-semibold mt-1">
                {paiseToInr(data.todayTotal)} kul bikri
              </p>
            </div>

            <Link
              href="/admin/orders"
              className="rounded-2xl bg-white border border-stone-200 p-4 hover:border-orange-300 transition"
            >
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-stone-500">
                  Open Orders
                </p>
                <ShoppingCart className="w-4 h-4 text-orange-600" />
              </div>
              <p className="text-2xl font-bold text-orange-700 mt-1">
                {data.openCount}
              </p>
              <p className="text-xs text-stone-500 mt-1">
                Pack / deliver karne hain →
              </p>
            </Link>

            <Link
              href="/admin/products"
              className="rounded-2xl bg-white border border-stone-200 p-4 hover:border-amber-300 transition"
            >
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-stone-500">
                  Kam Stock (≤5)
                </p>
                <AlertTriangle className="w-4 h-4 text-amber-600" />
              </div>
              <p className="text-2xl font-bold text-amber-700 mt-1">
                {data.lowStock.length}
              </p>
              <p className="text-xs text-stone-500 mt-1">Stock badhayein →</p>
            </Link>

            <Link
              href="/admin/otps"
              className="rounded-2xl bg-white border border-stone-200 p-4 hover:border-emerald-300 transition"
            >
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-stone-500">
                  Active OTPs
                </p>
                <KeyRound className="w-4 h-4 text-emerald-700" />
              </div>
              <p className="text-2xl font-bold text-emerald-700 mt-1">
                {data.pendingOtps}
              </p>
              <p className="text-xs text-stone-500 mt-1">OTP screen kholein →</p>
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Today's Orders */}
            <section className="rounded-2xl bg-white border border-stone-200 p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="font-bold text-base">Aaj ke Orders</h2>
                <Link
                  href="/admin/orders"
                  className="text-xs font-semibold text-orange-700 hover:underline"
                >
                  Sab Orders →
                </Link>
              </div>
              {data.todayOrders.length === 0 ? (
                <p className="text-xs text-stone-500 py-6 text-center">
                  Aaj abhi tak koi order nahi aaya hai.
                </p>
              ) : (
                <div className="divide-y divide-stone-100">
                  {data.todayOrders.slice(0, 8).map((o) => (
                    <div
                      key={o.id}
                      className="py-2.5 flex items-center justify-between gap-2 text-xs"
                    >
                      <div>
                        <p className="font-semibold text-stone-900">
                          {o.customer?.name ?? "Grahak"} ·{" "}
                          {o.customer?.phone ?? ""}
                        </p>
                        <p className="text-stone-500">
                          {formatIst(o.createdAt)} · {o.slotLabel}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-stone-900">
                          {paiseToInr(o.totalPaise)}
                        </p>
                        <span className="inline-block px-2 py-0.5 rounded-full bg-stone-100 text-stone-700 font-medium">
                          {STATUS_LABEL[o.status]?.en ?? o.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Low Stock */}
            <section className="rounded-2xl bg-white border border-stone-200 p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="font-bold text-base">Kam Stock Alert</h2>
                <Link
                  href="/admin/products"
                  className="text-xs font-semibold text-orange-700 hover:underline"
                >
                  Manage Stock →
                </Link>
              </div>
              {data.lowStock.length === 0 ? (
                <div className="py-6 text-center text-xs text-emerald-700 flex flex-col items-center gap-1.5">
                  <PackageCheck className="w-6 h-6" />
                  <span>Sab saman paryapt stock mein hai!</span>
                </div>
              ) : (
                <div className="divide-y divide-stone-100">
                  {data.lowStock.map((p) => (
                    <div
                      key={p.id}
                      className="py-2.5 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{p.imageEmoji}</span>
                        <div>
                          <p className="font-semibold text-stone-900">
                            {p.name}
                          </p>
                          <p className="text-stone-500">{p.nameHi}</p>
                        </div>
                      </div>
                      <span
                        className={`font-bold px-2.5 py-1 rounded-full ${
                          p.stockQty <= 0
                            ? "bg-red-100 text-red-700"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {p.stockQty} {p.unit}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        </>
      ) : null}
    </AdminShell>
  );
}
