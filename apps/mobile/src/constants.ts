import { Platform } from "react-native";

const IST = "Asia/Kolkata";

export const DEFAULT_API_URL =
  process.env.EXPO_PUBLIC_API_URL ||
  (Platform.OS === "android" ? "http://10.0.2.2:3000" : "http://localhost:3000");

export function paiseToInr(paise: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  }).format(paise / 100);
}

export function formatIst(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  try {
    return new Intl.DateTimeFormat("en-IN", {
      timeZone: IST,
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(d);
  } catch {
    return d.toLocaleString();
  }
}

export function isValidInPhone(phone: string): boolean {
  return /^[6-9]\d{9}$/.test(phone);
}

export function isValidPin(pin: string): boolean {
  return /^\d{6}$/.test(pin);
}

export const CATEGORIES: { id: string; label: string; labelHi: string }[] = [
  { id: "atta_dal", label: "Atta / dal", labelHi: "आटा दाल" },
  { id: "oil_masala", label: "Tel / masala", labelHi: "तेल मसाला" },
  { id: "dairy", label: "Doodh / dahi", labelHi: "दूध दही" },
  { id: "veggies", label: "Sabzi", labelHi: "सब्ज़ी" },
  { id: "snacks", label: "Namkeen", labelHi: "नमकीन" },
  { id: "personal", label: "Ghar / soap", labelHi: "घर साबुन" },
];

export const PROGRESS_STEPS = [
  "placed",
  "accepted",
  "packed",
  "out_for_delivery",
  "delivered",
] as const;

export const STATUS_LABEL: Record<string, { en: string; hi: string }> = {
  placed: { en: "Order aa gaya", hi: "ऑर्डर आ गया" },
  accepted: { en: "Dukaan ne maan liya", hi: "दुकान ने मान लिया" },
  packed: { en: "Thela bandh gaya", hi: "थैला बंद गया" },
  out_for_delivery: { en: "Nikal gaya", hi: "निकल गया" },
  delivered: { en: "Pahunch gaya", hi: "पहुंच गया" },
  cancelled: { en: "Cancel", hi: "रद्द" },
};

export function parseSlots(slotsJson?: string | null): string[] {
  if (!slotsJson) {
    return ["Jaldi (1 ghanta)", "Dopahar 12–2", "Shaam 5–7", "Raat 8–9"];
  }
  try {
    const parsed = JSON.parse(slotsJson);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed.map(String);
    }
  } catch {
    // fallback
  }
  return ["Jaldi (1 ghanta)", "Dopahar 12–2", "Shaam 5–7", "Raat 8–9"];
}

export const COLORS = {
  bg: "#FFFBF5",
  card: "#FFFFFF",
  primary: "#EA580C",
  primarySoft: "#FFF7ED",
  primaryBorder: "#FED7AA",
  green: "#15803D",
  greenSoft: "#ECFDF5",
  text: "#1C1917",
  muted: "#78716C",
  border: "#E7E5E4",
  danger: "#DC2626",
};
