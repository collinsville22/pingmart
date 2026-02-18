import { createPublicClient, http, namehash } from "viem";
import { mainnet, base, arbitrum } from "viem/chains";
import type { Chain, DomainCheckResult } from "@/types";
import { CHAINS, parseName } from "./chains";
import { getPrice } from "./pricing";

const ethClient = createPublicClient({
  chain: mainnet,
  transport: http("https://ethereum-rpc.publicnode.com"),
});

const baseClient = createPublicClient({
  chain: base,
  transport: http("https://mainnet.base.org"),
});

const arbClient = createPublicClient({
  chain: arbitrum,
  transport: http("https://arb1.arbitrum.io/rpc"),
});

const ENS_REGISTRY = "0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e" as const;
const ENS_REGISTRY_ABI = [
  {
    name: "owner",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "node", type: "bytes32" }],
    outputs: [{ name: "", type: "address" }],
  },
] as const;

const BASENAMES_REGISTRAR = "0x4cCb0BB02FCABA27e82a56646E81d8c5bC4119a5" as const;
const BASENAMES_ABI = [
  {
    name: "available",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "name", type: "string" }],
    outputs: [{ name: "", type: "bool" }],
  },
] as const;

const NEAR_RPC = "https://free.rpc.fastnear.com";
const SOLANA_SNS_PROXY = "https://sns-sdk-proxy.bonfida.workers.dev";

export async function checkNames(names: string[]): Promise<DomainCheckResult[]> {
  const parsed = names
    .map((n) => ({ raw: n, parsed: parseName(n) }))
    .filter((x): x is { raw: string; parsed: NonNullable<typeof x.parsed> } => x.parsed !== null);

  const results = await Promise.allSettled(
    parsed.map(({ parsed: p }) => checkSingle(p.label, p.chain)),
  );

  return results.map((r, i) => {
    if (r.status === "fulfilled") return r.value;
    const { label, chain } = parsed[i].parsed;
    return fallbackResult(label, chain, false);
  });
}

export async function checkNameOnChain(label: string, chain: Chain): Promise<DomainCheckResult> {
  try {
    return await checkSingle(label, chain);
  } catch {
    return fallbackResult(label, chain, false);
  }
}

async function checkSingle(label: string, chain: Chain): Promise<DomainCheckResult> {
  switch (chain) {
    case "ethereum":
      return checkENS(label);
    case "solana":
      return checkSolanaSNS(label);
    case "near":
      return checkNEAR(label);
    case "base":
      return checkBase(label);
    case "arbitrum":
      return checkArbitrum(label);
  }
}

function fallbackResult(label: string, chain: Chain, available: boolean): DomainCheckResult {
  const info = CHAINS[chain];
  return {
    domain: `${label}${info.tld}`,
    label,
    chain,
    tld: info.tld,
    available,
    premium: false,
    price: available ? getPrice(chain, label) : null,
    registrationUrl: info.registrationUrl + encodeURIComponent(label),
  };
}

async function checkENS(label: string): Promise<DomainCheckResult> {
  const fullName = `${label}.eth`;
  const chain: Chain = "ethereum";

  try {
    const node = namehash(fullName);
    const owner = await ethClient.readContract({
      address: ENS_REGISTRY,
      abi: ENS_REGISTRY_ABI,
      functionName: "owner",
      args: [node],
    });

    const zeroAddr = "0x0000000000000000000000000000000000000000";
    const available = owner === zeroAddr;

    return {
      domain: fullName,
      label,
      chain,
      tld: ".eth",
      available,
      premium: label.length <= 3,
      price: available ? getPrice(chain, label) : null,
      registrationUrl: `https://app.ens.domains/${fullName}`,
    };
  } catch {
    return fallbackResult(label, chain, false);
  }
}

async function checkSolanaSNS(label: string): Promise<DomainCheckResult> {
  const fullName = `${label}.sol`;
  const chain: Chain = "solana";

  try {
    const res = await fetch(
      `${SOLANA_SNS_PROXY}/resolve/${label}`,
      { signal: AbortSignal.timeout(8000) },
    );

    const json = await res.json();

    const isRegistered = json.s === "ok" && !!json.result;
    const available = !isRegistered;

    return {
      domain: fullName,
      label,
      chain,
      tld: ".sol",
      available,
      premium: label.length <= 3,
      price: available ? getPrice(chain, label) : null,
      registrationUrl: `https://www.sns.id/domain?domain=${label}`,
    };
  } catch {
    return fallbackResult(label, chain, false);
  }
}

async function checkNEAR(label: string): Promise<DomainCheckResult> {
  const fullName = `${label}.near`;
  const chain: Chain = "near";

  try {
    const res = await fetch(NEAR_RPC, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "query",
        params: {
          request_type: "view_account",
          finality: "final",
          account_id: fullName,
        },
      }),
      signal: AbortSignal.timeout(8000),
    });

    const json = await res.json();

    const available = !!json.error && json.error?.cause?.name === "UNKNOWN_ACCOUNT";

    return {
      domain: fullName,
      label,
      chain,
      tld: ".near",
      available,
      premium: label.length <= 3,
      price: available ? getPrice(chain, label) : null,
      registrationUrl: `https://near.org/`,
    };
  } catch {
    return fallbackResult(label, chain, false);
  }
}

async function checkBase(label: string): Promise<DomainCheckResult> {
  const fullName = `${label}.base.eth`;
  const chain: Chain = "base";

  try {
    const available = await baseClient.readContract({
      address: BASENAMES_REGISTRAR,
      abi: BASENAMES_ABI,
      functionName: "available",
      args: [label],
    });

    return {
      domain: fullName,
      label,
      chain,
      tld: ".base.eth",
      available,
      premium: label.length <= 3,
      price: available ? getPrice(chain, label) : null,
      registrationUrl: `https://www.base.org/names?name=${label}`,
    };
  } catch {
    return fallbackResult(label, chain, false);
  }
}

const ARB_CONTROLLER = "0xb7da95ec908cba7587b2243ca45d5a2fa92ce618" as const;
const ARB_CONTROLLER_ABI = [
  {
    name: "available",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "name", type: "string" }],
    outputs: [{ name: "", type: "bool" }],
  },
] as const;

async function checkArbitrum(label: string): Promise<DomainCheckResult> {
  const fullName = `${label}.arb`;
  const chain: Chain = "arbitrum";

  try {
    const available = await arbClient.readContract({
      address: ARB_CONTROLLER,
      abi: ARB_CONTROLLER_ABI,
      functionName: "available",
      args: [label],
    });

    return {
      domain: fullName,
      label,
      chain,
      tld: ".arb",
      available,
      premium: label.length <= 3,
      price: available ? getPrice(chain, label) : null,
      registrationUrl: `https://arb.space.id/name/${label}.arb`,
    };
  } catch {
    return fallbackResult(label, chain, false);
  }
}
