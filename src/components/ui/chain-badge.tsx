import type { Chain } from "@/types";

const CHAIN_META: Record<Chain, { label: string; color: string }> = {
  ethereum: { label: "ETH", color: "#627EEA" },
  solana: { label: "SOL", color: "#9945FF" },
  near: { label: "NEAR", color: "#00EC97" },
  base: { label: "BASE", color: "#0052FF" },
  arbitrum: { label: "ARB", color: "#28A0F0" },
};

export function ChainBadge({ chain }: { chain: Chain }) {
  const meta = CHAIN_META[chain];
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold tracking-wider uppercase border"
      style={{
        color: meta.color,
        borderColor: `${meta.color}30`,
        backgroundColor: `${meta.color}10`,
      }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full"
        style={{ backgroundColor: meta.color }}
      />
      {meta.label}
    </span>
  );
}
