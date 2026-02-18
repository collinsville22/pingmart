import { NextResponse } from "next/server";
import { verifyPayment } from "@/lib/pingpay/client";
import {
  findOrder,
  findOrderEvents,
  insertEvent,
  updateOrder,
  processRegistration,
} from "@/lib/db/orders";
import { OrderNotFoundError, toErrorResponse, toStatusCode } from "@/lib/utils/errors";

const lastVerifyCheck = new Map<string, number>();
const VERIFY_INTERVAL_MS = 10_000;

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ orderId: string }> },
) {
  try {
    const { orderId } = await params;
    let order = findOrder(orderId);

    if (!order) {
      throw new OrderNotFoundError(orderId);
    }

    if (order.status === "PENDING_PAYMENT" || order.status === "PAYMENT_PROCESSING") {
      const sessionId = order.pingpay_session_id;
      if (sessionId) {
        const now = Date.now();
        const lastCheck = lastVerifyCheck.get(orderId) ?? 0;

        if (now - lastCheck >= VERIFY_INTERVAL_MS) {
          lastVerifyCheck.set(orderId, now);
          try {
            const verification = await verifyPayment(sessionId);

            if (verification.verified) {
              lastVerifyCheck.delete(orderId);
              updateOrder(order.id, "PAYMENT_CONFIRMED", {
                pingpay_payment_id: verification.paymentId,
                paid_at: new Date().toISOString(),
              });
              insertEvent(order.id, "PAYMENT_CONFIRMED", {
                paymentId: verification.paymentId,
                source: "polling",
              });

              order = findOrder(orderId)!;

              processRegistration(order).catch((err: unknown) => {
                const msg = err instanceof Error ? err.message : String(err);
                insertEvent(orderId, "REGISTRATION_UNHANDLED_ERROR", { error: msg });
              });
            }
          } catch {}
        }
      }
    }

    const events = findOrderEvents(orderId);
    return NextResponse.json({ order, events });
  } catch (error) {
    return NextResponse.json(
      { error: toErrorResponse(error) },
      { status: toStatusCode(error) },
    );
  }
}
