"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChainBadge } from "@/components/ui/chain-badge";
import { formatPrice, extractSld, extractTld } from "@/lib/utils/format";
import type { DomainCheckResult } from "@/types";

const WALLET_PLACEHOLDERS: Record<string, string> = {
  ethereum: "0x...",
  base: "0x...",
  arbitrum: "0x...",
  solana: "So...",
  near: "yourname.near",
};

export function DomainCard({ result }: { result: DomainCheckResult }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [walletAddress, setWalletAddress] = useState("");
  const [showWalletInput, setShowWalletInput] = useState(false);
  const [error, setError] = useState("");

  const sld = extractSld(result.domain);
  const tld = extractTld(result.domain);

  async function handleRegister() {
    if (!showWalletInput) {
      setShowWalletInput(true);
      return;
    }

    if (!walletAddress.trim()) {
      setError("Enter your wallet address");
      return;
    }

    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: result.domain,
          chain: result.chain,
          ownerAddress: walletAddress.trim(),
        }),
      });
      const data = await res.json();
      if (data.orderId) {
        router.push(`/checkout/${data.orderId}`);
      } else if (data.error) {
        setError(data.error.message || "Invalid wallet address");
        setLoading(false);
      }
    } catch {
      setError("Failed to create order");
      setLoading(false);
    }
  }

  return (
    <div
      className={`
        p-5 rounded-2xl border transition-all duration-300 animate-fade-in
        ${result.available
          ? "bg-bg-surface border-border-subtle hover:border-accent/25 hover:purple-glow"
          : "bg-bg-surface/30 border-border-subtle/30"
        }
      `}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 min-w-0">
          <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${result.available ? "bg-accent" : "bg-border-default"}`} />
          <div className="min-w-0">
            <p className="font-mono text-base tracking-wide truncate">
              <span className={result.available ? "text-text-primary" : "text-text-tertiary"}>{sld}</span>
              <span className={result.available ? "text-accent" : "text-text-tertiary/50"}>.{tld}</span>
            </p>
            <div className="flex items-center gap-2 mt-1">
              <ChainBadge chain={result.chain} />
              {result.available ? (
                <>
                  {result.price !== null && (
                    <span className="text-xs text-text-secondary font-mono">{formatPrice(result.price)}</span>
                  )}
                  {result.premium && <Badge variant="warning">Premium</Badge>}
                </>
              ) : (
                <Badge variant="neutral">Taken</Badge>
              )}
            </div>
          </div>
        </div>

        {result.available && (
          <Button onClick={handleRegister} loading={loading} className="shrink-0 ml-4">
            {showWalletInput ? "Confirm" : "Register"}
          </Button>
        )}
      </div>

      {showWalletInput && result.available && (
        <div className="mt-4 pt-4 border-t border-border-subtle animate-fade-in">
          <label className="text-xs text-text-tertiary mb-2 block">
            Your {result.chain === "base" ? "Base" : result.chain.charAt(0).toUpperCase() + result.chain.slice(1)} wallet address
          </label>
          <input
            type="text"
            value={walletAddress}
            onChange={(e) => { setWalletAddress(e.target.value); setError(""); }}
            placeholder={WALLET_PLACEHOLDERS[result.chain]}
            className="w-full px-4 py-2.5 rounded-xl bg-bg-elevated border border-border-subtle text-text-primary text-sm font-mono placeholder:text-text-tertiary/40 focus:outline-none focus:border-accent/40 transition-colors"
          />
          {error && <p className="text-xs text-red-400 mt-1.5">{error}</p>}
        </div>
      )}
    </div>
  );
}
