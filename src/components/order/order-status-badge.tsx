import { Badge } from "@/components/ui/badge";
import type { OrderStatus } from "@/types";

const statusConfig: Record<OrderStatus, { label: string; variant: "success" | "warning" | "danger" | "neutral" | "accent" }> = {
  PENDING_PAYMENT: { label: "Awaiting Payment", variant: "warning" },
  PAYMENT_PROCESSING: { label: "Processing Payment", variant: "warning" },
  PAYMENT_CONFIRMED: { label: "Payment Confirmed", variant: "accent" },
  SWAPPING: { label: "Swapping Tokens", variant: "accent" },
  REGISTERING: { label: "Registering Name", variant: "accent" },
  REGISTERED: { label: "Registered", variant: "success" },
  REGISTRATION_FAILED: { label: "Registration Failed", variant: "danger" },
  EXPIRED: { label: "Expired", variant: "neutral" },
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const config = statusConfig[status];
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
