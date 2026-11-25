import React from "react";
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  COLORS,
  PROGRESS_STEPS,
  STATUS_LABEL,
  formatIst,
  paiseToInr,
} from "../constants";
import { Order } from "../types";

interface OrdersScreenProps {
  token: string | null;
  orders: Order[];
  loading: boolean;
  onRefresh: () => void;
  onReorder: (orderId: string) => void;
  onGoLogin: () => void;
}

export function OrdersScreen({
  token,
  orders,
  loading,
  onRefresh,
  onReorder,
  onGoLogin,
}: OrdersScreenProps) {
  return (
    <View style={styles.screen}>
      <View style={styles.topBar}>
        <Text style={styles.title}>Mere Orders</Text>
        <Text style={styles.sub}>Live dukaan status aur 1-tap reorder</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={onRefresh} />
        }
      >
        {!token ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>
              Apne orders dekhne ke liye Mobile OTP se login karein.
            </Text>
            <TouchableOpacity style={styles.loginBtn} onPress={onGoLogin}>
              <Text style={styles.loginBtnText}>Login with OTP</Text>
            </TouchableOpacity>
          </View>
        ) : orders.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>
              Abhi tak koi order nahi diya hai.
            </Text>
          </View>
        ) : (
          orders.map((order) => {
            const label = STATUS_LABEL[order.status] ?? {
              en: order.status,
              hi: order.status,
            };
            const isCancelled = order.status === "cancelled";
            const stepIdx = PROGRESS_STEPS.indexOf(
              order.status as (typeof PROGRESS_STEPS)[number],
            );

            return (
              <View key={order.id} style={styles.card}>
                <View style={styles.rowBetween}>
                  <View>
                    <Text style={styles.orderId}>
                      #{order.id.slice(-6).toUpperCase()}
                    </Text>
                    <Text style={styles.statusTitle}>
                      {label.en} · {label.hi}
                    </Text>
                    <Text style={styles.meta}>
                      {formatIst(order.createdAt)} · {order.slotLabel}
                    </Text>
                  </View>
                  <Text style={styles.total}>{paiseToInr(order.totalPaise)}</Text>
                </View>

                {!isCancelled && (
                  <View style={styles.progressRow}>
                    {PROGRESS_STEPS.map((st, idx) => (
                      <View key={st} style={styles.progressCol}>
                        <View
                          style={[
                            styles.progressBar,
                            idx <= stepIdx && styles.progressBarActive,
                          ]}
                        />
                        <Text style={styles.progressLabel} numberOfLines={1}>
                          {STATUS_LABEL[st].en.split(" ")[0]}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}

                <View style={styles.itemsBox}>
                  {order.items.map((item) => (
                    <View key={item.id} style={styles.rowBetween}>
                      <Text style={styles.itemTxt}>
                        {item.name} ({item.qty} {item.unit})
                      </Text>
                      <Text style={styles.itemTxt}>
                        {paiseToInr(Math.round(item.pricePaise * item.qty))}
                      </Text>
                    </View>
                  ))}
                </View>

                <View style={styles.rowBetween}>
                  <Text style={styles.addrTxt} numberOfLines={1}>
                    {order.address
                      ? `${order.address.line1}, ${order.address.area}`
                      : ""}
                  </Text>
                  <TouchableOpacity
                    style={styles.reorderBtn}
                    onPress={() => onReorder(order.id)}
                  >
                    <Ionicons name="refresh" size={14} color={COLORS.primary} />
                    <Text style={styles.reorderTxt}>Reorder</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
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
  emptyCard: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 28,
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  emptyText: { fontSize: 13, color: COLORS.muted, textAlign: "center" },
  loginBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
  },
  loginBtnText: { color: "#fff", fontSize: 13, fontWeight: "700" },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 10,
  },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 8,
  },
  orderId: { fontSize: 11, fontWeight: "700", color: COLORS.muted },
  statusTitle: { fontSize: 14, fontWeight: "700", color: COLORS.text },
  meta: { fontSize: 11, color: COLORS.muted, marginTop: 2 },
  total: { fontSize: 15, fontWeight: "700", color: COLORS.text },
  progressRow: { flexDirection: "row", gap: 4 },
  progressCol: { flex: 1, gap: 3 },
  progressBar: { height: 5, borderRadius: 3, backgroundColor: COLORS.border },
  progressBarActive: { backgroundColor: COLORS.green },
  progressLabel: { fontSize: 9, color: COLORS.muted },
  itemsBox: {
    backgroundColor: COLORS.bg,
    borderRadius: 10,
    padding: 10,
    gap: 4,
  },
  itemTxt: { fontSize: 12, color: COLORS.text },
  addrTxt: { fontSize: 11, color: COLORS.muted, flex: 1 },
  reorderBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: COLORS.primarySoft,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  reorderTxt: { fontSize: 12, fontWeight: "700", color: COLORS.primary },
});
