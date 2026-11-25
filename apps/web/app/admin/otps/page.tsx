"use client";

import React, { useCallback, useEffect, useState } from "react";
import { KeyRound, RefreshCw } from "lucide-react";
import AdminShell from "@/components/AdminShell";
import { formatIst } from "@/lib/inr";

interface OtpRow {
  id: string;
  phone: string;
  code: string;
  expiresAt: string;
  createdAt: string;
}

export default function AdminOtpsPage() {
  const [otps, setOtps] = useState<OtpRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/otps", { cache: "no-store" });
      if (res.ok) {
        const data = (await res.json()) as { otps: OtpRow[] };
        setOtps(data.otps);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!autoRefresh) return;
    const id = setInterval(load, 5000);
    return () => clearInterval(id);
  }, [autoRefresh, load]);

  return (
    <AdminShell
      title="Customer OTP Screen"
      subtitle="Jab Fast2SMS band ho tab grahak ke login OTP yahan dikhte hain"
      actions={
        <div className="flex items-center gap-2">
          <label className="inline-flex items-center gap-1.5 text-xs text-stone-600 bg-white border border-stone-200 px-3 py-2 rounded-xl">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="accent-orange-600"
            />
            <span>Auto-refresh (5s)</span>
          </label>
          <button
            onClick={load}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-stone-200 bg-white text-xs font-semibold"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
        </div>
      }
    >
      {loading ? (
        <div className="h-40 rounded-2xl bg-white border border-stone-200 animate-pulse" />
      ) : otps.length === 0 ? (
        <div className="rounded-2xl bg-white border border-stone-200 p-12 text-center space-y-2">
          <KeyRound className="w-8 h-8 text-stone-300 mx-auto" />
          <p className="text-sm font-medium text-stone-700">
            Abhi koi active OTP nahi hai
          </p>
          <p className="text-xs text-stone-500">
            Jab koi grahak mobile app ya website pe OTP mangwayega, code yahan
            turant dikhega.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {otps.map((o) => (
            <div
              key={o.id}
              className="rounded-2xl bg-white border border-orange-200 p-5 space-y-2 shadow-xs"
            >
              <p className="text-xs font-semibold text-stone-500">
                Mobile: +91 {o.phone}
              </p>
              <p className="text-4xl font-mono font-bold tracking-[0.25em] text-orange-700">
                {o.code}
              </p>
              <p className="text-xs text-stone-500">
                Expires: {formatIst(o.expiresAt)}
              </p>
            </div>
          ))}
        </div>
      )}
    </AdminShell>
  );
}
