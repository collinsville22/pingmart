export type Chain = "ethereum" | "solana" | "near" | "base" | "arbitrum";

export interface ChainInfo {
  id: Chain;
  name: string;
  tld: string;
  color: string;
  registrationUrl: string;
  status: "live" | "coming-soon";
}

export type OrderStatus =
  | "PENDING_PAYMENT"
  | "PAYMENT_PROCESSING"
  | "PAYMENT_CONFIRMED"
  | "SWAPPING"
  | "REGISTERING"
  | "REGISTERED"
  | "REGISTRATION_FAILED"
  | "EXPIRED";

export interface Order {
  id: string;
  domain: string;
  tld: string;
  chain: Chain;
  years: number;
  price_usd: number;
  status: OrderStatus;
  pingpay_session_id: string | null;
  pingpay_payment_id: string | null;
  payment_amount: number | null;
  owner_address: string | null;
  registration_error: string | null;
  registration_tx: string | null;
  swap_tx: string | null;
  created_at: string;
  updated_at: string;
  paid_at: string | null;
  registered_at: string | null;
}

export interface OrderEvent {
  id: number;
  order_id: string;
  event_type: string;
  payload: string | null;
  created_at: string;
}

export interface DomainCheckResult {
  domain: string;
  label: string;
  chain: Chain;
  tld: string;
  available: boolean;
  premium: boolean;
  price: number | null;
  registrationUrl: string;
}

export interface OrderWithEvents {
  order: Order;
  events: OrderEvent[];
}
