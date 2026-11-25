"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, RefreshCw, Save, Search } from "lucide-react";
import AdminShell from "@/components/AdminShell";
import { CATEGORIES, paiseToInr } from "@/lib/inr";
import { ProductDTO } from "@/lib/types";

const EMOJI_PRESETS = ["🌾", "🍚", "🟡", "🫘", "🫙", "🧂", "🌶️", "🥛", "🧈", "🥣", "🧅", "🍅", "🥔", "🍪", "🍜", "🫧", "🦷", "🧴", "🛒"];

export default function AdminProductsPage() {
  const [products, setProducts] = useState<ProductDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [catFilter, setCatFilter] = useState("all");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [edits, setEdits] = useState<
    Record<string, { priceRupees: string; mrpRupees: string; stockQty: string }>
  >({});

  // New Product Modal
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newNameHi, setNewNameHi] = useState("");
  const [newCat, setNewCat] = useState(CATEGORIES[0].id);
  const [newUnit, setNewUnit] = useState("kg");
  const [newMrp, setNewMrp] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [newStock, setNewStock] = useState("10");
  const [newEmoji, setNewEmoji] = useState("🛒");
  const [creating, setCreating] = useState(false);

  const fetchProducts = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/products", { cache: "no-store" });
      if (res.ok) {
        const data = (await res.json()) as { products: ProductDTO[] };
        setProducts(data.products);
        const init: Record<
          string,
          { priceRupees: string; mrpRupees: string; stockQty: string }
        > = {};
        for (const p of data.products) {
          init[p.id] = {
            priceRupees: String(p.pricePaise / 100),
            mrpRupees: String(p.mrpPaise / 100),
            stockQty: String(p.stockQty),
          };
        }
        setEdits(init);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchProducts();
  }, [fetchProducts]);

  const load = () => {
    setLoading(true);
    void fetchProducts();
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => {
      if (catFilter !== "all" && p.category !== catFilter) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) || p.nameHi.toLowerCase().includes(q)
      );
    });
  }, [products, query, catFilter]);

  const saveProduct = async (p: ProductDTO, extra?: { isActive?: boolean; stockQty?: number }) => {
    setSavingId(p.id);
    try {
      const row = edits[p.id];
      const res = await fetch(`/api/admin/products/${p.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          priceRupees: Number(row?.priceRupees ?? p.pricePaise / 100),
          mrpRupees: Number(row?.mrpRupees ?? p.mrpPaise / 100),
          stockQty: extra?.stockQty ?? Number(row?.stockQty ?? p.stockQty),
          isActive: extra?.isActive ?? p.isActive,
        }),
      });
      if (res.ok) await load();
    } finally {
      setSavingId(null);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName.trim(),
          nameHi: newNameHi.trim() || newName.trim(),
          category: newCat,
          unit: newUnit,
          mrpRupees: Number(newMrp || newPrice || 0),
          priceRupees: Number(newPrice || 0),
          stockQty: Number(newStock || 0),
          imageEmoji: newEmoji,
          isActive: true,
        }),
      });
      if (res.ok) {
        setShowAdd(false);
        setNewName("");
        setNewNameHi("");
        setNewMrp("");
        setNewPrice("");
        setNewStock("10");
        await load();
      }
    } finally {
      setCreating(false);
    }
  };

  return (
    <AdminShell
      title="Products & Stock"
      subtitle="Daam badlein, stock bharein ya naya saman jodein"
      actions={
        <>
          <button
            onClick={load}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-stone-200 bg-white text-xs font-semibold"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
          <button
            onClick={() => setShowAdd(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold"
          >
            <Plus className="w-4 h-4" />
            <span>Naya Saman</span>
          </button>
        </>
      }
    >
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Saman search karein..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-stone-200 bg-white text-sm"
          />
        </div>
        <select
          value={catFilter}
          onChange={(e) => setCatFilter(e.target.value)}
          className="px-3 py-2 rounded-xl border border-stone-200 bg-white text-sm"
        >
          <option value="all">Sab Categories</option>
          {CATEGORIES.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
      </div>

      {loading && products.length === 0 ? (
        <div className="h-64 rounded-2xl bg-white border border-stone-200 animate-pulse" />
      ) : (
        <div className="rounded-2xl bg-white border border-stone-200 overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-stone-50 border-b border-stone-200 text-stone-600 text-xs">
              <tr>
                <th className="py-3 px-4">Item</th>
                <th className="py-3 px-3">MRP (₹)</th>
                <th className="py-3 px-3">Price (₹)</th>
                <th className="py-3 px-3">Stock</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filtered.map((p) => {
                const row = edits[p.id] ?? {
                  priceRupees: String(p.pricePaise / 100),
                  mrpRupees: String(p.mrpPaise / 100),
                  stockQty: String(p.stockQty),
                };
                return (
                  <tr key={p.id} className={!p.isActive ? "opacity-55" : ""}>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <span className="text-xl">{p.imageEmoji}</span>
                        <div>
                          <p className="font-semibold text-stone-900">{p.name}</p>
                          <p className="text-xs text-stone-500">
                            {p.nameHi} · {p.unit} · {paiseToInr(p.pricePaise)}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <input
                        type="number"
                        step="0.5"
                        value={row.mrpRupees}
                        onChange={(e) =>
                          setEdits((prev) => ({
                            ...prev,
                            [p.id]: { ...row, mrpRupees: e.target.value },
                          }))
                        }
                        className="w-20 px-2 py-1 rounded-lg border border-stone-200 text-xs"
                      />
                    </td>
                    <td className="py-3 px-3">
                      <input
                        type="number"
                        step="0.5"
                        value={row.priceRupees}
                        onChange={(e) =>
                          setEdits((prev) => ({
                            ...prev,
                            [p.id]: { ...row, priceRupees: e.target.value },
                          }))
                        }
                        className="w-20 px-2 py-1 rounded-lg border border-stone-200 text-xs font-semibold"
                      />
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          step="1"
                          value={row.stockQty}
                          onChange={(e) =>
                            setEdits((prev) => ({
                              ...prev,
                              [p.id]: { ...row, stockQty: e.target.value },
                            }))
                          }
                          className="w-16 px-2 py-1 rounded-lg border border-stone-200 text-xs"
                        />
                        <button
                          onClick={() =>
                            saveProduct(p, {
                              stockQty: Number(row.stockQty || 0) + 10,
                            })
                          }
                          className="px-2 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-[11px] font-semibold"
                        >
                          +10
                        </button>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <button
                        onClick={() =>
                          saveProduct(p, { isActive: !p.isActive })
                        }
                        className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                          p.isActive
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-stone-200 text-stone-600"
                        }`}
                      >
                        {p.isActive ? "Active" : "Hidden"}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        disabled={savingId === p.id}
                        onClick={() => saveProduct(p)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold disabled:opacity-50"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>Save</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {showAdd && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <form
            onSubmit={handleCreate}
            className="w-full max-w-md rounded-2xl bg-white p-6 space-y-4 shadow-2xl"
          >
            <h2 className="font-bold text-lg">Naya Saman Jodein</h2>
            <div className="flex flex-wrap gap-1.5">
              {EMOJI_PRESETS.map((em) => (
                <button
                  type="button"
                  key={em}
                  onClick={() => setNewEmoji(em)}
                  className={`w-9 h-9 rounded-xl text-lg border ${
                    newEmoji === em
                      ? "border-orange-600 bg-orange-50"
                      : "border-stone-200"
                  }`}
                >
                  {em}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input
                required
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Name (English) *"
                className="px-3 py-2 rounded-xl border border-stone-200 text-sm"
              />
              <input
                value={newNameHi}
                onChange={(e) => setNewNameHi(e.target.value)}
                placeholder="Naam (Hindi)"
                className="px-3 py-2 rounded-xl border border-stone-200 text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <select
                value={newCat}
                onChange={(e) => setNewCat(e.target.value)}
                className="px-3 py-2 rounded-xl border border-stone-200 text-sm"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
              <input
                required
                value={newUnit}
                onChange={(e) => setNewUnit(e.target.value)}
                placeholder="Unit (kg, L, packet)"
                className="px-3 py-2 rounded-xl border border-stone-200 text-sm"
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <input
                required
                type="number"
                step="0.5"
                value={newMrp}
                onChange={(e) => setNewMrp(e.target.value)}
                placeholder="MRP ₹"
                className="px-3 py-2 rounded-xl border border-stone-200 text-sm"
              />
              <input
                required
                type="number"
                step="0.5"
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
                placeholder="Price ₹ *"
                className="px-3 py-2 rounded-xl border border-stone-200 text-sm"
              />
              <input
                required
                type="number"
                value={newStock}
                onChange={(e) => setNewStock(e.target.value)}
                placeholder="Stock"
                className="px-3 py-2 rounded-xl border border-stone-200 text-sm"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAdd(false)}
                className="px-4 py-2 rounded-xl border border-stone-200 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={creating}
                className="px-4 py-2 rounded-xl bg-orange-600 text-white text-xs font-semibold"
              >
                {creating ? "Adding..." : "Item Add Karein"}
              </button>
            </div>
          </form>
        </div>
      )}
    </AdminShell>
  );
}
