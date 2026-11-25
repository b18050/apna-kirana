import React, { useMemo, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { COLORS, isValidPin, paiseToInr, parseSlots } from "../constants";
import { Address, HomeResponse, Product } from "../types";

interface CartScreenProps {
  home: HomeResponse | null;
  token: string | null;
  cart: Record<string, number>;
  selectedAddressId: string;
  selectedSlot: string;
  onSelectAddress: (id: string) => void;
  onSelectSlot: (slot: string) => void;
  onUpdateQty: (product: Product, delta: number) => void;
  onAddAddress: (input: {
    line1: string;
    landmark: string;
    area: string;
    pin: string;
  }) => Promise<Address>;
  onPlaceOrder: (notes: string) => Promise<void>;
  onGoLogin: () => void;
}

export function CartScreen({
  home,
  token,
  cart,
  selectedAddressId,
  selectedSlot,
  onSelectAddress,
  onSelectSlot,
  onUpdateQty,
  onAddAddress,
  onPlaceOrder,
  onGoLogin,
}: CartScreenProps) {
  const [notes, setNotes] = useState("");
  const [placing, setPlacing] = useState(false);
  const [showAddrForm, setShowAddrForm] = useState(false);
  const [line1, setLine1] = useState("");
  const [landmark, setLandmark] = useState("");
  const [area, setArea] = useState("");
  const [pin, setPin] = useState("");
  const [savingAddr, setSavingAddr] = useState(false);

  const products = home?.products ?? [];
  const lines = useMemo(() => {
    const out: { product: Product; qty: number; linePaise: number }[] = [];
    for (const p of products) {
      const qty = cart[p.id] ?? 0;
      if (qty > 0) {
        out.push({ product: p, qty, linePaise: Math.round(p.pricePaise * qty) });
      }
    }
    return out;
  }, [products, cart]);

  const totalPaise = useMemo(
    () => lines.reduce((sum, l) => sum + l.linePaise, 0),
    [lines],
  );
  const minOrderPaise = home?.settings?.minOrderPaise ?? 0;
  const belowMin = totalPaise < minOrderPaise;
  const slots = parseSlots(home?.settings?.slotsJson);

  const handleSaveAddress = async () => {
    if (!line1.trim() || !area.trim() || !isValidPin(pin.trim())) {
      Alert.alert("Address Adhoora Hai", "Ghar, area aur 6 digit PIN zaroori hai");
      return;
    }
    setSavingAddr(true);
    try {
      await onAddAddress({
        line1: line1.trim(),
        landmark: landmark.trim(),
        area: area.trim(),
        pin: pin.trim(),
      });
      setShowAddrForm(false);
      setLine1("");
      setLandmark("");
      setArea("");
      setPin("");
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Address save fail");
    } finally {
      setSavingAddr(false);
    }
  };

  const handleConfirm = async () => {
    if (!token || !home?.customer) {
      onGoLogin();
      return;
    }
    if (!selectedAddressId) {
      setShowAddrForm(true);
      Alert.alert("Address Chahiye", "Delivery ke liye address add kijiye");
      return;
    }
    if (belowMin) {
      Alert.alert(
        "Minimum Order",
        `Minimum order ${paiseToInr(minOrderPaise)} hona chahiye`,
      );
      return;
    }
    setPlacing(true);
    try {
      await onPlaceOrder(notes.trim());
      setNotes("");
    } catch (e) {
      Alert.alert("Order Fail", e instanceof Error ? e.message : "Try again");
    } finally {
      setPlacing(false);
    }
  };

  return (
    <View style={styles.screen}>
      <View style={styles.topBar}>
        <Text style={styles.title}>Aapka Thela · Cart</Text>
        <Text style={styles.sub}>Cash on Delivery (COD)</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {lines.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>
              Abhi thela khali hai. Shop tab se saman add kijiye!
            </Text>
          </View>
        ) : (
          <>
            <View style={styles.card}>
              {lines.map(({ product, qty, linePaise }) => (
                <View key={product.id} style={styles.lineRow}>
                  <Text style={styles.lineEmoji}>{product.imageEmoji}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.lineName}>{product.name}</Text>
                    <Text style={styles.lineMeta}>
                      {paiseToInr(product.pricePaise)} / {product.unit}
                    </Text>
                  </View>
                  <View style={styles.stepper}>
                    <TouchableOpacity onPress={() => onUpdateQty(product, -1)}>
                      <Text style={styles.stepTxt}>-</Text>
                    </TouchableOpacity>
                    <Text style={styles.stepQty}>{qty}</Text>
                    <TouchableOpacity
                      disabled={qty >= product.stockQty}
                      onPress={() => onUpdateQty(product, 1)}
                    >
                      <Text style={styles.stepTxt}>+</Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.lineTotal}>{paiseToInr(linePaise)}</Text>
                </View>
              ))}
            </View>

            <View style={styles.card}>
              <Text style={styles.sectionLabel}>Delivery Slot</Text>
              <View style={styles.slotGrid}>
                {slots.map((slot) => (
                  <TouchableOpacity
                    key={slot}
                    onPress={() => onSelectSlot(slot)}
                    style={[
                      styles.slotChip,
                      selectedSlot === slot && styles.slotChipActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.slotText,
                        selectedSlot === slot && styles.slotTextActive,
                      ]}
                    >
                      {slot}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.card}>
              <View style={styles.rowBetween}>
                <Text style={styles.sectionLabel}>Delivery Address</Text>
                {home?.customer && (
                  <TouchableOpacity onPress={() => setShowAddrForm((v) => !v)}>
                    <Text style={styles.link}>
                      {showAddrForm ? "Cancel" : "+ Naya Address"}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              {!home?.customer ? (
                <TouchableOpacity style={styles.loginPrompt} onPress={onGoLogin}>
                  <Text style={styles.loginPromptText}>
                    Address aur order ke liye Mobile OTP se login karein →
                  </Text>
                </TouchableOpacity>
              ) : showAddrForm ? (
                <View style={styles.form}>
                  <TextInput
                    value={line1}
                    onChangeText={setLine1}
                    placeholder="Ghar / Makan number, gali *"
                    style={styles.input}
                  />
                  <TextInput
                    value={landmark}
                    onChangeText={setLandmark}
                    placeholder="Paas ka nishan (Landmark)"
                    style={styles.input}
                  />
                  <View style={styles.twoCol}>
                    <TextInput
                      value={area}
                      onChangeText={setArea}
                      placeholder="Area / Mohalla *"
                      style={[styles.input, { flex: 1 }]}
                    />
                    <TextInput
                      value={pin}
                      onChangeText={setPin}
                      keyboardType="number-pad"
                      maxLength={6}
                      placeholder="PIN *"
                      style={[styles.input, { width: 100 }]}
                    />
                  </View>
                  <TouchableOpacity
                    style={styles.saveAddrBtn}
                    disabled={savingAddr}
                    onPress={handleSaveAddress}
                  >
                    <Text style={styles.saveAddrTxt}>
                      {savingAddr ? "Saving..." : "Address Save Karein"}
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (home.addresses ?? []).length === 0 ? (
                <TouchableOpacity
                  style={styles.loginPrompt}
                  onPress={() => setShowAddrForm(true)}
                >
                  <Text style={styles.loginPromptText}>
                    + Delivery address jodein
                  </Text>
                </TouchableOpacity>
              ) : (
                <View style={{ gap: 8 }}>
                  {home.addresses.map((addr) => (
                    <TouchableOpacity
                      key={addr.id}
                      onPress={() => onSelectAddress(addr.id)}
                      style={[
                        styles.addrItem,
                        selectedAddressId === addr.id && styles.addrItemActive,
                      ]}
                    >
                      <Text style={styles.addrLine}>{addr.line1}</Text>
                      <Text style={styles.addrSub}>
                        {addr.landmark ? `${addr.landmark}, ` : ""}
                        {addr.area} – {addr.pin}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            <View style={styles.card}>
              <Text style={styles.sectionLabel}>Notes (Optional)</Text>
              <TextInput
                value={notes}
                onChangeText={setNotes}
                placeholder="Gate pe ghanti bajana, chhutta le aana..."
                style={styles.input}
              />
            </View>
          </>
        )}
      </ScrollView>

      {lines.length > 0 && (
        <View style={styles.footer}>
          {belowMin && (
            <Text style={styles.minWarn}>
              Minimum order {paiseToInr(minOrderPaise)} chahiye
            </Text>
          )}
          <View style={styles.rowBetween}>
            <Text style={styles.totalLabel}>Kul Bill (COD)</Text>
            <Text style={styles.totalVal}>{paiseToInr(totalPaise)}</Text>
          </View>
          <TouchableOpacity
            disabled={placing || (Boolean(token) && belowMin)}
            onPress={handleConfirm}
            style={[styles.confirmBtn, placing && { opacity: 0.6 }]}
          >
            <Text style={styles.confirmBtnText}>
              {!token
                ? "OTP se Login Karein →"
                : placing
                  ? "Order bhej rahe hain..."
                  : `Order Confirm Karein · ${paiseToInr(totalPaise)}`}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.bg },
  topBar: {
    backgroundColor: COLORS.card,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  title: { fontSize: 18, fontWeight: "700", color: COLORS.text },
  sub: { fontSize: 12, color: COLORS.muted, marginTop: 2 },
  content: { padding: 16, gap: 12 },
  emptyBox: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 32,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  emptyText: { color: COLORS.muted, fontSize: 13, textAlign: "center" },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 10,
  },
  lineRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  lineEmoji: { fontSize: 22 },
  lineName: { fontSize: 13, fontWeight: "700", color: COLORS.text },
  lineMeta: { fontSize: 11, color: COLORS.muted },
  stepper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.bg,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 10,
  },
  stepTxt: { fontSize: 15, fontWeight: "700", color: COLORS.primary },
  stepQty: { fontSize: 13, fontWeight: "700", color: COLORS.text },
  lineTotal: { width: 64, textAlign: "right", fontSize: 13, fontWeight: "700" },
  sectionLabel: { fontSize: 12, fontWeight: "700", color: COLORS.muted, textTransform: "uppercase" },
  slotGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  slotChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.bg,
  },
  slotChipActive: { backgroundColor: COLORS.primarySoft, borderColor: COLORS.primary },
  slotText: { fontSize: 12, fontWeight: "600", color: COLORS.text },
  slotTextActive: { color: COLORS.primary },
  rowBetween: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  link: { fontSize: 12, fontWeight: "700", color: COLORS.primary },
  loginPrompt: {
    backgroundColor: COLORS.primarySoft,
    borderWidth: 1,
    borderColor: COLORS.primaryBorder,
    borderRadius: 10,
    padding: 12,
  },
  loginPromptText: { fontSize: 12, fontWeight: "600", color: COLORS.primary },
  form: { gap: 8 },
  twoCol: { flexDirection: "row", gap: 8 },
  input: {
    backgroundColor: COLORS.bg,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13,
  },
  saveAddrBtn: {
    backgroundColor: COLORS.text,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  saveAddrTxt: { color: "#fff", fontSize: 12, fontWeight: "700" },
  addrItem: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    padding: 10,
  },
  addrItemActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primarySoft },
  addrLine: { fontSize: 13, fontWeight: "700", color: COLORS.text },
  addrSub: { fontSize: 11, color: COLORS.muted, marginTop: 2 },
  footer: {
    backgroundColor: COLORS.card,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    padding: 16,
    gap: 10,
  },
  minWarn: { fontSize: 12, color: "#B45309", fontWeight: "600" },
  totalLabel: { fontSize: 14, color: COLORS.muted, fontWeight: "600" },
  totalVal: { fontSize: 18, fontWeight: "700", color: COLORS.text },
  confirmBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  confirmBtnText: { color: "#fff", fontSize: 14, fontWeight: "700" },
});
