"use client";

import React, { useCallback, useEffect, useState } from "react";
import { RefreshCw, Users } from "lucide-react";
import AdminShell from "@/components/AdminShell";
import { formatIst, paiseToInr } from "@/lib/inr";

interface CustomerRow {
  id: string;
  phone: string;
  name: string;
  createdAt: string;
  _count: { orders: number };
  orders: { id: string; totalPaise: number; status: string; createdAt: string }[];
}

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCustomers = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/customers", { cache: "no-store" });
      if (res.ok) {
        const data = (await res.json()) as { customers: CustomerRow[] };
        setCustomers(data.customers);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchCustomers();
  }, [fetchCustomers]);

  const load = () => {
    setLoading(true);
    void fetchCustomers();
  };

  return (
    <AdminShell
      title="Customers · Grahak"
      subtitle="Registered grahakon ki list aur unke pichhle orders"
      actions={
        <button
          onClick={load}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-stone-200 bg-white text-xs font-semibold"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      }
    >
      {loading ? (
        <div className="h-48 rounded-2xl bg-white border border-stone-200 animate-pulse" />
      ) : customers.length === 0 ? (
        <div className="rounded-2xl bg-white border border-stone-200 p-12 text-center space-y-2">
          <Users className="w-8 h-8 text-stone-300 mx-auto" />
          <p className="text-sm text-stone-600">
            Abhi tak koi grahak register nahi hua hai.
          </p>
        </div>
      ) : (
        <div className="rounded-2xl bg-white border border-stone-200 overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-stone-50 border-b border-stone-200 text-stone-600 text-xs">
              <tr>
                <th className="py-3 px-4">Naam</th>
                <th className="py-3 px-4">Phone</th>
                <th className="py-3 px-4">Total Orders</th>
                <th className="py-3 px-4">Last Order</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {customers.map((c) => {
                const last = c.orders[0];
                return (
                  <tr key={c.id}>
                    <td className="py-3 px-4 font-semibold text-stone-900">
                      {c.name}
                    </td>
                    <td className="py-3 px-4 font-mono text-xs">+91 {c.phone}</td>
                    <td className="py-3 px-4">{c._count.orders}</td>
                    <td className="py-3 px-4 text-xs text-stone-600">
                      {last
                        ? `${paiseToInr(last.totalPaise)} · ${formatIst(last.createdAt)}`
                        : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </AdminShell>
  );
}
