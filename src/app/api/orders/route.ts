import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { checkNameOnChain } from "@/lib/naming/client";
import { CHAINS } from "@/lib/naming/chains";
import { getPrice } from "@/lib/naming/pricing";
import { createCheckoutSession } from "@/lib/pingpay/client";
import { createOrderId } from "@/lib/utils/id";
import { CreateOrderSchema } from "@/lib/utils/validation";
import {
  NameUnavailableError,
  toErrorResponse,
  toStatusCode,
} from "@/lib/utils/errors";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, chain, ownerAddress } = CreateOrderSchema.parse(body);

    const label = name.split(".")[0];
    const result = await checkNameOnChain(label, chain);

    if (!result.available) {
      throw new NameUnavailableError(name);
    }

    const priceUsd = getPrice(chain, label);
    const tld = CHAINS[chain].tld;

    const orderId = createOrderId();
    const db = getDb();

    const session = await createCheckoutSession(priceUsd, orderId);

    db.prepare(
      `INSERT INTO orders (id, domain, tld, chain, years, price_usd, owner_address, pingpay_session_id, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'PENDING_PAYMENT')`,
    ).run(orderId, name, tld, chain, 1, priceUsd, ownerAddress, session.sessionId);

    db.prepare(
      `INSERT INTO order_events (order_id, event_type, payload)
       VALUES (?, 'PENDING_PAYMENT', ?)`,
    ).run(orderId, JSON.stringify({ name, chain, price: priceUsd, ownerAddress, sessionId: session.sessionId }));

    return NextResponse.json(
      {
        orderId,
        name,
        chain,
        tld,
        price: priceUsd,
        paymentUrl: session.sessionUrl,
        registrationUrl: result.registrationUrl,
      },
      { status: 201 },
    );
  } catch (error) {
    return NextResponse.json(
      { error: toErrorResponse(error) },
      { status: toStatusCode(error) },
    );
  }
}
