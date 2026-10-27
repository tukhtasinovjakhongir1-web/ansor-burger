export type Category = {
  id: number;
  slug: string;
  name: string;
  emoji: string | null;
  image: string | null;
  sort: number;
  is_active: boolean;
};

export type Product = {
  id: number;
  slug: string | null;
  category_id: number | null;
  name: string;
  description: string;
  price: number;
  old_price: number | null;
  image: string | null;
  price_note: string | null;
  is_available: boolean;
  is_popular: boolean;
  is_active: boolean;
  sort: number;
};

export type Zone = {
  id: number;
  name: string;
  fee: number;
  min_order: number;
  eta_min: number;
  is_active: boolean;
  sort: number;
};

export type Settings = {
  restaurant_name: string;
  tagline: string;
  phones: string[];
  address: string;
  instagram: string;
  open_time: string;
  close_time: string;
  accepting_orders: boolean;
  delivery_enabled: boolean;
  pickup_enabled: boolean;
  dinein_enabled: boolean;
  cash_enabled: boolean;
  card_enabled: boolean;
  card_number: string;
  card_holder: string;
  free_delivery_from: number;
  prep_minutes: number;
  promo_title: string;
  promo_text: string;
  promo_product: string;
};

export type Menu = {
  categories: Category[];
  products: Product[];
  zones: Zone[];
  settings: Settings;
};

export type OrderType = 'delivery' | 'pickup' | 'dinein';
export type PaymentMethod = 'cash' | 'card';
export type PaymentStatus = 'unpaid' | 'paid';
export type OrderStatus = 'new' | 'accepted' | 'cooking' | 'ready' | 'delivering' | 'done' | 'cancelled';

export type OrderItem = {
  id: number;
  product_id: number | null;
  name: string;
  price: number;
  qty: number;
  total: number;
  image?: string | null;
};

export type Order = {
  id: number;
  code: string;
  telegram_id: string | null;
  customer_name: string;
  phone: string;
  order_type: OrderType;
  zone_id: number | null;
  zone_name: string | null;
  address: string | null;
  landmark: string | null;
  lat: number | null;
  lng: number | null;
  scheduled_at: string | null;
  guests: number | null;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  change_from: number | null;
  subtotal: number;
  delivery_fee: number;
  total: number;
  comment: string | null;
  status: OrderStatus;
  cancel_reason: string | null;
  created_at: string;
  updated_at: string;
  items: OrderItem[];
  username?: string | null;
};

export type CheckoutInput = {
  items: { product_id: number; qty: number }[];
  order_type: OrderType;
  customer_name: string;
  phone: string;
  zone_id?: number | null;
  address?: string;
  landmark?: string;
  lat?: number | null;
  lng?: number | null;
  scheduled_at?: string | null;
  guests?: number | null;
  payment_method: PaymentMethod;
  change_from?: number | null;
  comment?: string;
};
