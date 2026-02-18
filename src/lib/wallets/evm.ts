import {
  createWalletClient,
  createPublicClient,
  http,
  type Account,
  type Chain as ViemChain,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { mainnet, base, arbitrum } from "viem/chains";
import type { Chain } from "@/types";

type EvmChain = "ethereum" | "base" | "arbitrum";

const CHAIN_MAP: Record<EvmChain, ViemChain> = {
  ethereum: mainnet,
  base: base,
  arbitrum: arbitrum,
};

const RPC_MAP: Record<EvmChain, string> = {
  ethereum: "https://ethereum-rpc.publicnode.com",
  base: "https://mainnet.base.org",
  arbitrum: "https://arb1.arbitrum.io/rpc",
};

function getAccount(): Account {
  const key = process.env.PLATFORM_EVM_PRIVATE_KEY;
  if (!key) throw new Error("PLATFORM_EVM_PRIVATE_KEY not set");
  return privateKeyToAccount(key as `0x${string}`);
}

export function getEvmWalletClient(chain: EvmChain) {
  const account = getAccount();
  return createWalletClient({
    account,
    chain: CHAIN_MAP[chain],
    transport: http(RPC_MAP[chain]),
  });
}

export function getEvmPublicClient(chain: EvmChain) {
  return createPublicClient({
    chain: CHAIN_MAP[chain],
    transport: http(RPC_MAP[chain]),
  });
}

export function getEvmAddress(): string {
  return getAccount().address;
}
