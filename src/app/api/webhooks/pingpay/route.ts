import { NextResponse } from "next/server";
import { verifyPayment } from "@/lib/pingpay/client";
import { PingPayWebhookSchema } from "@/lib/utils/validation";
import {
  findOrder,
  insertEvent,
  updateOrder,
  processRegistration,
} from "@/lib/db/orders";
import type { Order } from "@/types";
import crypto from "crypto";

const TERMINAL_STATUSES = [
  "PAYMENT_CONFIRMED",
  "SWAPPING",
  "REGISTERING",
  "REGISTERED",
  "REGISTRATION_FAILED",
];

function verifySignature(payload: string, timestamp: string, signature: string): boolean {
  const secret = process.env.PINGPAY_WEBHOOK_SECRET;
  if (!secret) return false;

  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${timestamp}.${payload}`)
    .digest("hex");

  try {
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  } catch {
    return false;
  }
}

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const timestamp = req.headers.get("x-ping-timestamp") || "";
    const signature = req.headers.get("x-ping-signature") || "";

    if (!verifySignature(rawBody, timestamp, signature)) {
      return NextResponse.json({ received: true });
    }

    const parsed = PingPayWebhookSchema.safeParse(JSON.parse(rawBody));
    if (!parsed.success) {
      return NextResponse.json({ received: true });
    }

    const { type, resourceId } = parsed.data;

    if (type !== "payment.success" && type !== "checkout.session.completed") {
      return NextResponse.json({ received: true });
    }

    const db = (await import("@/lib/db")).getDb();
    const order = db
      .prepare("SELECT * FROM orders WHERE pingpay_session_id = ? OR pingpay_payment_id = ?")
      .get(resourceId, resourceId) as Order | undefined;

    if (!order || TERMINAL_STATUSES.includes(order.status)) {
      return NextResponse.json({ received: true });
    }

    insertEvent(order.id, "WEBHOOK_RECEIVED", parsed.data);

    const sessionId = order.pingpay_session_id;
    if (sessionId) {
      const verification = await verifyPayment(sessionId);

      if (!verification.verified) {
        insertEvent(order.id, "PAYMENT_UNVERIFIED", { resourceId });
        return NextResponse.json({ received: true });
      }

      updateOrder(order.id, "PAYMENT_CONFIRMED", {
        pingpay_payment_id: verification.paymentId || resourceId,
        paid_at: new Date().toISOString(),
      });
      insertEvent(order.id, "PAYMENT_CONFIRMED", {
        paymentId: verification.paymentId,
        source: "webhook",
      });

      const updatedOrder = findOrder(order.id)!;
      processRegistration(updatedOrder).catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : String(err);
        insertEvent(order.id, "REGISTRATION_UNHANDLED_ERROR", { error: msg });
      });
    }

    return NextResponse.json({ received: true });
  } catch {
    return NextResponse.json({ received: true });
  }
}
