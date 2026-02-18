import { notFound } from "next/navigation";
import { getDb } from "@/lib/db";
import { getSessionStatus } from "@/lib/pingpay/client";
import { OrderSummary } from "@/components/checkout/order-summary";
import { PaymentButton } from "@/components/checkout/payment-button";
import Link from "next/link";
import type { Order } from "@/types";

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;
  const db = getDb();
  const order = db.prepare("SELECT * FROM orders WHERE id = ?").get(orderId) as Order | undefined;

  if (!order) notFound();

  if (order.status !== "PENDING_PAYMENT" && order.status !== "PAYMENT_PROCESSING") {
    return (
      <div className="mx-auto max-w-md px-4 sm:px-6 py-24 text-center">
        <div className="w-16 h-16 rounded-2xl bg-accent/8 border border-accent/15 flex items-center justify-center mx-auto mb-6">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-accent">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <p className="text-text-primary font-medium mb-2">Order already processed</p>
        <p className="text-sm text-text-tertiary mb-6">This order has moved past the payment stage.</p>
        <Link
          href={`/order/${orderId}`}
          className="inline-flex items-center gap-2 rounded-full bg-bg-surface border border-border-subtle px-5 py-2.5 text-sm text-accent hover:border-accent/25 transition-colors"
        >
          View order status
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        </Link>
      </div>
    );
  }

  let paymentUrl = "";
  if (order.pingpay_session_id) {
    try {
      const session = await getSessionStatus(order.pingpay_session_id);
      paymentUrl = session.sessionUrl
        || `https://pay.pingpay.io/checkout?sessionId=${order.pingpay_session_id}`;
    } catch {
      paymentUrl = `https://pay.pingpay.io/checkout?sessionId=${order.pingpay_session_id}`;
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 sm:px-6 py-10 sm:py-16">
      <div className="mb-8 animate-fade-in">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs text-text-tertiary hover:text-accent transition-colors mb-6 group"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:-translate-x-0.5 transition-transform">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          Back
        </Link>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-text-primary tracking-tight">
          Checkout
        </h1>
        <p className="text-sm text-text-tertiary mt-2">Review your order and pay with crypto or fiat</p>
      </div>

      <div className="space-y-6 animate-slide-up">
        <OrderSummary order={order} />
        <PaymentButton paymentUrl={paymentUrl} orderId={order.id} />
      </div>
    </div>
  );
}
