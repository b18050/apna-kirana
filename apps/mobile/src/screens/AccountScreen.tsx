import React, { useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { COLORS, isValidInPhone } from "../constants";
import { Address, Customer } from "../types";

interface AccountScreenProps {
  apiUrl: string;
  customer: Customer | null;
  addresses: Address[];
  onSaveApiUrl: (url: string) => Promise<void>;
  onRequestOtp: (phone: string) => Promise<{ hint?: string }>;
  onVerifyOtp: (phone: string, code: string, name?: string) => Promise<void>;
  onUpdateName: (name: string) => Promise<void>;
  onLogout: () => Promise<void>;
}

export function AccountScreen({
  apiUrl,
  customer,
  addresses,
  onSaveApiUrl,
  onRequestOtp,
  onVerifyOtp,
  onUpdateName,
  onLogout,
}: AccountScreenProps) {
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [nameInput, setNameInput] = useState("");
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [hint, setHint] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [editName, setEditName] = useState(customer?.name ?? "");
  const [urlInput, setUrlInput] = useState(apiUrl);

  const handleSendOtp = async () => {
    const cleaned = phone.replace(/\D/g, "").slice(-10);
    if (!isValidInPhone(cleaned)) {
      Alert.alert("Galat Number", "Sahi 10 digit Indian mobile daaliye");
      return;
    }
    setBusy(true);
    try {
      const res = await onRequestOtp(cleaned);
      setPhone(cleaned);
      setHint(res.hint ?? "OTP bhej diya");
      setStep("otp");
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "OTP request fail");
    } finally {
      setBusy(false);
    }
  };

  const handleVerify = async () => {
    if (!code.trim()) {
      Alert.alert("OTP Chahiye", "4 digit OTP daaliye");
      return;
    }
    setBusy(true);
    try {
      await onVerifyOtp(phone, code.trim(), nameInput.trim() || undefined);
      setStep("phone");
      setCode("");
      setHint(null);
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "OTP galat hai");
    } finally {
      setBusy(false);
    }
  };

  const handleSaveName = async () => {
    if (!editName.trim()) return;
    setBusy(true);
    try {
      await onUpdateName(editName.trim());
      Alert.alert("Saved", "Naam update ho gaya");
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Update fail");
    } finally {
      setBusy(false);
    }
  };

  const handleSaveUrl = async () => {
    const trimmed = urlInput.trim().replace(/\/+$/, "");
    if (!trimmed) return;
    await onSaveApiUrl(trimmed);
    Alert.alert("Server Updated", `Connected to ${trimmed}`);
  };

  return (
    <View style={styles.screen}>
      <View style={styles.topBar}>
        <Text style={styles.title}>Account · Khata</Text>
        <Text style={styles.sub}>Mobile OTP login aur server connection</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {customer ? (
          <>
            <View style={styles.card}>
              <Text style={styles.kicker}>LOGGED IN GRAHAK</Text>
              <Text style={styles.nameBig}>{customer.name}</Text>
              <Text style={styles.phoneTxt}>+91 {customer.phone}</Text>

              <View style={styles.nameRow}>
                <TextInput
                  value={editName}
                  onChangeText={setEditName}
                  placeholder="Apna naam badlein"
                  style={[styles.input, { flex: 1 }]}
                />
                <TouchableOpacity
                  style={styles.darkBtn}
                  disabled={busy}
                  onPress={handleSaveName}
                >
                  <Text style={styles.darkBtnTxt}>Save</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={styles.logoutBtn} onPress={onLogout}>
                <Text style={styles.logoutTxt}>Logout</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.card}>
              <Text style={styles.sectionLabel}>Saved Addresses ({addresses.length})</Text>
              {addresses.length === 0 ? (
                <Text style={styles.mutedTxt}>
                  Cart tab mein delivery address add kar sakte hain.
                </Text>
              ) : (
                addresses.map((a) => (
                  <View key={a.id} style={styles.addrBox}>
                    <Text style={styles.addrTitle}>{a.line1}</Text>
                    <Text style={styles.mutedTxt}>
                      {a.landmark ? `${a.landmark}, ` : ""}
                      {a.area} – {a.pin}
                    </Text>
                  </View>
                ))
              )}
            </View>
          </>
        ) : (
          <View style={styles.card}>
            <Text style={styles.sectionLabel}>Mobile OTP Login</Text>
            {step === "phone" ? (
              <>
                <TextInput
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  maxLength={10}
                  placeholder="10 digit mobile (e.g. 9876543210)"
                  style={styles.input}
                />
                <TouchableOpacity
                  style={styles.primaryBtn}
                  disabled={busy}
                  onPress={handleSendOtp}
                >
                  <Text style={styles.primaryBtnTxt}>
                    {busy ? "Bhej rahe hain..." : "OTP Bhejein"}
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                {hint && (
                  <View style={styles.hintBox}>
                    <Text style={styles.hintTxt}>{hint}</Text>
                  </View>
                )}
                <TextInput
                  value={code}
                  onChangeText={setCode}
                  keyboardType="number-pad"
                  maxLength={4}
                  placeholder="4 digit OTP"
                  style={styles.input}
                />
                <TextInput
                  value={nameInput}
                  onChangeText={setNameInput}
                  placeholder="Aapka naam (optional)"
                  style={styles.input}
                />
                <View style={styles.btnRow}>
                  <TouchableOpacity
                    style={styles.secondaryBtn}
                    onPress={() => setStep("phone")}
                  >
                    <Text style={styles.secondaryBtnTxt}>Back</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.primaryBtn, { flex: 1 }]}
                    disabled={busy}
                    onPress={handleVerify}
                  >
                    <Text style={styles.primaryBtnTxt}>
                      {busy ? "Checking..." : "Verify & Login"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        )}

        <View style={styles.card}>
          <Text style={styles.sectionLabel}>Dukaan Server URL</Text>
          <Text style={styles.mutedTxt}>
            Simulator ke liye localhost:3000 (Android: 10.0.2.2:3000) ya phone par
            apne laptop ka LAN IP daalein.
          </Text>
          <TextInput
            value={urlInput}
            onChangeText={setUrlInput}
            autoCapitalize="none"
            autoCorrect={false}
            placeholder="http://localhost:3000"
            style={styles.input}
          />
          <TouchableOpacity style={styles.darkBtn} onPress={handleSaveUrl}>
            <Text style={styles.darkBtnTxt}>Update Server URL</Text>
          </TouchableOpacity>
        </View>
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
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 10,
  },
  kicker: { fontSize: 10, fontWeight: "700", color: COLORS.green },
  nameBig: { fontSize: 18, fontWeight: "700", color: COLORS.text },
  phoneTxt: { fontSize: 13, color: COLORS.muted },
  nameRow: { flexDirection: "row", gap: 8 },
  sectionLabel: { fontSize: 12, fontWeight: "700", color: COLORS.muted, textTransform: "uppercase" },
  mutedTxt: { fontSize: 12, color: COLORS.muted },
  input: {
    backgroundColor: COLORS.bg,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: COLORS.text,
  },
  primaryBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  primaryBtnTxt: { color: "#fff", fontSize: 14, fontWeight: "700" },
  secondaryBtn: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: "center",
  },
  secondaryBtnTxt: { color: COLORS.text, fontSize: 13, fontWeight: "600" },
  btnRow: { flexDirection: "row", gap: 8 },
  darkBtn: {
    backgroundColor: COLORS.text,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  darkBtnTxt: { color: "#fff", fontSize: 13, fontWeight: "700" },
  logoutBtn: {
    borderWidth: 1,
    borderColor: "#FECACA",
    backgroundColor: "#FEF2F2",
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
  },
  logoutTxt: { color: COLORS.danger, fontSize: 13, fontWeight: "700" },
  hintBox: {
    backgroundColor: "#FFFBEB",
    borderWidth: 1,
    borderColor: "#FDE68A",
    borderRadius: 10,
    padding: 10,
  },
  hintTxt: { fontSize: 12, color: "#92400E" },
  addrBox: {
    backgroundColor: COLORS.bg,
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  addrTitle: { fontSize: 13, fontWeight: "700", color: COLORS.text },
});
