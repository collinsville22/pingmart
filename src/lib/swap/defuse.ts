import type { Chain } from "@/types";
import { transferUsdc } from "./near-transfer";
import { getNearAccountId } from "@/lib/wallets/near";

const API_BASE = "https://1click.chaindefuser.com";

const USDC_NEAR = "nep141:17208628f84f5d6ad33f0da3bbbeb27ffcb398eac501a31bd6ad2011e36133a1";

const DEST_ASSETS: Record<Exclude<Chain, "near">, string> = {
  ethereum: "nep141:eth.omft.near",
  solana: "nep141:sol.omft.near",
  base: "nep141:base.omft.near",
  arbitrum: "nep141:arb.omft.near",
};

interface QuoteResponse {
  quote: {
    depositAddress: string;
    amountIn: string;
    amountOut: string;
    amountInUsd: string;
    amountOutUsd: string;
    amountInFormatted?: string;
    amountOutFormatted?: string;
  };
  signature: string;
  timestamp: string;
  correlationId: string;
}

interface StatusResponse {
  status:
    | "PENDING_DEPOSIT"
    | "KNOWN_DEPOSIT_TX"
    | "PROCESSING"
    | "SUCCESS"
    | "REFUNDED"
    | "EXPIRED";
  swapDetails: {
    originChainTxHashes: string[];
    destinationChainTxHashes: Array<string | { hash: string }>;
  };
}

export async function getSwapQuote(
  chain: Exclude<Chain, "near">,
  usdcAmount: string,
  destinationAddress: string,
): Promise<QuoteResponse> {
  const deadline = new Date(Date.now() + 30 * 60 * 1000).toISOString();
  const refundTo = await getNearAccountId();

  const body = {
    dry: false,
    swapType: "EXACT_INPUT",
    slippageTolerance: 500,
    originAsset: USDC_NEAR,
    depositType: "ORIGIN_CHAIN",
    destinationAsset: DEST_ASSETS[chain],
    amount: usdcAmount,
    refundTo,
    refundType: "ORIGIN_CHAIN",
    recipient: destinationAddress,
    recipientType: "DESTINATION_CHAIN",
    deadline,
  };

  const res = await fetch(`${API_BASE}/v0/quote`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(15000),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Defuse quote failed: ${res.status} ${text}`);
  }

  return res.json();
}

export async function checkSwapStatus(
  depositAddress: string,
): Promise<StatusResponse> {
  const res = await fetch(
    `${API_BASE}/v0/status?depositAddress=${depositAddress}`,
    { signal: AbortSignal.timeout(10000) },
  );
  if (!res.ok) throw new Error(`Defuse status check failed: ${res.status}`);
  return res.json();
}

export async function pollUntilComplete(
  depositAddress: string,
  maxWaitMs: number = 300000,
  intervalMs: number = 5000,
): Promise<StatusResponse> {
  const start = Date.now();
  while (Date.now() - start < maxWaitMs) {
    const status = await checkSwapStatus(depositAddress);
    if (status.status === "SUCCESS") return status;
    if (status.status === "REFUNDED") throw new Error("Swap was refunded");
    if (status.status === "EXPIRED") throw new Error("Swap expired");
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  throw new Error("Swap timed out after " + maxWaitMs / 1000 + "s");
}

function extractTxHash(
  hashes: Array<string | { hash: string }> | undefined,
): string | undefined {
  if (!hashes?.length) return undefined;
  const first = hashes[0];
  return typeof first === "string" ? first : first.hash;
}

export async function executeSwap(
  chain: Exclude<Chain, "near">,
  usdcAmount: string,
  destinationAddress: string,
): Promise<{ txHash: string | undefined; status: StatusResponse }> {
  const quoteRes = await getSwapQuote(chain, usdcAmount, destinationAddress);
  const depositAddress = quoteRes.quote.depositAddress;

  if (!depositAddress) {
    throw new Error("No deposit address in quote response");
  }

  await transferUsdc(depositAddress, usdcAmount);

  const status = await pollUntilComplete(depositAddress);
  const txHash = extractTxHash(status.swapDetails?.destinationChainTxHashes);
  return { txHash, status };
}

export function getDestinationAsset(
  chain: Exclude<Chain, "near">,
): string {
  return DEST_ASSETS[chain];
}
