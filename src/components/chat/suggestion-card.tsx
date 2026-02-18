"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChainBadge } from "@/components/ui/chain-badge";
import { formatPrice, extractSld, extractTld } from "@/lib/utils/format";
import type { Chain } from "@/types";

const WALLET_PLACEHOLDERS: Record<string, string> = {
  ethereum: "0x...",
  base: "0x...",
  arbitrum: "0x...",
  solana: "So...",
  near: "yourname.near",
};

interface SuggestionCardProps {
  domain: string;
  available: boolean;
  price: number | null;
  premium?: boolean;
  chain?: Chain;
}

export function SuggestionCard({ domain, available, price, premium, chain }: SuggestionCardProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [walletAddress, setWalletAddress] = useState("");
  const [showWallet, setShowWallet] = useState(false);
  const [error, setError] = useState("");

  const sld = extractSld(domain);
  const tld = extractTld(domain);
  const chainId = chain || "ethereum";

  async function handleRegister() {
    if (!showWallet) {
      setShowWallet(true);
      return;
    }
    if (!walletAddress.trim()) {
      setError("Enter wallet address");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: domain,
          chain: chainId,
          ownerAddress: walletAddress.trim(),
        }),
      });
      const data = await res.json();
      if (data.orderId) {
        router.push(`/checkout/${data.orderId}`);
      } else if (data.error) {
        setError(data.error.message || "Invalid address");
        setLoading(false);
      }
    } catch {
      setError("Failed");
      setLoading(false);
    }
  }

  return (
    <div
      className={`
        p-3.5 rounded-xl border transition-all duration-300
        ${available
          ? "bg-bg-surface border-border-subtle hover:border-accent/25"
          : "bg-bg-surface/40 border-border-subtle/40 opacity-45"
        }
      `}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className={`w-2 h-2 rounded-full shrink-0 ${available ? "bg-accent" : "bg-text-tertiary"}`} />
          <div className="min-w-0">
            <div className="font-mono text-sm truncate">
              <span className="text-text-primary">{sld}</span>
              <span className="text-accent">.{tld}</span>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              {chain && <ChainBadge chain={chain} />}
              {available && price !== null && (
                <span className="text-xs text-text-secondary">{formatPrice(price)}</span>
              )}
              {premium && <span className="text-[10px] text-warning font-mono">PREMIUM</span>}
              {!available && <span className="text-xs text-text-tertiary">Taken</span>}
            </div>
          </div>
        </div>

        {available && (
          <Button size="sm" onClick={handleRegister} loading={loading} className="shrink-0">
            {showWallet ? "Go" : "Register"}
          </Button>
        )}
      </div>

      {showWallet && available && (
        <div className="mt-3 pt-3 border-t border-border-subtle/50 animate-fade-in">
          <input
            type="text"
            value={walletAddress}
            onChange={(e) => { setWalletAddress(e.target.value); setError(""); }}
            placeholder={WALLET_PLACEHOLDERS[chainId]}
            className="w-full px-3 py-2 rounded-lg bg-bg-elevated border border-border-subtle text-text-primary text-xs font-mono placeholder:text-text-tertiary/40 focus:outline-none focus:border-accent/40 transition-colors"
          />
          {error && <p className="text-[10px] text-red-400 mt-1">{error}</p>}
        </div>
      )}
    </div>
  );
}
