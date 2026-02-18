import { getDb } from "@/lib/db";
import { registerOnChain } from "@/lib/registration";
import type { Order, OrderEvent } from "@/types";

export function findOrder(orderId: string): Order | undefined {
  return getDb()
    .prepare("SELECT * FROM orders WHERE id = ?")
    .get(orderId) as Order | undefined;
}

export function findOrderEvents(orderId: string): OrderEvent[] {
  return getDb()
    .prepare("SELECT * FROM order_events WHERE order_id = ? ORDER BY created_at ASC")
    .all(orderId) as OrderEvent[];
}

export function insertEvent(orderId: string, eventType: string, payload?: unknown) {
  getDb()
    .prepare("INSERT INTO order_events (order_id, event_type, payload) VALUES (?, ?, ?)")
    .run(orderId, eventType, payload ? JSON.stringify(payload) : null);
}

export function updateOrder(
  orderId: string,
  status: string,
  extra?: Record<string, unknown>,
) {
  const db = getDb();
  const sets = ["status = ?", "updated_at = datetime('now')"];
  const values: unknown[] = [status];

  if (extra) {
    for (const [key, value] of Object.entries(extra)) {
      sets.push(`${key} = ?`);
      values.push(value);
    }
  }

  values.push(orderId);
  db.prepare(`UPDATE orders SET ${sets.join(", ")} WHERE id = ?`).run(...values);
}

export async function processRegistration(order: Order) {
  try {
    if (order.chain !== "near") {
      updateOrder(order.id, "SWAPPING");
      insertEvent(order.id, "SWAPPING", { chain: order.chain });
    }

    updateOrder(order.id, "REGISTERING");
    insertEvent(order.id, "REGISTERING", { chain: order.chain });

    const result = await registerOnChain(order, (step) => {
      insertEvent(order.id, "PROGRESS", { step });
    });

    updateOrder(order.id, "REGISTERED", {
      registered_at: new Date().toISOString(),
      registration_tx: result.txHash,
      swap_tx: result.swapTxHash || null,
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
    insertEvent(order.id, "REGISTRATION_FAILED", { error: msg });
  }
}
