import { NextResponse } from "next/server";
import { registerOnChain } from "@/lib/registration";
import {
  findOrder,
  insertEvent,
  updateOrder,
} from "@/lib/db/orders";
import type { Order } from "@/types";

async function processRetry(order: Order) {
  try {
    if (order.chain !== "near") {
      updateOrder(order.id, "SWAPPING");
      insertEvent(order.id, "SWAPPING", { chain: order.chain, retry: true });
    }

    updateOrder(order.id, "REGISTERING");
    insertEvent(order.id, "REGISTERING", { chain: order.chain, retry: true });

    const result = await registerOnChain(order, (step) => {
      insertEvent(order.id, "PROGRESS", { step });
    });

    updateOrder(order.id, "REGISTERED", {
      registered_at: new Date().toISOString(),
      registration_tx: result.txHash,
      swap_tx: result.swapTxHash || null,
      registration_error: null,
    });
    insertEvent(order.id, "REGISTERED", {
      chain: order.chain,
      txHash: result.txHash,
      swapTxHash: result.swapTxHash,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    updateOrder(order.id, "REGISTRATION_FAILED", {
      registration_error: msg,
    });
    insertEvent(order.id, "REGISTRATION_FAILED", { error: msg, retry: true });
  }
}

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ orderId: string }> },
) {
  const { orderId } = await params;
  const order = findOrder(orderId);

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  if (order.status !== "REGISTRATION_FAILED") {
    return NextResponse.json({ error: "Can only retry failed registrations" }, { status: 400 });
  }

  insertEvent(order.id, "RETRY_REQUESTED");
  processRetry(order).catch((err: unknown) => {
    const msg = err instanceof Error ? err.message : String(err);
    insertEvent(order.id, "REGISTRATION_UNHANDLED_ERROR", { error: msg });
  });

  return NextResponse.json({ status: "retrying" });
}
