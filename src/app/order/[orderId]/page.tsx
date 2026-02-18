import { notFound } from "next/navigation";
import { getDb } from "@/lib/db";
import { OrderTimeline } from "@/components/order/order-timeline";
import Link from "next/link";
import type { Order, OrderEvent } from "@/types";

export const dynamic = "force-dynamic";

export default async function OrderPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;
  const db = getDb();

  const order = db.prepare("SELECT * FROM orders WHERE id = ?").get(orderId) as Order | undefined;
  if (!order) notFound();

  const events = db
    .prepare("SELECT * FROM order_events WHERE order_id = ? ORDER BY created_at ASC")
    .all(orderId) as OrderEvent[];

  return (
    <div className="mx-auto max-w-lg px-4 sm:px-6 py-10 sm:py-16">
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
          Order Tracking
        </h1>
        <p className="text-sm text-text-tertiary mt-2">Live status updates for your domain registration</p>
      </div>

      <OrderTimeline initialData={{ order, events }} />
    </div>
  );
}
