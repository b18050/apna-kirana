"use client";

import React, { useEffect, useState } from "react";
import { Save } from "lucide-react";
import AdminShell from "@/components/AdminShell";
import { StoreSettingsDTO, parseSlots } from "@/lib/types";

export default function AdminSettingsPage() {
  const [storeName, setStoreName] = useState("Apna Kirana");
  const [storeNameHi, setStoreNameHi] = useState("अपना किराना");
  const [area, setArea] = useState("Manpur");
  const [pin, setPin] = useState("823003");
  const [minOrderRupees, setMinOrderRupees] = useState("0");
  const [hours, setHours] = useState("Subah 8 baje – raat 9 baje");
  const [slotsText, setSlotsText] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/settings", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { settings: StoreSettingsDTO } | null) => {
        if (!data?.settings) return;
        const s = data.settings;
        setStoreName(s.storeName);
        setStoreNameHi(s.storeNameHi);
        setArea(s.area);
        setPin(s.pin);
        setMinOrderRupees(String(s.minOrderPaise / 100));
        setHours(s.hours);
        setSlotsText(parseSlots(s.slotsJson).join("\n"));
        setContactPhone(s.contactPhone);
        setContactEmail(s.contactEmail);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedMsg(null);
    const slots = slotsText
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);

    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storeName,
          storeNameHi,
          area,
          pin,
          minOrderRupees: Number(minOrderRupees || 0),
          hours,
          slots,
          contactPhone,
          contactEmail,
        }),
      });
      if (res.ok) setSavedMsg("Dukaan ki settings save ho gayi!");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminShell
      title="Store Settings · Dukaan ki Jankari"
      subtitle="Dukaan ka naam, area, minimum order aur delivery slots set karein"
    >
      {loading ? (
        <div className="h-64 rounded-2xl bg-white border border-stone-200 animate-pulse" />
      ) : (
        <form
          onSubmit={handleSave}
          className="rounded-2xl bg-white border border-stone-200 p-6 space-y-4 max-w-2xl"
        >
          {savedMsg && (
            <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-3 py-2 text-xs font-semibold text-emerald-800">
              {savedMsg}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Store Name (English)
              </label>
              <input
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-stone-200 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Store Name (Hindi)
              </label>
              <input
                value={storeNameHi}
                onChange={(e) => setStoreNameHi(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-stone-200 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Area / Mohalla
              </label>
              <input
                value={area}
                onChange={(e) => setArea(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-stone-200 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                PIN Code
              </label>
              <input
                maxLength={6}
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-stone-200 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Min Order (₹)
              </label>
              <input
                type="number"
                value={minOrderRupees}
                onChange={(e) => setMinOrderRupees(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-stone-200 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Store Hours
            </label>
            <input
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-stone-200 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Delivery Slots (har line mein ek slot)
            </label>
            <textarea
              rows={4}
              value={slotsText}
              onChange={(e) => setSlotsText(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-stone-200 text-sm font-mono"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Contact Phone
              </label>
              <input
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-stone-200 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Contact Email
              </label>
              <input
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-stone-200 text-sm"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-sm font-semibold disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? "Saving..." : "Save Settings"}</span>
          </button>
        </form>
      )}
    </AdminShell>
  );
}
