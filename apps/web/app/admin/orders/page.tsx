"use client";

import React, { useCallback, useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import AdminShell from "@/components/AdminShell";
import {
  ORDER_STATUSES,
  STATUS_LABEL,
  formatIst,
  paiseToInr,
} from "@/lib/inr";
import { OrderDTO } from "@/lib/types";

const NEXT_ACTION: Record<string, { next: string; label: string }[]> = {
  placed: [
    { next: "accepted", label: "Accept Order" },
    { next: "cancelled", label: "Cancel" },
  ],
  accepted: [
    { next: "packed", label: "Mark Packed" },
    { next: "cancelled", label: "Cancel" },
  ],
  packed: [
    { next: "out_for_delivery", label: "Out for Delivery" },
    { next: "cancelled", label: "Cancel" },
  ],
  out_for_delivery: [
    { next: "delivered", label: "Mark Delivered" },
    { next: "cancelled", label: "Cancel" },
  ],
  delivered: [],
  cancelled: [],
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<OrderDTO[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    try {
      const qs = filter === "all" ? "" : `?status=${encodeURIComponent(filter)}`;
      const res = await fetch(`/api/admin/orders${qs}`, { cache: "no-store" });
      if (res.ok) {
        const data = (await res.json()) as { orders: OrderDTO[] };
        setOrders(data.orders);
      }
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    void fetchOrders();
  }, [fetchOrders]);

  const load = () => {
    setLoading(true);
    void fetchOrders();
  };

  const updateStatus = async (orderId: string, status: string) => {
    setUpdatingId(orderId);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        await fetchOrders();
      }
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <AdminShell
      title="Orders Management"
      subtitle="Naye orders accept karein, pack karein aur delivery status update karein"
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
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilter("all")}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${
            filter === "all"
              ? "bg-stone-900 text-white border-stone-900"
              : "bg-white text-stone-700 border-stone-200"
          }`}
        >
          Sab Orders
        </button>
        {ORDER_STATUSES.map((st) => (
          <button
            key={st}
            onClick={() => setFilter(st)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${
              filter === st
                ? "bg-orange-600 text-white border-orange-600"
                : "bg-white text-stone-700 border-stone-200"
            }`}
          >
            {STATUS_LABEL[st].en}
          </button>
        ))}
      </div>

      {loading && orders.length === 0 ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-32 rounded-2xl bg-white border border-stone-200 animate-pulse"
            />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="rounded-2xl bg-white border border-stone-200 p-10 text-center text-sm text-stone-500">
          Is filter mein koi order nahi hai.
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const actions = NEXT_ACTION[order.status] ?? [];
            const label = STATUS_LABEL[order.status] ?? {
              en: order.status,
              hi: order.status,
            };

            return (
              <div
                key={order.id}
                className="rounded-2xl bg-white border border-stone-200 p-5 space-y-3"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-stone-500">
                        #{order.id.slice(-6).toUpperCase()}
                      </span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          order.status === "delivered"
                            ? "bg-emerald-100 text-emerald-800"
                            : order.status === "cancelled"
                              ? "bg-red-100 text-red-700"
                              : "bg-orange-100 text-orange-800"
                        }`}
                      >
                        {label.en} · {label.hi}
                      </span>
                    </div>
                    <p className="font-bold text-base text-stone-900 mt-1">
                      {order.customer?.name ?? "Grahak"} ·{" "}
                      {order.customer?.phone ?? ""}
                    </p>
                    <p className="text-xs text-stone-500">
                      {formatIst(order.createdAt)} · Slot: {order.slotLabel} ·{" "}
                      {order.paymentMethod.toUpperCase()}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-lg font-bold text-stone-900">
                      {paiseToInr(order.totalPaise)}
                    </p>
                    <p className="text-[11px] text-stone-500">
                      Stock: {order.stockApplied ? "Held" : "Not deducted"}
                    </p>
                  </div>
                </div>

                {order.address && (
                  <p className="text-xs text-stone-600 bg-stone-50 rounded-xl px-3 py-2">
                    <span className="font-semibold">Address:</span>{" "}
                    {order.address.line1}
                    {order.address.landmark
                      ? `, ${order.address.landmark}`
                      : ""}
                    , {order.address.area} – {order.address.pin}
                  </p>
                )}

                {order.notes && (
                  <p className="text-xs text-amber-800 bg-amber-50 rounded-xl px-3 py-2">
                    <span className="font-semibold">Note:</span> {order.notes}
                  </p>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs bg-[#FFFBF5] rounded-xl p-3 border border-stone-100">
                  {order.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex justify-between gap-2 text-stone-700"
                    >
                      <span>
                        {item.name} × {item.qty} {item.unit}
                      </span>
                      <span className="font-semibold">
                        {paiseToInr(Math.round(item.pricePaise * item.qty))}
                      </span>
                    </div>
                  ))}
                </div>

                {actions.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {actions.map((act) => (
                      <button
                        key={act.next}
                        disabled={updatingId === order.id}
                        onClick={() => updateStatus(order.id, act.next)}
                        className={`px-3.5 py-2 rounded-xl text-xs font-semibold disabled:opacity-50 ${
                          act.next === "cancelled"
                            ? "border border-red-200 text-red-700 hover:bg-red-50"
                            : "bg-orange-600 hover:bg-orange-700 text-white"
                        }`}
                      >
                        {act.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </AdminShell>
  );
}
