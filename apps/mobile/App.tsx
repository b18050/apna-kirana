import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  SafeAreaView,
  StatusBar as RNStatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { apiFetch } from "./src/api";
import { COLORS, DEFAULT_API_URL, parseSlots } from "./src/constants";
import { AccountScreen } from "./src/screens/AccountScreen";
import { CartScreen } from "./src/screens/CartScreen";
import { OrdersScreen } from "./src/screens/OrdersScreen";
import { ShopScreen } from "./src/screens/ShopScreen";
import { Address, Customer, HomeResponse, Order, Product } from "./src/types";

type Tab = "shop" | "cart" | "orders" | "account";

const TOKEN_KEY = "ak_mobile_token";
const CART_KEY = "ak_mobile_cart";
const API_URL_KEY = "ak_mobile_api_url";

export default function App() {
  const [tab, setTab] = useState<Tab>("shop");
  const [hydrated, setHydrated] = useState(false);
  const [apiUrl, setApiUrl] = useState(DEFAULT_API_URL);
  const [token, setToken] = useState<string | null>(null);
  const [cart, setCart] = useState<Record<string, number>>({});

  const [home, setHome] = useState<HomeResponse | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedAddressId, setSelectedAddressId] = useState("");
  const [selectedSlot, setSelectedSlot] = useState("");

  useEffect(() => {
    Promise.all([
      AsyncStorage.getItem(API_URL_KEY),
      AsyncStorage.getItem(TOKEN_KEY),
      AsyncStorage.getItem(CART_KEY),
    ])
      .then(([savedUrl, savedToken, savedCart]) => {
        if (savedUrl) setApiUrl(savedUrl);
        if (savedToken) setToken(savedToken);
        if (savedCart) {
          const parsed = JSON.parse(savedCart);
          if (parsed && typeof parsed === "object") setCart(parsed);
        }
      })
      .finally(() => setHydrated(true));
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    AsyncStorage.setItem(CART_KEY, JSON.stringify(cart)).catch(() => {});
  }, [cart, hydrated]);

  const loadData = useCallback(async () => {
    if (!hydrated) return;
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<HomeResponse>(apiUrl, "/api/home", {}, token);
      setHome(data);

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

      if (token && data.customer) {
        const oData = await apiFetch<{ orders: Order[] }>(
          apiUrl,
          "/api/orders",
          {},
          token,
        );
        setOrders(oData.orders);
      } else {
        setOrders([]);
        if (token && !data.customer) {
          await AsyncStorage.removeItem(TOKEN_KEY);
          setToken(null);
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Network error");
    } finally {
      setLoading(false);
    }
  }, [apiUrl, token, hydrated]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const updateQty = (product: Product, delta: number) => {
    setCart((prev) => {
      const curr = prev[product.id] ?? 0;
      const next = Math.max(0, Math.min(product.stockQty, curr + delta));
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
      setTab("account");
      return;
    }
    try {
      const res = await apiFetch<{
        available: { productId: string; qty: number }[];
        skipped: string[];
        slotLabel: string;
        addressId: string;
      }>(apiUrl, `/api/orders/${orderId}/reorder`, {}, token);

      const nextCart: Record<string, number> = {};
      for (const item of res.available) {
        nextCart[item.productId] = item.qty;
      }
      setCart(nextCart);
      if (res.addressId) setSelectedAddressId(res.addressId);
      if (res.slotLabel) setSelectedSlot(res.slotLabel);
      setTab("cart");
      if (res.skipped.length > 0) {
        Alert.alert(
          "Cart Updated",
          `Yeh saman abhi stock mein nahi hai: ${res.skipped.join(", ")}`,
        );
      }
    } catch (e) {
      Alert.alert("Reorder Fail", e instanceof Error ? e.message : "Try again");
    }
  };

  const handleAddAddress = async (input: {
    line1: string;
    landmark: string;
    area: string;
    pin: string;
  }) => {
    const res = await apiFetch<{ address: Address }>(
      apiUrl,
      "/api/me/addresses",
      {
        method: "POST",
        body: JSON.stringify(input),
      },
      token,
    );
    setSelectedAddressId(res.address.id);
    await loadData();
    return res.address;
  };

  const handlePlaceOrder = async (notes: string) => {
    const items = Object.entries(cart)
      .filter(([, qty]) => qty > 0)
      .map(([productId, qty]) => ({ productId, qty }));
    await apiFetch(
      apiUrl,
      "/api/orders",
      {
        method: "POST",
        body: JSON.stringify({
          addressId: selectedAddressId,
          slotLabel: selectedSlot,
          items,
          notes,
        }),
      },
      token,
    );
    setCart({});
    setTab("orders");
    await loadData();
    Alert.alert("Order Mil Gaya!", "Dukaan ne aapka order receive kar liya hai.");
  };

  const handleRequestOtp = async (phone: string) => {
    return apiFetch<{ ok: boolean; hint?: string }>(
      apiUrl,
      "/api/auth/otp/request",
      {
        method: "POST",
        body: JSON.stringify({ phone }),
      },
    );
  };

  const handleVerifyOtp = async (
    phone: string,
    code: string,
    name?: string,
  ) => {
    const res = await apiFetch<{ token: string; customer: Customer }>(
      apiUrl,
      "/api/auth/otp/verify",
      {
        method: "POST",
        body: JSON.stringify({ phone, code, name }),
      },
    );
    await AsyncStorage.setItem(TOKEN_KEY, res.token);
    setToken(res.token);
    setTab("shop");
  };

  const handleUpdateName = async (name: string) => {
    await apiFetch(
      apiUrl,
      "/api/me",
      { method: "PUT", body: JSON.stringify({ name }) },
      token,
    );
    await loadData();
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setOrders([]);
  };

  const handleSaveApiUrl = async (url: string) => {
    await AsyncStorage.setItem(API_URL_KEY, url);
    setApiUrl(url);
  };

  const cartCount = useMemo(
    () => Object.values(cart).reduce((sum, n) => sum + (n > 0 ? n : 0), 0),
    [cart],
  );

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="dark" />
      <View style={styles.body}>
        {tab === "shop" && (
          <ShopScreen
            home={home}
            loading={loading}
            error={error}
            cart={cart}
            onRefresh={loadData}
            onUpdateQty={updateQty}
            onReorder={handleReorder}
            onGoCart={() => setTab("cart")}
            onGoOrders={() => setTab("orders")}
            onGoAccount={() => setTab("account")}
          />
        )}
        {tab === "cart" && (
          <CartScreen
            home={home}
            token={token}
            cart={cart}
            selectedAddressId={selectedAddressId}
            selectedSlot={selectedSlot}
            onSelectAddress={setSelectedAddressId}
            onSelectSlot={setSelectedSlot}
            onUpdateQty={updateQty}
            onAddAddress={handleAddAddress}
            onPlaceOrder={handlePlaceOrder}
            onGoLogin={() => setTab("account")}
          />
        )}
        {tab === "orders" && (
          <OrdersScreen
            token={token}
            orders={orders}
            loading={loading}
            onRefresh={loadData}
            onReorder={handleReorder}
            onGoLogin={() => setTab("account")}
          />
        )}
        {tab === "account" && (
          <AccountScreen
            apiUrl={apiUrl}
            customer={home?.customer ?? null}
            addresses={home?.addresses ?? []}
            onSaveApiUrl={handleSaveApiUrl}
            onRequestOtp={handleRequestOtp}
            onVerifyOtp={handleVerifyOtp}
            onUpdateName={handleUpdateName}
            onLogout={handleLogout}
          />
        )}
      </View>

      <View style={styles.tabBar}>
        <TabButton
          active={tab === "shop"}
          icon="storefront-outline"
          label="Dukaan"
          onPress={() => setTab("shop")}
        />
        <TabButton
          active={tab === "cart"}
          icon="bag-handle-outline"
          label={cartCount > 0 ? `Thela (${cartCount})` : "Thela"}
          onPress={() => setTab("cart")}
        />
        <TabButton
          active={tab === "orders"}
          icon="receipt-outline"
          label="Orders"
          onPress={() => setTab("orders")}
        />
        <TabButton
          active={tab === "account"}
          icon="person-outline"
          label="Account"
          onPress={() => setTab("account")}
        />
      </View>
    </SafeAreaView>
  );
}

function TabButton({
  active,
  icon,
  label,
  onPress,
}: {
  active: boolean;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}) {
  const color = active ? COLORS.primary : COLORS.muted;
  return (
    <TouchableOpacity style={styles.tabBtn} onPress={onPress}>
      <Ionicons name={icon} size={20} color={color} />
      <Text style={[styles.tabLabel, { color }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.card,
    paddingTop: RNStatusBar.currentHeight ?? 0,
  },
  body: { flex: 1, backgroundColor: COLORS.bg },
  tabBar: {
    flexDirection: "row",
    backgroundColor: COLORS.card,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingVertical: 8,
  },
  tabBtn: { flex: 1, alignItems: "center", gap: 2 },
  tabLabel: { fontSize: 11, fontWeight: "600" },
});
