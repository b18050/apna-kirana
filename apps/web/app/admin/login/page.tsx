"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Lock, Store } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("owner@apnakirana.in");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/auth/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Login fail hua");
        return;
      }
      router.replace("/admin");
    } catch {
      setError("Server se connect nahi ho paya");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FFFBF5] p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white border border-stone-200 p-6 shadow-sm space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-orange-600 text-white flex items-center justify-center">
            <Store className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-stone-900">
              Dukaanidar Login
            </h1>
            <p className="text-xs text-stone-500">Apna Kirana · Admin Portal</p>
          </div>
        </div>

        {error && (
          <div className="rounded-xl bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Owner Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="owner@apnakirana.in"
              className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={busy}
            className="w-full py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-semibold text-sm disabled:opacity-50"
          >
            {busy ? "Logging in..." : "Login Karein"}
          </button>
        </form>

        <div className="pt-2 border-t border-stone-100 text-center">
          <Link
            href="/"
            className="text-xs font-medium text-stone-500 hover:text-orange-700"
          >
            ← Customer Storefront pe wapas jaayein
          </Link>
        </div>
      </div>
    </div>
  );
}
