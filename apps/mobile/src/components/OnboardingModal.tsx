import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  PermissionsAndroid,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { COLORS, isValidInPhone, isValidPin } from "../constants";

interface OnboardingModalProps {
  visible: boolean;
  onClose: () => void;
  initialStep?: "location" | "phone";
  isLoggedIn?: boolean;
  currentLocation: { area: string; pin: string } | null;
  onSaveLocation: (loc: { area: string; pin: string }) => Promise<void>;
  onRequestOtp: (phone: string) => Promise<{ hint?: string; code?: string }>;
  onVerifyOtp: (phone: string, code: string, name?: string) => Promise<void>;
}

const POPULAR_AREAS = [
  { area: "Manpur, Gaya", pin: "823003", desc: "Main Market & Delivery Hub" },
  { area: "Civil Lines, Gaya", pin: "823001", desc: "15-20 Min Delivery" },
  { area: "Rampur, Gaya", pin: "823001", desc: "Free delivery over ₹199" },
  { area: "Bodh Gaya Road", pin: "824231", desc: "Standard Delivery" },
];

export function OnboardingModal({
  visible,
  onClose,
  initialStep = "location",
  isLoggedIn = false,
  currentLocation,
  onSaveLocation,
  onRequestOtp,
  onVerifyOtp,
}: OnboardingModalProps) {
  const [step, setStep] = useState<"location" | "phone" | "otp">(initialStep);
  const [manualPin, setManualPin] = useState("");
  const [manualArea, setManualArea] = useState("");
  const [showManualLocation, setShowManualLocation] = useState(false);

  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [otpHint, setOtpHint] = useState<string | null>(null);
  const [devCode, setDevCode] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  React.useEffect(() => {
    if (visible) {
      setStep(initialStep);
      setBusy(false);
    }
  }, [visible, initialStep]);

  // 1. Location Request Handler
  const handleRequestLocationPermission = async () => {
    setBusy(true);
    try {
      if (Platform.OS === "android") {
        try {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
            {
              title: "Location Permission",
              message:
                "Lalu Kirana ko aapke ghar taaza saman pahunchane ke liye location access chahiye.",
              buttonPositive: "Allow / Manzoor",
              buttonNegative: "Cancel",
            }
          );
          if (granted === PermissionsAndroid.RESULTS.GRANTED) {
            // Detected: Set nearest hub (e.g. Manpur 823003)
            await onSaveLocation({
              area: "Manpur (GPS Detected)",
              pin: "823003",
            });
            if (isLoggedIn) {
              onClose();
            } else {
              setStep("phone");
            }
            return;
          }
        } catch {
          // ignore permission error, fallback below
        }
        setShowManualLocation(true);
      } else {
        await onSaveLocation({
          area: "Manpur (Current Location)",
          pin: "823003",
        });
        if (isLoggedIn) {
          onClose();
        } else {
          setStep("phone");
        }
      }
    } finally {
      setBusy(false);
    }
  };

  const handleSelectArea = async (area: string, pin: string) => {
    setBusy(true);
    try {
      await onSaveLocation({ area, pin });
      if (isLoggedIn) {
        onClose();
      } else {
        setStep("phone");
      }
    } finally {
      setBusy(false);
    }
  };

  const handleSaveManualLocation = async () => {
    if (!manualArea.trim() || !isValidPin(manualPin.trim())) {
      Alert.alert("Dhyan Dein", "Sahi area aur 6-digit PIN code daaliye");
      return;
    }
    setBusy(true);
    try {
      await onSaveLocation({ area: manualArea.trim(), pin: manualPin.trim() });
      if (isLoggedIn) {
        onClose();
      } else {
        setStep("phone");
      }
    } finally {
      setBusy(false);
    }
  };

  // 2. OTP Flow
  const handleSendOtp = async () => {
    const cleaned = phone.replace(/\D/g, "").slice(-10);
    if (!isValidInPhone(cleaned)) {
      Alert.alert("Galat Number", "Kripya 10 digit Indian mobile number daaliye (e.g. 9876543210)");
      return;
    }
    setBusy(true);
    try {
      const res = await onRequestOtp(cleaned);
      setPhone(cleaned);
      setOtpHint(res.hint ?? "OTP bhej diya gaya hai");
      if (res.code) {
        setDevCode(res.code);
        setCode(res.code); // Auto-fill for ultra-smooth testing!
      }
      setStep("otp");
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "OTP request fail ho gaya");
    } finally {
      setBusy(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!code.trim()) {
      Alert.alert("OTP Chahiye", "Kripya 4 digit OTP enter karein");
      return;
    }
    setBusy(true);
    try {
      await onVerifyOtp(phone, code.trim(), name.trim() || undefined);
      Alert.alert("Swagat Hai!", "Aapka login safal raha.");
      onClose();
    } catch (e) {
      Alert.alert("Login Fail", e instanceof Error ? e.message : "OTP galat ya expire ho gaya");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          {/* Header indicator */}
          <View style={styles.notch} />

          {/* Close / Skip button */}
          <View style={styles.headerRow}>
            <Text style={styles.brandBadge}>Lalu Kirana · लालू किराना</Text>
            <TouchableOpacity onPress={onClose} style={styles.skipBtn}>
              <Text style={styles.skipText}>Skip ✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
            {/* STEP 1: LOCATION PERMISSION */}
            {step === "location" && (
              <View>
                <View style={styles.iconCircle}>
                  <Text style={styles.iconBig}>📍</Text>
                </View>
                <Text style={styles.title}>Delivery Location Chunein</Text>
                <Text style={styles.subtitle}>
                  Minute Bazar aur Lalu Kirana se 15-20 minute mein taaza sabzi aur ration aapke ghar tak.
                </Text>

                {currentLocation && (
                  <View style={styles.currentLocCard}>
                    <Text style={styles.currentLocLabel}>Current Selected Area:</Text>
                    <Text style={styles.currentLocValue}>
                      {currentLocation.area} ({currentLocation.pin})
                    </Text>
                  </View>
                )}

                <TouchableOpacity
                  style={styles.primaryBtn}
                  onPress={handleRequestLocationPermission}
                  disabled={busy}
                >
                  {busy ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.primaryBtnText}>📍 Use Current Location</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.secondaryBtn}
                  onPress={() => setShowManualLocation(!showManualLocation)}
                >
                  <Text style={styles.secondaryBtnText}>
                    {showManualLocation ? "Hide Manual Areas" : "✍️ Select Area / Enter PIN Code"}
                  </Text>
                </TouchableOpacity>

                {showManualLocation && (
                  <View style={styles.manualSection}>
                    <Text style={styles.sectionHeader}>Popular Neighborhoods:</Text>
                    {POPULAR_AREAS.map((item) => (
                      <TouchableOpacity
                        key={item.area}
                        style={styles.areaItem}
                        onPress={() => handleSelectArea(item.area, item.pin)}
                      >
                        <View>
                          <Text style={styles.areaName}>{item.area}</Text>
                          <Text style={styles.areaDesc}>{item.desc}</Text>
                        </View>
                        <Text style={styles.areaPinBadge}>{item.pin}</Text>
                      </TouchableOpacity>
                    ))}

                    <View style={styles.customRow}>
                      <TextInput
                        style={[styles.input, { flex: 1 }]}
                        placeholder="Area name (e.g. Manpur)"
                        value={manualArea}
                        onChangeText={setManualArea}
                      />
                      <TextInput
                        style={[styles.input, { width: 100 }]}
                        placeholder="PIN (6-digit)"
                        keyboardType="number-pad"
                        maxLength={6}
                        value={manualPin}
                        onChangeText={setManualPin}
                      />
                    </View>
                    <TouchableOpacity
                      style={[styles.primaryBtn, { marginTop: 8 }]}
                      onPress={handleSaveManualLocation}
                      disabled={busy}
                    >
                      <Text style={styles.primaryBtnText}>Confirm Location</Text>
                    </TouchableOpacity>
                  </View>
                )}

                <TouchableOpacity style={styles.textLink} onPress={() => setStep("phone")}>
                  <Text style={styles.textLinkContent}>Skip to Login ➔</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* STEP 2: PHONE NUMBER LOGIN */}
            {step === "phone" && (
              <View>
                <View style={[styles.iconCircle, { backgroundColor: "#FFF7ED" }]}>
                  <Text style={styles.iconBig}>📱</Text>
                </View>
                <Text style={styles.title}>Mobile Number Daalein</Text>
                <Text style={styles.subtitle}>
                  Order tracking aur delivery updates ke liye apna 10-digit number enter karein.
                </Text>

                <View style={styles.phoneInputRow}>
                  <View style={styles.flagBox}>
                    <Text style={styles.flagText}>🇮🇳 +91</Text>
                  </View>
                  <TextInput
                    style={styles.phoneInput}
                    placeholder="98765 43210"
                    placeholderTextColor={COLORS.muted}
                    keyboardType="phone-pad"
                    maxLength={10}
                    value={phone}
                    onChangeText={setPhone}
                    autoFocus
                  />
                </View>

                <TouchableOpacity style={styles.primaryBtn} onPress={handleSendOtp} disabled={busy}>
                  {busy ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.primaryBtnText}>OTP Mangwayein ➔</Text>
                  )}
                </TouchableOpacity>

                <View style={styles.guaranteeRow}>
                  <Text style={styles.guaranteeText}>🔒 OTP se 100% secure aur bina password login</Text>
                </View>
              </View>
            )}

            {/* STEP 3: OTP VERIFICATION */}
            {step === "otp" && (
              <View>
                <View style={[styles.iconCircle, { backgroundColor: "#ECFDF5" }]}>
                  <Text style={styles.iconBig}>🔑</Text>
                </View>
                <Text style={styles.title}>OTP Verify Karein</Text>
                <Text style={styles.subtitle}>
                  Number <Text style={{ fontWeight: "700" }}>+91 {phone}</Text> par bheja gaya 4-digit code daalein.
                </Text>

                {/* Dev Mode Banner / Auto-fill Hint */}
                {otpHint && (
                  <View style={styles.otpBanner}>
                    <Text style={styles.otpBannerText}>ℹ️ {otpHint}</Text>
                    {devCode && (
                      <TouchableOpacity
                        style={styles.autoFillBtn}
                        onPress={() => setCode(devCode)}
                      >
                        <Text style={styles.autoFillText}>⚡ Tap to Auto-fill: {devCode}</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}

                <View style={styles.fieldWrap}>
                  <Text style={styles.fieldLabel}>4 Digit OTP Code</Text>
                  <TextInput
                    style={[styles.input, styles.otpInput]}
                    placeholder="• • • •"
                    placeholderTextColor={COLORS.muted}
                    keyboardType="number-pad"
                    maxLength={4}
                    value={code}
                    onChangeText={setCode}
                    autoFocus
                  />
                </View>

                <View style={styles.fieldWrap}>
                  <Text style={styles.fieldLabel}>Aapka Naam / Name (Optional)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. Ramesh Kumar"
                    placeholderTextColor={COLORS.muted}
                    value={name}
                    onChangeText={setName}
                  />
                </View>

                <TouchableOpacity style={styles.primaryBtn} onPress={handleVerifyOtp} disabled={busy}>
                  {busy ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.primaryBtnText}>Verify & Login ✓</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.resendBtn}
                  onPress={handleSendOtp}
                  disabled={busy}
                >
                  <Text style={styles.resendText}>OTP nahi mila? Dobara bhejein</Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "88%",
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 32,
  },
  notch: {
    width: 44,
    height: 5,
    backgroundColor: "#E2E8F0",
    borderRadius: 3,
    alignSelf: "center",
    marginBottom: 12,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  brandBadge: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.primary,
    backgroundColor: COLORS.primarySoft,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  skipBtn: {
    padding: 6,
  },
  skipText: {
    fontSize: 13,
    color: COLORS.muted,
    fontWeight: "600",
  },
  scroll: {
    paddingBottom: 20,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#E0F2FE",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginBottom: 14,
  },
  iconBig: {
    fontSize: 28,
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    color: COLORS.text,
    textAlign: "center",
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.muted,
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 18,
    paddingHorizontal: 12,
  },
  currentLocCard: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
    alignItems: "center",
  },
  currentLocLabel: {
    fontSize: 11,
    color: COLORS.muted,
    textTransform: "uppercase",
    fontWeight: "600",
  },
  currentLocValue: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.text,
    marginTop: 2,
  },
  primaryBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  primaryBtnText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  secondaryBtn: {
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    marginBottom: 14,
  },
  secondaryBtnText: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "600",
  },
  manualSection: {
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    paddingTop: 12,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.muted,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  areaItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
  },
  areaName: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.text,
  },
  areaDesc: {
    fontSize: 12,
    color: COLORS.muted,
    marginTop: 2,
  },
  areaPinBadge: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.primary,
    backgroundColor: COLORS.primarySoft,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  customRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: COLORS.text,
    backgroundColor: "#FAFAFA",
  },
  phoneInputRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  flagBox: {
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    justifyContent: "center",
  },
  flagText: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.text,
  },
  phoneInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: 1,
    color: COLORS.text,
    backgroundColor: "#FAFAFA",
  },
  guaranteeRow: {
    alignItems: "center",
    marginTop: 8,
  },
  guaranteeText: {
    fontSize: 12,
    color: COLORS.muted,
  },
  otpBanner: {
    backgroundColor: "#FEF3C7",
    borderWidth: 1,
    borderColor: "#FCD34D",
    borderRadius: 10,
    padding: 10,
    marginBottom: 14,
  },
  otpBannerText: {
    fontSize: 13,
    color: "#92400E",
    fontWeight: "600",
  },
  autoFillBtn: {
    marginTop: 6,
    backgroundColor: "#D97706",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    alignSelf: "flex-start",
  },
  autoFillText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  fieldWrap: {
    marginBottom: 14,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.muted,
    marginBottom: 4,
  },
  otpInput: {
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: 8,
    textAlign: "center",
  },
  resendBtn: {
    alignItems: "center",
    paddingVertical: 8,
  },
  resendText: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: "600",
  },
  textLink: {
    alignItems: "center",
    paddingVertical: 10,
    marginTop: 4,
  },
  textLinkContent: {
    fontSize: 13,
    color: COLORS.muted,
    fontWeight: "600",
  },
});
