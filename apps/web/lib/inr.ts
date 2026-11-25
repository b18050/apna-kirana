const IST = "Asia/Kolkata";

export function paiseToInr(paise: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  }).format(paise / 100);
}

export function formatIst(date: Date | string) {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: IST,
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(d);
}

export function todayIstRange() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: IST,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "01";
  const ymd = `${get("year")}-${get("month")}-${get("day")}`;
  const start = new Date(`${ymd}T00:00:00+05:30`);
  const end = new Date(`${ymd}T23:59:59.999+05:30`);
  return { start, end, ymd };
}

export function isValidInPhone(phone: string) {
  return /^[6-9]\d{9}$/.test(phone);
}

export function isValidPin(pin: string) {
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

export const ORDER_STATUSES = [
  "placed",
  "accepted",
  "packed",
  "out_for_delivery",
  "delivered",
  "cancelled",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const STATUS_LABEL: Record<string, { en: string; hi: string }> = {
  placed: { en: "Order aa gaya", hi: "ऑर्डर आ गया" },
  accepted: { en: "Dukaan ne maan liya", hi: "दुकान ने मान लिया" },
  packed: { en: "Thela bandh gaya", hi: "थैला बंद गया" },
  out_for_delivery: { en: "Nikal gaya", hi: "निकल गया" },
  delivered: { en: "Pahunch gaya", hi: "पहुंच गया" },
  cancelled: { en: "Cancel", hi: "रद्द" },
};
