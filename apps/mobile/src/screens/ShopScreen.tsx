import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { CATEGORIES, COLORS, STATUS_LABEL, paiseToInr } from "../constants";
import { HomeResponse, Product } from "../types";

interface ShopScreenProps {
  home: HomeResponse | null;
  loading: boolean;
  error: string | null;
  cart: Record<string, number>;
  onRefresh: () => void;
  onUpdateQty: (product: Product, delta: number) => void;
  onReorder: (orderId: string) => void;
  onGoCart: () => void;
  onGoOrders: () => void;
  onGoAccount: () => void;
}

export function ShopScreen({
  home,
  loading,
  error,
  cart,
  onRefresh,
  onUpdateQty,
  onReorder,
  onGoCart,
  onGoOrders,
  onGoAccount,
}: ShopScreenProps) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");

  const products = home?.products ?? [];

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => {
      if (category !== "all" && p.category !== category) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.nameHi.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
      );
    });
  }, [products, category, query]);

  const { cartCount, cartTotalPaise } = useMemo(() => {
    let count = 0;
    let total = 0;
    for (const p of products) {
      const qty = cart[p.id] ?? 0;
      if (qty > 0) {
        count += qty;
        total += Math.round(p.pricePaise * qty);
      }
    }
    return { cartCount: count, cartTotalPaise: total };
  }, [products, cart]);

  const settings = home?.settings;

  return (
    <View style={styles.screen}>
      {/* Top Store Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View style={styles.brandRow}>
            <View style={styles.logoBox}>
              <Ionicons name="storefront" size={20} color="#fff" />
            </View>
            <View>
              <Text style={styles.storeName}>
                {settings?.storeName ?? "Apna Kirana"}{" "}
                <Text style={styles.storeNameHi}>
                  · {settings?.storeNameHi ?? "अपना किराना"}
                </Text>
              </Text>
              <Text style={styles.storeMeta}>
                {settings?.area ?? "Manpur"} ({settings?.pin ?? "823003"}) ·{" "}
                {settings?.hours ?? "Subah 8 – raat 9"}
              </Text>
            </View>
          </View>

          <TouchableOpacity style={styles.accountPill} onPress={onGoAccount}>
            <Ionicons name="person-circle-outline" size={18} color={COLORS.primary} />
            <Text style={styles.accountPillText}>
              {home?.customer ? home.customer.name : "Login"}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.searchWrap}>
          <Ionicons name="search" size={16} color={COLORS.muted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Atta, chawal, doodh, tel, pyaaz..."
            placeholderTextColor={COLORS.muted}
            style={styles.searchInput}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery("")}>
              <Ionicons name="close-circle" size={16} color={COLORS.muted} />
            </TouchableOpacity>
          )}
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.catRow}
        >
          <TouchableOpacity
            onPress={() => setCategory("all")}
            style={[
              styles.catChip,
              category === "all" && styles.catChipActiveDark,
            ]}
          >
            <Text
              style={[
                styles.catText,
                category === "all" && styles.catTextActive,
              ]}
            >
              Sab Saman
            </Text>
          </TouchableOpacity>
          {CATEGORIES.map((c) => (
            <TouchableOpacity
              key={c.id}
              onPress={() => setCategory(c.id)}
              style={[
                styles.catChip,
                category === c.id && styles.catChipActive,
              ]}
            >
              <Text
                style={[
                  styles.catText,
                  category === c.id && styles.catTextActive,
                ]}
              >
                {c.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={onRefresh} />
        }
      >
        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorTitle}>Dukaan se connect nahi ho paya</Text>
            <Text style={styles.errorText}>{error}</Text>
            <View style={styles.errorActions}>
              <TouchableOpacity style={styles.retryBtn} onPress={onRefresh}>
                <Text style={styles.retryBtnText}>Retry</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.serverBtn} onPress={onGoAccount}>
                <Text style={styles.serverBtnText}>Server URL Check Karein</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}

        {/* Active Offer */}
        {home?.offer?.isActive && (
          <View style={styles.offerBanner}>
            <Text style={styles.offerTitle}>
              {home.offer.title} · {home.offer.titleHi}
            </Text>
            <Text style={styles.offerBody}>{home.offer.body}</Text>
          </View>
        )}

        {/* Open Order Banner */}
        {home?.openOrders && home.openOrders.length > 0 && (
          <TouchableOpacity style={styles.openOrderCard} onPress={onGoOrders}>
            <View style={{ flex: 1 }}>
              <Text style={styles.openOrderKicker}>CHALU ORDER · LIVE</Text>
              <Text style={styles.openOrderTitle}>
                #{home.openOrders[0].id.slice(-6).toUpperCase()} ·{" "}
                {STATUS_LABEL[home.openOrders[0].status]?.en ??
                  home.openOrders[0].status}
              </Text>
            </View>
            <Text style={styles.openOrderCta}>Track →</Text>
          </TouchableOpacity>
        )}

        {/* Repeat Last Order */}
        {home?.lastOrder && (
          <View style={styles.repeatCard}>
            <View style={{ flex: 1 }}>
              <Text style={styles.repeatKicker}>PICHHLA ORDER</Text>
              <Text style={styles.repeatTitle}>
                {home.lastOrder.items.length} items ·{" "}
                {paiseToInr(home.lastOrder.totalPaise)}
              </Text>
              <Text style={styles.repeatItems} numberOfLines={1}>
                {home.lastOrder.items
                  .map((i) => `${i.name} × ${i.qty}`)
                  .join(", ")}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.repeatBtn}
              onPress={() => onReorder(home.lastOrder!.id)}
            >
              <Ionicons name="refresh" size={14} color={COLORS.primary} />
              <Text style={styles.repeatBtnText}>Dobara</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Your Usuals */}
        {home?.usuals && home.usuals.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Aapka Rozana Saman</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {home.usuals.map((p) => {
                const qty = cart[p.id] ?? 0;
                return (
                  <View key={p.id} style={styles.usualCard}>
                    <Text style={styles.usualEmoji}>{p.imageEmoji}</Text>
                    <Text style={styles.usualName} numberOfLines={1}>
                      {p.name}
                    </Text>
                    <Text style={styles.usualPrice}>
                      {paiseToInr(p.pricePaise)}/{p.unit}
                    </Text>
                    {qty > 0 ? (
                      <View style={styles.stepperSmall}>
                        <TouchableOpacity onPress={() => onUpdateQty(p, -1)}>
                          <Text style={styles.stepperBtnTxt}>-</Text>
                        </TouchableOpacity>
                        <Text style={styles.stepperQtyTxt}>{qty}</Text>
                        <TouchableOpacity onPress={() => onUpdateQty(p, 1)}>
                          <Text style={styles.stepperBtnTxt}>+</Text>
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <TouchableOpacity
                        style={styles.addBtnSmall}
                        onPress={() => onUpdateQty(p, 1)}
                      >
                        <Text style={styles.addBtnSmallText}>+ Add</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* Product List */}
        {loading && products.length === 0 ? (
          <View style={styles.loader}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        ) : filtered.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>Koi saman nahi mila.</Text>
          </View>
        ) : (
          <View style={styles.grid}>
            {filtered.map((p) => {
              const qty = cart[p.id] ?? 0;
              const out = p.stockQty <= 0;
              const low = p.stockQty > 0 && p.stockQty <= 5;
              return (
                <View key={p.id} style={styles.productCard}>
                  <View style={styles.productLeft}>
                    <View style={styles.emojiBox}>
                      <Text style={styles.emoji}>{p.imageEmoji}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.productName}>{p.name}</Text>
                      <Text style={styles.productMeta}>
                        {p.nameHi} · 1 {p.unit}
                      </Text>
                      {out ? (
                        <Text style={styles.outStock}>Khatam (Out of stock)</Text>
                      ) : low ? (
                        <Text style={styles.lowStock}>
                          Sirf {p.stockQty} {p.unit} bache
                        </Text>
                      ) : null}
                    </View>
                  </View>

                  <View style={styles.productRight}>
                    <View style={styles.priceCol}>
                      <Text style={styles.price}>
                        {paiseToInr(p.pricePaise)}
                      </Text>
                      {p.mrpPaise > p.pricePaise && (
                        <Text style={styles.mrp}>
                          {paiseToInr(p.mrpPaise)}
                        </Text>
                      )}
                    </View>

                    {qty > 0 ? (
                      <View style={styles.stepper}>
                        <TouchableOpacity
                          style={styles.stepperHit}
                          onPress={() => onUpdateQty(p, -1)}
                        >
                          <Text style={styles.stepperBtnTxt}>-</Text>
                        </TouchableOpacity>
                        <Text style={styles.stepperQtyTxt}>{qty}</Text>
                        <TouchableOpacity
                          style={styles.stepperHit}
                          disabled={qty >= p.stockQty}
                          onPress={() => onUpdateQty(p, 1)}
                        >
                          <Text style={styles.stepperBtnTxt}>+</Text>
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <TouchableOpacity
                        disabled={out}
                        onPress={() => onUpdateQty(p, 1)}
                        style={[styles.addBtn, out && styles.addBtnDisabled]}
                      >
                        <Text style={styles.addBtnText}>+ Add</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {cartCount > 0 && (
        <TouchableOpacity style={styles.floatingCart} onPress={onGoCart}>
          <Text style={styles.floatingCartText}>
            {cartCount} items · {paiseToInr(cartTotalPaise)}
          </Text>
          <Text style={styles.floatingCartCta}>Thela Dekhein →</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    backgroundColor: COLORS.card,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: 10,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  logoBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  storeName: { fontSize: 16, fontWeight: "700", color: COLORS.text },
  storeNameHi: { fontSize: 13, fontWeight: "600", color: COLORS.primary },
  storeMeta: { fontSize: 11, color: COLORS.muted, marginTop: 1 },
  accountPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: COLORS.primarySoft,
    borderWidth: 1,
    borderColor: COLORS.primaryBorder,
  },
  accountPillText: { fontSize: 12, fontWeight: "600", color: COLORS.primary },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: COLORS.bg,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchInput: { flex: 1, fontSize: 14, color: COLORS.text, padding: 0 },
  catRow: { gap: 8, paddingVertical: 2 },
  catChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 18,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  catChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  catChipActiveDark: { backgroundColor: COLORS.text, borderColor: COLORS.text },
  catText: { fontSize: 12, fontWeight: "600", color: COLORS.text },
  catTextActive: { color: "#fff" },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, gap: 12, paddingBottom: 88 },
  errorBox: {
    backgroundColor: "#FEF2F2",
    borderColor: "#FECACA",
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    gap: 6,
  },
  errorTitle: { fontSize: 14, fontWeight: "700", color: "#991B1B" },
  errorText: { fontSize: 12, color: "#B91C1C" },
  errorActions: { flexDirection: "row", gap: 10, marginTop: 4 },
  retryBtn: {
    backgroundColor: "#DC2626",
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 10,
  },
  retryBtnText: { color: "#fff", fontSize: 12, fontWeight: "700" },
  serverBtn: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#FCA5A5",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
  },
  serverBtnText: { color: "#991B1B", fontSize: 12, fontWeight: "600" },
  offerBanner: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    padding: 14,
  },
  offerTitle: { color: "#fff", fontWeight: "700", fontSize: 14 },
  offerBody: { color: "#FFEDD5", fontSize: 12, marginTop: 2 },
  openOrderCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.greenSoft,
    borderWidth: 1,
    borderColor: "#A7F3D0",
    borderRadius: 14,
    padding: 12,
  },
  openOrderKicker: { fontSize: 10, fontWeight: "700", color: COLORS.green },
  openOrderTitle: { fontSize: 13, fontWeight: "700", color: COLORS.text, marginTop: 2 },
  openOrderCta: { fontSize: 12, fontWeight: "700", color: COLORS.green },
  repeatCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.primaryBorder,
    borderRadius: 14,
    padding: 12,
  },
  repeatKicker: { fontSize: 10, fontWeight: "700", color: COLORS.primary },
  repeatTitle: { fontSize: 14, fontWeight: "700", color: COLORS.text },
  repeatItems: { fontSize: 11, color: COLORS.muted, marginTop: 2 },
  repeatBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: COLORS.primarySoft,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.primaryBorder,
  },
  repeatBtnText: { fontSize: 12, fontWeight: "700", color: COLORS.primary },
  section: { gap: 8 },
  sectionTitle: { fontSize: 13, fontWeight: "700", color: COLORS.text },
  usualCard: {
    width: 128,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    padding: 10,
    marginRight: 10,
    gap: 4,
  },
  usualEmoji: { fontSize: 24 },
  usualName: { fontSize: 12, fontWeight: "600", color: COLORS.text },
  usualPrice: { fontSize: 11, color: COLORS.muted },
  addBtnSmall: {
    marginTop: 4,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.primaryBorder,
    backgroundColor: COLORS.primarySoft,
    alignItems: "center",
  },
  addBtnSmallText: { fontSize: 11, fontWeight: "700", color: COLORS.primary },
  stepperSmall: {
    marginTop: 4,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  loader: { paddingVertical: 48, alignItems: "center" },
  emptyBox: {
    padding: 32,
    alignItems: "center",
    backgroundColor: COLORS.card,
    borderRadius: 14,
  },
  emptyText: { color: COLORS.muted, fontSize: 13 },
  grid: { gap: 10 },
  productCard: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  productLeft: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  emojiBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: COLORS.bg,
    alignItems: "center",
    justifyContent: "center",
  },
  emoji: { fontSize: 24 },
  productName: { fontSize: 14, fontWeight: "700", color: COLORS.text },
  productMeta: { fontSize: 12, color: COLORS.muted, marginTop: 1 },
  outStock: { fontSize: 11, fontWeight: "600", color: COLORS.danger, marginTop: 2 },
  lowStock: { fontSize: 11, fontWeight: "600", color: "#B45309", marginTop: 2 },
  productRight: { alignItems: "flex-end", gap: 6 },
  priceCol: { alignItems: "flex-end" },
  price: { fontSize: 15, fontWeight: "700", color: COLORS.text },
  mrp: { fontSize: 11, color: COLORS.muted, textDecorationLine: "line-through" },
  addBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.primaryBorder,
    backgroundColor: COLORS.primarySoft,
  },
  addBtnDisabled: { opacity: 0.4 },
  addBtnText: { fontSize: 12, fontWeight: "700", color: COLORS.primary },
  stepper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 5,
    gap: 10,
  },
  stepperHit: { paddingHorizontal: 4 },
  stepperBtnTxt: { color: "#fff", fontSize: 15, fontWeight: "700" },
  stepperQtyTxt: { color: "#fff", fontSize: 13, fontWeight: "700" },
  floatingCart: {
    position: "absolute",
    bottom: 12,
    left: 16,
    right: 16,
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  floatingCartText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  floatingCartCta: { color: "#fff", fontWeight: "700", fontSize: 14 },
});
