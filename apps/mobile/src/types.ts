export interface Product {
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
}

export interface Customer {
  id: string;
  phone: string;
  name: string;
}

export interface Address {
  id: string;
  customerId: string;
  line1: string;
  landmark: string;
  area: string;
  pin: string;
  isDefault: boolean;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  name: string;
  nameHi: string;
  unit: string;
  qty: number;
  pricePaise: number;
}

export interface Order {
  id: string;
  customerId: string;
  addressId: string;
  status: string;
  slotLabel: string;
  paymentMethod: string;
  totalPaise: number;
  notes: string;
  createdAt: string;
  items: OrderItem[];
  address?: Address;
}

export interface StoreSettings {
  id: string;
  storeName: string;
  storeNameHi: string;
  area: string;
  pin: string;
  minOrderPaise: number;
  slotsJson: string;
  hours: string;
  contactPhone: string;
  contactEmail: string;
}

export interface Offer {
  id: string;
  title: string;
  titleHi: string;
  body: string;
  bodyHi: string;
  isActive: boolean;
}

export interface HomeResponse {
  products: Product[];
  settings: StoreSettings | null;
  offer: Offer | null;
  lastOrder: Order | null;
  usuals: Product[];
  openOrders: Order[];
  addresses: Address[];
  customer?: Customer | null;
}
