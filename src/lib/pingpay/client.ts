const PINGPAY_API_BASE = "https://pay.pingpay.io/api";

export interface CheckoutSession {
  sessionId: string;
  sessionUrl: string;
  status: string;
  paymentId: string | null;
  amount: { assetId: string; amount: string };
  recipient: string;
  createdAt: string;
  expiresAt: string | null;
  metadata: Record<string, unknown> | null;
}

function getApiKey(): string {
  return process.env.PINGPAY_API_KEY || "";
}

export async function createCheckoutSession(
  amountUsd: number,
  orderId: string,
): Promise<{ sessionId: string; sessionUrl: string }> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const usdcAmount = Math.ceil(amountUsd * 1_000_000).toString();

  const res = await fetch(`${PINGPAY_API_BASE}/checkout/sessions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": getApiKey(),
    },
    body: JSON.stringify({
      amount: usdcAmount,
      asset: { chain: "NEAR", symbol: "USDC" },
      successUrl: `${appUrl}/payment/callback?orderId=${orderId}`,
      cancelUrl: `${appUrl}/checkout/${orderId}`,
      metadata: { orderId },
    }),
    signal: AbortSignal.timeout(15000),
  });

  if (!res.ok) {
    const errorText = await res.text().catch(() => "no body");
    throw new Error(`PingPay session creation failed: ${res.status} - ${errorText}`);
  }

  const data = await res.json();
  return {
    sessionId: data.session.sessionId,
    sessionUrl: data.sessionUrl || data.session.sessionUrl,
  };
}

export async function getSessionStatus(
  sessionId: string,
): Promise<CheckoutSession> {
  const res = await fetch(`${PINGPAY_API_BASE}/checkout/sessions/${sessionId}`, {
    headers: { "x-publishable-key": getApiKey() },
    signal: AbortSignal.timeout(5000),
  });

  if (!res.ok) {
    throw new Error(`PingPay session fetch failed: ${res.status}`);
  }

  const data = await res.json();
  return data.session;
}

export async function verifyPayment(
  sessionId: string,
): Promise<{ verified: boolean; paymentId: string | null }> {
  try {
    const session = await getSessionStatus(sessionId);

    if (session.status === "COMPLETED") {
      return { verified: true, paymentId: session.paymentId };
    }

    return { verified: false, paymentId: null };
  } catch {
    return { verified: false, paymentId: null };
  }
}
