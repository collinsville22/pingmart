import type { Chain, Order } from "@/types";
import { executeSwap } from "@/lib/swap/defuse";
import { getUsdcBalance } from "@/lib/swap/near-transfer";
import { getEvmAddress } from "@/lib/wallets/evm";
import { getNearAccountId } from "@/lib/wallets/near";
import { getMerchantSolAddress } from "@/lib/wallets/solana";
import { registerENS } from "./ens";
import { registerBasename } from "./base-names";
import { registerSolanaSNS } from "./solana-sns";
import { registerNearAccount } from "./near-account";
import { registerArbitrum } from "./arbitrum-arb";

interface RegistrationResult {
  txHash: string;
  swapTxHash?: string;
}

type ProgressCallback = (step: string) => void;

export async function registerOnChain(
  order: Order,
  onProgress?: ProgressCallback,
): Promise<RegistrationResult> {
  const label = order.domain.split(".")[0];
  const ownerAddress = order.owner_address!;
  const chain = order.chain;

  let swapTxHash: string | undefined;

  if (chain !== "near") {
    onProgress?.(`Swapping USDC to ${chain} tokens...`);

    const destAddress = await getDestinationWalletAddress(chain);

    const balance = await getUsdcBalance();
    if (BigInt(balance) === BigInt(0)) {
      throw new Error("No USDC available on NEAR for swap");
    }

    const swapResult = await executeSwap(chain as Exclude<Chain, "near">, balance, destAddress);
    swapTxHash = swapResult.txHash;
    onProgress?.("Swap complete");
  }

  let result: { txHash: string };

  switch (chain) {
    case "ethereum":
      result = await registerENS(label, ownerAddress, onProgress);
      break;
    case "base":
      result = await registerBasename(label, ownerAddress, onProgress);
      break;
    case "solana":
      result = await registerSolanaSNS(label, ownerAddress, onProgress);
      break;
    case "near":
      result = await registerNearAccount(label, ownerAddress, onProgress);
      break;
    case "arbitrum":
      result = await registerArbitrum(label, ownerAddress, onProgress);
      break;
  }

  return { txHash: result.txHash, swapTxHash };
}

async function getDestinationWalletAddress(
  chain: Exclude<Chain, "near">,
): Promise<string> {
  switch (chain) {
    case "ethereum":
    case "base":
    case "arbitrum":
      return getEvmAddress();
    case "solana":
      return getMerchantSolAddress();
  }
}

