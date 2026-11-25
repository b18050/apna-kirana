"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Clock,
  LogOut,
  MapPin,
  Minus,
  Package,
  Phone,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  ShoppingBag,
  Sparkles,
  Store,
  User,
  X,
} from "lucide-react";
import {
  CATEGORIES,
  STATUS_LABEL,
  formatIst,
  isValidInPhone,
  isValidPin,
  paiseToInr,
} from "@/lib/inr";
import {
  AddressDTO,
  HomeResponseDTO,
  OrderDTO,
  ProductDTO,
  parseSlots,
} from "@/lib/types";

const TOKEN_KEY = "ak_customer_token";
const CART_KEY = "ak_cart";

const PROGRESS_STEPS = [
  "placed",
  "accepted",
  "packed",
  "out_for_delivery",
  "delivered",
] as const;

export default function StorefrontApp() {
  const [token, setToken] = useState<string | null>(null);
  const [home, setHome] = useState<HomeResponseDTO | null>(null);
  const [orders, setOrders] = useState<OrderDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const [category, setCategory] = useState<string>("all");
  const [query, setQuery] = useState("");
  const [cart, setCart] = useState<Record<string, number>>({});

  // Drawers / Modals
  const [cartOpen, setCartOpen] = useState(false);
  const [ordersOpen, setOrdersOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);

  // Checkout state
  const [selectedAddressId, setSelectedAddressId] = useState<string>("");
  const [selectedSlot, setSelectedSlot] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [placingOrder, setPlacingOrder] = useState(false);

  // New Address inline form
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [addrLine1, setAddrLine1] = useState("");
  const [addrLandmark, setAddrLandmark] = useState("");
  const [addrArea, setAddrArea] = useState("");
  const [addrPin, setAddrPin] = useState("");
  const [savingAddress, setSavingAddress] = useState(false);

  // OTP Login state
  const [otpStep, setOtpStep] = useState<"phone" | "code">("phone");
  const [phoneInput, setPhoneInput] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [otpHint, setOtpHint] = useState<string | null>(null);
  const [authBusy, setAuthBusy] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast((curr) => (curr === msg ? null : curr)), 4000);
  }, []);

  const loadData = useCallback(async (authToken: string | null) => {
    try {
      const headers: Record<string, string> = {};
      if (authToken) headers.Authorization = `Bearer ${authToken}`;
      const res = await fetch("/api/home", { headers, cache: "no-store" });
      if (!res.ok) throw new Error("Store load nahi ho paya");
      const data = (await res.json()) as HomeResponseDTO;
      setHome(data);
      setError(null);

      const slots = parseSlots(data.settings?.slotsJson);
      setSelectedSlot((prev) => (prev && slots.includes(prev) ? prev : slots[0]));

      if (data.addresses?.length) {
        setSelectedAddressId((prev) =>
          prev && data.addresses.some((a) => a.id === prev)
            ? prev
            : data.addresses[0].id,
        );
      } else {
        setSelectedAddressId("");
      }

      if (authToken && data.customer) {
        const oRes = await fetch("/api/orders", {
          headers: { Authorization: `Bearer ${authToken}` },
          cache: "no-store",
        });
        if (oRes.ok) {
          const oData = (await oRes.json()) as { orders: OrderDTO[] };
          setOrders(oData.orders);
        }
      } else {
        setOrders([]);
        if (authToken && !data.customer) {
          localStorage.removeItem(TOKEN_KEY);
          setToken(null);
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Network error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(cart));
    } catch {
      // ignore
    }
  }, [cart]);

  // Hydrate token and cart from localStorage, then load store data
  useEffect(() => {
    let active = true;
    Promise.resolve().then(async () => {
      let savedToken: string | null = null;
      try {
        savedToken = localStorage.getItem(TOKEN_KEY);
        const savedCart = localStorage.getItem(CART_KEY);
        if (active && savedToken) setToken(savedToken);
        if (active && savedCart) {
          const parsed = JSON.parse(savedCart);
          if (parsed && typeof parsed === "object") setCart(parsed);
        }
      } catch {
        // ignore storage errors
      }
      if (active) await loadData(savedToken);
    });
    return () => {
      active = false;
    };
  }, [loadData]);

  const productsById = useMemo(() => {
    const map = new Map<string, ProductDTO>();
    for (const p of home?.products ?? []) map.set(p.id, p);
    return map;
  }, [home?.products]);

  const filteredProducts = useMemo(() => {
    const list = home?.products ?? [];
    const q = query.trim().toLowerCase();
    return list.filter((p) => {
      if (category !== "all" && p.category !== category) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.nameHi.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
      );
    });
  }, [home?.products, category, query]);

  const cartLines = useMemo(() => {
    const lines: { product: ProductDTO; qty: number; linePaise: number }[] = [];
    for (const [productId, qty] of Object.entries(cart)) {
      if (qty <= 0) continue;
      const product = productsById.get(productId);
      if (!product) continue;
      lines.push({
        product,
        qty,
        linePaise: Math.round(product.pricePaise * qty),
      });
    }
    return lines;
  }, [cart, productsById]);

  const cartCount = useMemo(
    () => cartLines.reduce((sum, l) => sum + l.qty, 0),
    [cartLines],
  );
  const cartTotalPaise = useMemo(
    () => cartLines.reduce((sum, l) => sum + l.linePaise, 0),
    [cartLines],
  );

  const updateQty = (product: ProductDTO, delta: number) => {
    setCart((prev) => {
      const current = prev[product.id] ?? 0;
      const next = Math.max(0, Math.min(product.stockQty, current + delta));
      if (next === 0) {
        const copy = { ...prev };
        delete copy[product.id];
        return copy;
      }
      return { ...prev, [product.id]: next };
    });
  };

  const handleReorder = async (orderId: string) => {
    if (!token) {
      setAuthOpen(true);
      return;
    }
    try {
      const res = await fetch(`/api/orders/${orderId}/reorder`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error ?? "Reorder fail hua");
        return;
      }
      const nextCart: Record<string, number> = {};
      for (const item of data.available as { productId: string; qty: number }[]) {
        nextCart[item.productId] = item.qty;
      }
      setCart(nextCart);
      if (data.addressId) setSelectedAddressId(data.addressId);
      if (data.slotLabel) setSelectedSlot(data.slotLabel);
      setOrdersOpen(false);
      setCartOpen(true);
      if (data.skipped?.length) {
        showToast(`Cart bhara! Yeh khatam the: ${data.skipped.join(", ")}`);
      } else {
        showToast("Purana order cart mein daal diya!");
      }
    } catch {
      showToast("Reorder mein dikkat aayi");
    }
  };

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    const cleaned = phoneInput.replace(/\D/g, "").slice(-10);
    if (!isValidInPhone(cleaned)) {
      setAuthError("Sahi 10 digit Indian mobile number daaliye (6-9 se shuru)");
      return;
    }
    setAuthBusy(true);
    try {
      const res = await fetch("/api/auth/otp/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: cleaned }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAuthError(data.error ?? "OTP bhejne mein error");
        return;
      }
      setPhoneInput(cleaned);
      setOtpHint(data.hint ?? "OTP bhej diya gaya");
      setOtpStep("code");
    } catch {
      setAuthError("Server se connect nahi ho paya");
    } finally {
      setAuthBusy(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    if (!otpCode.trim()) {
      setAuthError("4 digit OTP daaliye");
      return;
    }
    setAuthBusy(true);
    try {
      const res = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: phoneInput,
          code: otpCode.trim(),
          name: customerName.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAuthError(data.error ?? "Galat OTP");
        return;
      }
      localStorage.setItem(TOKEN_KEY, data.token);
      setToken(data.token);
      setAuthOpen(false);
      setOtpStep("phone");
      setOtpCode("");
      setOtpHint(null);
      showToast(`Namaste, ${data.customer.name}!`);
    } catch {
      setAuthError("Verification fail hua");
    } finally {
      setAuthBusy(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setOrders([]);
    showToast("Logout ho gaye");
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    if (!addrLine1.trim() || !addrArea.trim() || !isValidPin(addrPin.trim())) {
      showToast("Ghar ka pata, area aur 6 digit PIN zaroori hai");
      return;
    }
    setSavingAddress(true);
    try {
      const res = await fetch("/api/me/addresses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          line1: addrLine1.trim(),
          landmark: addrLandmark.trim(),
          area: addrArea.trim(),
          pin: addrPin.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error ?? "Address save nahi hua");
        return;
      }
      const created = data.address as AddressDTO;
      setHome((prev) =>
        prev
          ? {
              ...prev,
              addresses: [
                created,
                ...prev.addresses.map((a) => ({ ...a, isDefault: false })),
              ],
            }
          : prev,
      );
      setSelectedAddressId(created.id);
      setShowAddressForm(false);
      setAddrLine1("");
      setAddrLandmark("");
      setAddrArea("");
      setAddrPin("");
      showToast("Naya address save ho gaya!");
    } catch {
      showToast("Address save karne mein error");
    } finally {
      setSavingAddress(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (!token) {
      setAuthOpen(true);
      return;
    }
    if (!selectedAddressId) {
      setShowAddressForm(true);
      showToast("Delivery ke liye address add ya select kijiye");
      return;
    }
    if (!cartLines.length) return;
    if (
      home?.settings?.minOrderPaise &&
      cartTotalPaise < home.settings.minOrderPaise
    ) {
      showToast(
        `Minimum order ${paiseToInr(home.settings.minOrderPaise)} hona chahiye`,
      );
      return;
    }

    setPlacingOrder(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          addressId: selectedAddressId,
          slotLabel: selectedSlot,
          items: cartLines.map((l) => ({
            productId: l.product.id,
            qty: l.qty,
          })),
          notes: notes.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error ?? "Order place nahi ho paya");
        return;
      }
      setCart({});
      setNotes("");
      setCartOpen(false);
      setOrdersOpen(true);
      showToast("Order mil gaya! Dukaan ko bhej diya hai.");
      await loadData(token);
    } catch {
      showToast("Order place karne mein network error");
    } finally {
      setPlacingOrder(false);
    }
  };

  const settings = home?.settings;
  const slots = parseSlots(settings?.slotsJson);
  const minOrderPaise = settings?.minOrderPaise ?? 0;
  const belowMinOrder = cartTotalPaise < minOrderPaise;

  return (
    <div className="min-h-screen flex flex-col bg-[#FFFBF5] text-stone-900">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-24 sm:bottom-6 left-1/2 -translate-x-1/2 z-50 bg-stone-900 text-white px-4 py-2.5 rounded-full shadow-lg text-sm font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toast}</span>
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-stone-200">
        <div className="max-w-6xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-600 text-white flex items-center justify-center shadow-sm">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <h1 className="text-lg font-bold tracking-tight text-stone-900">
                  {settings?.storeName ?? "Apna Kirana"}
                </h1>
                <span className="text-sm font-medium text-orange-700">
                  {settings?.storeNameHi ?? "अपना किराना"}
                </span>
              </div>
              <p className="text-xs text-stone-500 flex items-center gap-2">
                <span className="inline-flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-orange-600" />
                  {settings?.area ?? "Manpur"} · {settings?.pin ?? "823003"}
                </span>
                <span>•</span>
                <span className="inline-flex items-center gap-1">
                  <Clock className="w-3 h-3 text-emerald-600" />
                  {settings?.hours ?? "Subah 8 baje – raat 9 baje"}
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {home?.customer ? (
              <>
                <button
                  onClick={() => setOrdersOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-sm font-medium"
                >
                  <Package className="w-4 h-4 text-orange-600" />
                  <span>Orders</span>
                  {(home.openOrders?.length ?? 0) > 0 && (
                    <span className="ml-0.5 px-1.5 py-0.5 text-xs rounded-full bg-orange-100 text-orange-700 font-semibold">
                      {home.openOrders.length}
                    </span>
                  )}
                </button>
                <button
                  onClick={handleLogout}
                  title="Logout"
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-sm text-stone-700"
                >
                  <User className="w-4 h-4 text-emerald-700" />
                  <span className="hidden sm:inline">{home.customer.name}</span>
                  <LogOut className="w-3.5 h-3.5 text-stone-400" />
                </button>
              </>
            ) : (
              <button
                onClick={() => setAuthOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-orange-200 bg-orange-50 hover:bg-orange-100 text-orange-800 text-sm font-medium"
              >
                <Phone className="w-4 h-4" />
                <span>Login / OTP</span>
              </button>
            )}

            <button
              onClick={() => setCartOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-sm font-semibold shadow-sm"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Thela ({cartCount})</span>
              {cartTotalPaise > 0 && (
                <span className="pl-1.5 border-l border-orange-400">
                  {paiseToInr(cartTotalPaise)}
                </span>
              )}
            </button>

            <Link
              href="/admin"
              className="hidden md:inline-flex items-center px-3 py-2 rounded-xl text-xs font-medium text-stone-600 hover:text-stone-900 hover:bg-stone-100"
            >
              Dukaanidar Admin →
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6 space-y-6">
        {/* Active Offer Banner */}
        {home?.offer?.isActive && (
          <div className="rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 text-white p-4 shadow-sm flex items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 mt-0.5 shrink-0" />
              <div>
                <h2 className="font-bold text-base">
                  {home.offer.title} · {home.offer.titleHi}
                </h2>
                <p className="text-sm text-orange-50">
                  {home.offer.body} ({home.offer.bodyHi})
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Open Orders Strip */}
        {home?.openOrders && home.openOrders.length > 0 && (
          <section className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800">
                Chalu Order · Live Status
              </p>
              <p className="text-sm font-medium text-stone-900 mt-0.5">
                Order #{home.openOrders[0].id.slice(-6).toUpperCase()} —{" "}
                <span className="font-bold text-emerald-800">
                  {STATUS_LABEL[home.openOrders[0].status]?.en ??
                    home.openOrders[0].status}
                </span>{" "}
                ({STATUS_LABEL[home.openOrders[0].status]?.hi}) ·{" "}
                {home.openOrders[0].slotLabel}
              </p>
            </div>
            <button
              onClick={() => setOrdersOpen(true)}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold"
            >
              Track Order
            </button>
          </section>
        )}

        {/* Repeat Last Order & Usuals */}
        {home?.customer && (home.lastOrder || home.usuals.length > 0) && (
          <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {home.lastOrder && (
              <div className="rounded-2xl border border-orange-200 bg-white p-4 shadow-xs flex flex-col justify-between gap-3">
                <div>
                  <span className="text-xs font-semibold text-orange-700 uppercase tracking-wide">
                    Pichhla Order
                  </span>
                  <h3 className="font-semibold text-stone-900 mt-1">
                    {home.lastOrder.items.length} items ·{" "}
                    {paiseToInr(home.lastOrder.totalPaise)}
                  </h3>
                  <p className="text-xs text-stone-500 mt-1 line-clamp-2">
                    {home.lastOrder.items
                      .map((i) => `${i.name} × ${i.qty}`)
                      .join(", ")}
                  </p>
                </div>
                <button
                  onClick={() => handleReorder(home.lastOrder!.id)}
                  className="inline-flex items-center justify-center gap-1.5 w-full py-2 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-800 text-sm font-semibold border border-orange-200"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Dobara Mangwayein</span>
                </button>
              </div>
            )}

            {home.usuals.length > 0 && (
              <div className="md:col-span-2 rounded-2xl border border-stone-200 bg-white p-4 shadow-xs">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-stone-900 text-sm">
                    Aapka Rozana Saman · Your Usuals
                  </h3>
                </div>
                <div className="flex gap-3 overflow-x-auto pb-1">
                  {home.usuals.map((p) => {
                    const qty = cart[p.id] ?? 0;
                    return (
                      <div
                        key={p.id}
                        className="min-w-[150px] rounded-xl border border-stone-200 p-2.5 flex flex-col justify-between gap-2 bg-[#FFFBF5]"
                      >
                        <div>
                          <div className="text-2xl">{p.imageEmoji}</div>
                          <div className="text-xs font-semibold text-stone-900 truncate mt-1">
                            {p.name}
                          </div>
                          <div className="text-xs text-stone-500">
                            {paiseToInr(p.pricePaise)} / {p.unit}
                          </div>
                        </div>
                        {qty > 0 ? (
                          <div className="flex items-center justify-between bg-orange-600 text-white rounded-lg px-2 py-1 text-xs font-semibold">
                            <button onClick={() => updateQty(p, -1)}>
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span>{qty}</span>
                            <button onClick={() => updateQty(p, 1)}>
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <button
                            disabled={p.stockQty <= 0}
                            onClick={() => updateQty(p, 1)}
                            className="w-full py-1 rounded-lg bg-white border border-orange-300 text-orange-700 hover:bg-orange-50 text-xs font-semibold disabled:opacity-40"
                          >
                            + Add
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </section>
        )}

        {/* Search + Categories */}
        <section className="space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Saman khojiye — atta, chawal, doodh, tel, pyaaz..."
              className="w-full pl-10 pr-4 py-3 rounded-2xl border border-stone-200 bg-white text-sm shadow-xs focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <button
              onClick={() => setCategory("all")}
              className={`px-3.5 py-2 rounded-full text-xs font-semibold whitespace-nowrap border transition ${
                category === "all"
                  ? "bg-stone-900 text-white border-stone-900"
                  : "bg-white text-stone-700 border-stone-200 hover:bg-stone-50"
              }`}
            >
              Sab Saman · All
            </button>
            {CATEGORIES.map((c) => (
              <button
                key={c.id}
                onClick={() => setCategory(c.id)}
                className={`px-3.5 py-2 rounded-full text-xs font-semibold whitespace-nowrap border transition ${
                  category === c.id
                    ? "bg-orange-600 text-white border-orange-600"
                    : "bg-white text-stone-700 border-stone-200 hover:bg-stone-50"
                }`}
              >
                {c.label} · {c.labelHi}
              </button>
            ))}
          </div>
        </section>

        {/* Product Grid */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, idx) => (
              <div
                key={idx}
                className="h-48 rounded-2xl bg-white border border-stone-200 animate-pulse"
              />
            ))}
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center space-y-3">
            <p className="text-sm font-medium text-red-800">{error}</p>
            <button
              onClick={() => loadData(token)}
              className="px-4 py-2 rounded-xl bg-red-600 text-white text-sm font-semibold"
            >
              Dobara koshish karein
            </button>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="rounded-2xl border border-stone-200 bg-white p-10 text-center text-stone-500 text-sm">
            Koi saman nahi mila. Search ya category badal ke dekhein.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredProducts.map((p) => {
              const qty = cart[p.id] ?? 0;
              const outOfStock = p.stockQty <= 0;
              const lowStock = p.stockQty > 0 && p.stockQty <= 5;
              const discountPct =
                p.mrpPaise > p.pricePaise
                  ? Math.round(((p.mrpPaise - p.pricePaise) / p.mrpPaise) * 100)
                  : 0;

              return (
                <div
                  key={p.id}
                  className="rounded-2xl border border-stone-200 bg-white p-4 shadow-xs flex flex-col justify-between gap-3 hover:border-orange-300 transition"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="w-12 h-12 rounded-2xl bg-[#FFFBF5] border border-stone-100 flex items-center justify-center text-3xl">
                        {p.imageEmoji}
                      </div>
                      {discountPct > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold">
                          {discountPct}% OFF
                        </span>
                      )}
                    </div>

                    <h3 className="font-semibold text-stone-900 mt-3 text-sm leading-snug">
                      {p.name}
                    </h3>
                    <p className="text-xs text-stone-500 mt-0.5">
                      {p.nameHi} · 1 {p.unit}
                    </p>

                    {outOfStock ? (
                      <span className="inline-block mt-2 text-[11px] font-semibold text-red-600">
                        Khatam (Out of stock)
                      </span>
                    ) : lowStock ? (
                      <span className="inline-block mt-2 text-[11px] font-semibold text-amber-700">
                        Sirf {p.stockQty} {p.unit} bache
                      </span>
                    ) : null}
                  </div>

                  <div className="flex items-end justify-between gap-2 pt-2 border-t border-stone-100">
                    <div>
                      <div className="text-base font-bold text-stone-900">
                        {paiseToInr(p.pricePaise)}
                      </div>
                      {p.mrpPaise > p.pricePaise && (
                        <div className="text-xs text-stone-400 line-through">
                          {paiseToInr(p.mrpPaise)}
                        </div>
                      )}
                    </div>

                    {qty > 0 ? (
                      <div className="inline-flex items-center gap-2 bg-orange-600 text-white rounded-xl px-2.5 py-1.5 text-sm font-semibold">
                        <button
                          onClick={() => updateQty(p, -1)}
                          aria-label={`Decrease ${p.name}`}
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="min-w-[16px] text-center">{qty}</span>
                        <button
                          onClick={() => updateQty(p, 1)}
                          disabled={qty >= p.stockQty}
                          aria-label={`Increase ${p.name}`}
                          className="disabled:opacity-40"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <button
                        disabled={outOfStock}
                        onClick={() => updateQty(p, 1)}
                        className="px-3.5 py-1.5 rounded-xl border border-orange-300 bg-orange-50 hover:bg-orange-100 text-orange-700 text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        + Add
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Mobile Floating Cart Bar */}
      {cartCount > 0 && (
        <div className="sm:hidden sticky bottom-3 z-20 px-4">
          <button
            onClick={() => setCartOpen(true)}
            className="w-full py-3.5 px-4 rounded-2xl bg-orange-600 text-white shadow-lg flex items-center justify-between font-semibold text-sm"
          >
            <span>
              {cartCount} items · {paiseToInr(cartTotalPaise)}
            </span>
            <span>Thela dekhein →</span>
          </button>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-stone-200 bg-white mt-10">
        <div className="max-w-6xl mx-auto px-4 py-6 flex flex-wrap items-center justify-between gap-4 text-xs text-stone-500">
          <div>
            <span className="font-semibold text-stone-700">
              {settings?.storeName ?? "Apna Kirana"}
            </span>{" "}
            · {settings?.area ?? "Manpur"} ({settings?.pin ?? "823003"}) ·{" "}
            {settings?.contactPhone ?? "9876543210"} ·{" "}
            {settings?.contactEmail ?? "dukaan@apnakirana.in"}
          </div>
          <Link
            href="/admin"
            className="font-medium text-orange-700 hover:underline"
          >
            Dukaanidar Portal (/admin) →
          </Link>
        </div>
      </footer>

      {/* Cart & Checkout Drawer */}
      {cartOpen && (
        <div className="fixed inset-0 z-40 bg-black/40 flex justify-end">
          <div className="w-full max-w-md bg-white h-full flex flex-col shadow-2xl">
            <div className="px-5 py-4 border-b border-stone-200 flex items-center justify-between">
              <div>
                <h2 className="font-bold text-lg text-stone-900">
                  Aapka Thela · Cart
                </h2>
                <p className="text-xs text-stone-500">
                  {cartCount} items · Cash on Delivery
                </p>
              </div>
              <button
                onClick={() => setCartOpen(false)}
                className="p-2 rounded-xl hover:bg-stone-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {cartLines.length === 0 ? (
                <div className="py-16 text-center text-stone-500 text-sm">
                  Thela khali hai. Store se saman add kijiye!
                </div>
              ) : (
                <>
                  <div className="space-y-3">
                    {cartLines.map(({ product, qty, linePaise }) => (
                      <div
                        key={product.id}
                        className="flex items-center justify-between gap-3 rounded-xl border border-stone-200 p-3"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="text-2xl">{product.imageEmoji}</span>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-stone-900 truncate">
                              {product.name}
                            </p>
                            <p className="text-xs text-stone-500">
                              {paiseToInr(product.pricePaise)} / {product.unit}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <div className="inline-flex items-center gap-2 bg-stone-100 rounded-lg px-2 py-1 text-xs font-semibold">
                            <button onClick={() => updateQty(product, -1)}>
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span>{qty}</span>
                            <button
                              disabled={qty >= product.stockQty}
                              onClick={() => updateQty(product, 1)}
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <span className="text-sm font-bold w-16 text-right">
                            {paiseToInr(linePaise)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Delivery Slot */}
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold uppercase tracking-wide text-stone-600">
                      Delivery Slot
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {slots.map((slot) => (
                        <button
                          key={slot}
                          type="button"
                          onClick={() => setSelectedSlot(slot)}
                          className={`px-3 py-2 rounded-xl text-xs font-semibold border text-left transition ${
                            selectedSlot === slot
                              ? "border-orange-600 bg-orange-50 text-orange-800"
                              : "border-stone-200 bg-white text-stone-700 hover:bg-stone-50"
                          }`}
                        >
                          {slot}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Address Section */}
                  {home?.customer ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold uppercase tracking-wide text-stone-600">
                          Delivery Address
                        </label>
                        <button
                          type="button"
                          onClick={() => setShowAddressForm((v) => !v)}
                          className="text-xs font-semibold text-orange-700 hover:underline"
                        >
                          {showAddressForm ? "Cancel" : "+ Naya Address"}
                        </button>
                      </div>

                      {showAddressForm ? (
                        <form
                          onSubmit={handleSaveAddress}
                          className="space-y-2.5 rounded-xl border border-stone-200 p-3 bg-[#FFFBF5]"
                        >
                          <input
                            required
                            value={addrLine1}
                            onChange={(e) => setAddrLine1(e.target.value)}
                            placeholder="Ghar / Makan number, gali *"
                            className="w-full px-3 py-2 rounded-lg border border-stone-200 bg-white text-sm"
                          />
                          <input
                            value={addrLandmark}
                            onChange={(e) => setAddrLandmark(e.target.value)}
                            placeholder="Paas ka nishan (Landmark)"
                            className="w-full px-3 py-2 rounded-lg border border-stone-200 bg-white text-sm"
                          />
                          <div className="grid grid-cols-2 gap-2">
                            <input
                              required
                              value={addrArea}
                              onChange={(e) => setAddrArea(e.target.value)}
                              placeholder="Mohalla / Area *"
                              className="w-full px-3 py-2 rounded-lg border border-stone-200 bg-white text-sm"
                            />
                            <input
                              required
                              maxLength={6}
                              value={addrPin}
                              onChange={(e) => setAddrPin(e.target.value)}
                              placeholder="6 digit PIN *"
                              className="w-full px-3 py-2 rounded-lg border border-stone-200 bg-white text-sm"
                            />
                          </div>
                          <button
                            type="submit"
                            disabled={savingAddress}
                            className="w-full py-2 rounded-lg bg-stone-900 text-white text-xs font-semibold"
                          >
                            {savingAddress ? "Saving..." : "Address Save Karein"}
                          </button>
                        </form>
                      ) : home.addresses.length === 0 ? (
                        <button
                          type="button"
                          onClick={() => setShowAddressForm(true)}
                          className="w-full py-3 rounded-xl border border-dashed border-orange-300 text-orange-700 text-xs font-semibold bg-orange-50/50"
                        >
                          + Delivery address jodein
                        </button>
                      ) : (
                        <div className="space-y-2">
                          {home.addresses.map((addr) => (
                            <label
                              key={addr.id}
                              className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer ${
                                selectedAddressId === addr.id
                                  ? "border-orange-600 bg-orange-50/60"
                                  : "border-stone-200"
                              }`}
                            >
                              <input
                                type="radio"
                                name="address"
                                checked={selectedAddressId === addr.id}
                                onChange={() => setSelectedAddressId(addr.id)}
                                className="mt-1 accent-orange-600"
                              />
                              <div className="text-xs">
                                <p className="font-semibold text-stone-900">
                                  {addr.line1}
                                </p>
                                <p className="text-stone-500">
                                  {addr.landmark ? `${addr.landmark}, ` : ""}
                                  {addr.area} – {addr.pin}
                                </p>
                              </div>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="rounded-xl border border-orange-200 bg-orange-50 p-3 text-xs text-orange-900">
                      Order dene ke liye mobile OTP se login kijiye.
                    </div>
                  )}

                  {/* Notes */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold uppercase tracking-wide text-stone-600">
                      Koi khas baat (Notes)
                    </label>
                    <input
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Jaise: chhutta le aana, gate pe ghanti bajana"
                      className="w-full px-3 py-2 rounded-xl border border-stone-200 text-sm"
                    />
                  </div>
                </>
              )}
            </div>

            {cartLines.length > 0 && (
              <div className="p-5 border-t border-stone-200 bg-stone-50 space-y-3">
                {belowMinOrder && (
                  <p className="text-xs font-medium text-amber-700">
                    Minimum order {paiseToInr(minOrderPaise)} hai (abhi{" "}
                    {paiseToInr(minOrderPaise - cartTotalPaise)} aur chahiye)
                  </p>
                )}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-stone-600">
                    Kul Bill (Cash on Delivery)
                  </span>
                  <span className="text-lg font-bold text-stone-900">
                    {paiseToInr(cartTotalPaise)}
                  </span>
                </div>
                {home?.customer ? (
                  <button
                    disabled={placingOrder || belowMinOrder}
                    onClick={handlePlaceOrder}
                    className="w-full py-3 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-semibold text-sm disabled:opacity-50"
                  >
                    {placingOrder
                      ? "Order bhej rahe hain..."
                      : `Order Confirm Karein · ${paiseToInr(cartTotalPaise)}`}
                  </button>
                ) : (
                  <button
                    onClick={() => setAuthOpen(true)}
                    className="w-full py-3 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-semibold text-sm"
                  >
                    Login with Mobile OTP →
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* My Orders Drawer */}
      {ordersOpen && (
        <div className="fixed inset-0 z-40 bg-black/40 flex justify-end">
          <div className="w-full max-w-lg bg-white h-full flex flex-col shadow-2xl">
            <div className="px-5 py-4 border-b border-stone-200 flex items-center justify-between">
              <div>
                <h2 className="font-bold text-lg text-stone-900">
                  Mere Orders · Order History
                </h2>
                <p className="text-xs text-stone-500">
                  Live dukaan status aur 1-tap reorder
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => loadData(token)}
                  title="Refresh"
                  className="p-2 rounded-xl hover:bg-stone-100"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setOrdersOpen(false)}
                  className="p-2 rounded-xl hover:bg-stone-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {orders.length === 0 ? (
                <div className="py-16 text-center text-stone-500 text-sm">
                  Abhi tak koi order nahi diya hai.
                </div>
              ) : (
                orders.map((order) => {
                  const isCancelled = order.status === "cancelled";
                  const stepIdx = PROGRESS_STEPS.indexOf(
                    order.status as (typeof PROGRESS_STEPS)[number],
                  );
                  const label = STATUS_LABEL[order.status] ?? {
                    en: order.status,
                    hi: order.status,
                  };

                  return (
                    <div
                      key={order.id}
                      className="rounded-2xl border border-stone-200 p-4 space-y-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-xs font-mono font-semibold text-stone-500">
                            #{order.id.slice(-6).toUpperCase()}
                          </span>
                          <h3 className="font-bold text-sm text-stone-900">
                            {label.en} · {label.hi}
                          </h3>
                          <p className="text-xs text-stone-500">
                            {formatIst(order.createdAt)} · {order.slotLabel}
                          </p>
                        </div>
                        <span className="text-sm font-bold text-stone-900">
                          {paiseToInr(order.totalPaise)}
                        </span>
                      </div>

                      {!isCancelled && (
                        <div className="grid grid-cols-5 gap-1 pt-1">
                          {PROGRESS_STEPS.map((st, idx) => (
                            <div key={st} className="space-y-1">
                              <div
                                className={`h-1.5 rounded-full ${
                                  idx <= stepIdx
                                    ? "bg-emerald-600"
                                    : "bg-stone-200"
                                }`}
                              />
                              <p className="text-[10px] text-stone-500 truncate">
                                {STATUS_LABEL[st].en.split(" ")[0]}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="text-xs text-stone-600 space-y-1 bg-stone-50 rounded-xl p-2.5">
                        {order.items.map((item) => (
                          <div
                            key={item.id}
                            className="flex justify-between gap-2"
                          >
                            <span>
                              {item.name} ({item.qty} {item.unit})
                            </span>
                            <span className="font-medium">
                              {paiseToInr(Math.round(item.pricePaise * item.qty))}
                            </span>
                          </div>
                        ))}
                      </div>

                      <div className="flex items-center justify-between gap-2 pt-1">
                        <span className="text-xs text-stone-500 truncate">
                          {order.address
                            ? `${order.address.line1}, ${order.address.area}`
                            : ""}
                        </span>
                        <button
                          onClick={() => handleReorder(order.id)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-800 text-xs font-semibold shrink-0"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Reorder</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* OTP Login Modal */}
      {authOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-bold text-lg text-stone-900">
                  Mobile OTP Login
                </h2>
                <p className="text-xs text-stone-500">
                  Apna Kirana account · {settings?.storeName ?? "Manpur"}
                </p>
              </div>
              <button
                onClick={() => {
                  setAuthOpen(false);
                  setAuthError(null);
                }}
                className="p-1.5 rounded-lg hover:bg-stone-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {authError && (
              <div className="rounded-xl bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700">
                {authError}
              </div>
            )}

            {otpStep === "phone" ? (
              <form onSubmit={handleRequestOtp} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    10-digit Mobile Number
                  </label>
                  <div className="flex items-center rounded-xl border border-stone-200 overflow-hidden">
                    <span className="px-3 py-2.5 bg-stone-50 text-sm text-stone-600 border-r border-stone-200">
                      +91
                    </span>
                    <input
                      type="tel"
                      maxLength={10}
                      value={phoneInput}
                      onChange={(e) => setPhoneInput(e.target.value)}
                      placeholder="9876543210"
                      className="flex-1 px-3 py-2.5 text-sm focus:outline-none"
                      required
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={authBusy}
                  className="w-full py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-semibold text-sm disabled:opacity-50"
                >
                  {authBusy ? "Bhej rahe hain..." : "OTP Bhejein"}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-3">
                {otpHint && (
                  <div className="rounded-xl bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-900">
                    {otpHint}
                  </div>
                )}
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    4-digit OTP (+91 {phoneInput})
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={4}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    placeholder="1234"
                    className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-center tracking-[0.5em] font-mono text-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Aapka Naam (optional)
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Jaise: Ramesh Ji"
                    className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-sm"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setOtpStep("phone")}
                    className="px-3 py-2.5 rounded-xl border border-stone-200 text-xs font-semibold text-stone-700"
                  >
                    Badlein
                  </button>
                  <button
                    type="submit"
                    disabled={authBusy}
                    className="flex-1 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-sm disabled:opacity-50"
                  >
                    {authBusy ? "Checking..." : "Verify & Login"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
