import type { Chain, ChainInfo } from "@/types";

export const CHAINS: Record<Chain, ChainInfo> = {
  ethereum: {
    id: "ethereum",
    name: "Ethereum",
    tld: ".eth",
    color: "#627EEA",
    registrationUrl: "https://app.ens.domains/",
    status: "live",
  },
  solana: {
    id: "solana",
    name: "Solana",
    tld: ".sol",
    color: "#9945FF",
    registrationUrl: "https://www.sns.id/",
    status: "live",
  },
  near: {
    id: "near",
    name: "NEAR",
    tld: ".near",
    color: "#00EC97",
    registrationUrl: "https://near.org/",
    status: "live",
  },
  base: {
    id: "base",
    name: "Base",
    tld: ".base.eth",
    color: "#0052FF",
    registrationUrl: "https://www.base.org/names",
    status: "live",
  },
  arbitrum: {
    id: "arbitrum",
    name: "Arbitrum",
    tld: ".arb",
    color: "#28A0F0",
    registrationUrl: "https://arb.space.id/",
    status: "live",
  },
};

export const CHAIN_LIST = Object.values(CHAINS);
export const CHAIN_IDS = Object.keys(CHAINS) as Chain[];

export function chainFromTld(tld: string): Chain | null {
  const normalized = tld.startsWith(".") ? tld : `.${tld}`;
  for (const chain of CHAIN_LIST) {
    if (chain.tld === normalized) return chain.id;
  }
  return null;
}

export function parseName(fullName: string): { label: string; chain: Chain } | null {
  const lower = fullName.toLowerCase().trim();
  if (lower.endsWith(".base.eth")) {
    return { label: lower.replace(".base.eth", ""), chain: "base" };
  }
  if (lower.endsWith(".arb")) {
    return { label: lower.replace(".arb", ""), chain: "arbitrum" };
  }
  if (lower.endsWith(".eth")) {
    return { label: lower.replace(".eth", ""), chain: "ethereum" };
  }
  if (lower.endsWith(".sol")) {
    return { label: lower.replace(".sol", ""), chain: "solana" };
  }
  if (lower.endsWith(".near")) {
    return { label: lower.replace(".near", ""), chain: "near" };
  }
  return null;
}
