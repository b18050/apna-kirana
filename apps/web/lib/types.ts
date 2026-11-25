export interface ProductDTO {
  id: string;
  name: string;
  nameHi: string;
  category: string;
  unit: string;
  mrpPaise: number;
  pricePaise: number;
  stockQty: number;
  imageEmoji: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface AddressDTO {
  id: string;
  customerId: string;
  line1: string;
  landmark: string;
  area: string;
  pin: string;
  isDefault: boolean;
}

export interface CustomerDTO {
  id: string;
  phone: string;
  name: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface OrderItemDTO {
  id: string;
  orderId: string;
  productId: string;
  name: string;
  nameHi: string;
  unit: string;
  qty: number;
  pricePaise: number;
}

export interface OrderDTO {
  id: string;
  customerId: string;
  addressId: string;
  status: string;
  slotLabel: string;
  paymentMethod: string;
  totalPaise: number;
  notes: string;
  stockApplied: boolean;
  createdAt: string;
  updatedAt: string;
  items: OrderItemDTO[];
  address?: AddressDTO;
  customer?: CustomerDTO;
}

export interface StoreSettingsDTO {
  id: string;
  storeName: string;
  storeNameHi: string;
  area: string;
  pin: string;
  minOrderPaise: number;
  slotsJson: string;
  hours: string;
  upiEnabled: boolean;
  offersEnabled: boolean;
  contactPhone: string;
  contactEmail: string;
}

export interface OfferDTO {
  id: string;
  title: string;
  titleHi: string;
  body: string;
  bodyHi: string;
  kind: string;
  deepLink: string;
  startsAt: string | null;
  endsAt: string | null;
  isActive: boolean;
}

export interface HomeResponseDTO {
  products: ProductDTO[];
  settings: StoreSettingsDTO | null;
  offer: OfferDTO | null;
  lastOrder: OrderDTO | null;
  usuals: ProductDTO[];
  openOrders: OrderDTO[];
  addresses: AddressDTO[];
  customer?: CustomerDTO | null;
}

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
    // fall back to defaults
  }
  return ["Jaldi (1 ghanta)", "Dopahar 12–2", "Shaam 5–7", "Raat 8–9"];
}
