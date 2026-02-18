"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const CHAIN_OPTIONS = [
  { id: "ethereum", tld: ".eth", color: "#627EEA" },
  { id: "solana", tld: ".sol", color: "#9945FF" },
  { id: "near", tld: ".near", color: "#00EC97" },
  { id: "base", tld: ".base.eth", color: "#0052FF" },
  { id: "arbitrum", tld: ".arb", color: "#28A0F0" },
];

export function SearchBox() {
  const [query, setQuery] = useState("");
  const [selectedChains, setSelectedChains] = useState<string[]>(["ethereum", "solana", "near", "base", "arbitrum"]);
  const router = useRouter();

  function toggleChain(id: string) {
    setSelectedChains((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id],
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = query.trim().toLowerCase().replace(/[^a-z0-9-]/g, "");
    if (!trimmed) return;

    const names = selectedChains
      .map((id) => {
        const chain = CHAIN_OPTIONS.find((c) => c.id === id);
        return chain ? `${trimmed}${chain.tld}` : null;
      })
      .filter(Boolean);

    router.push(`/search?names=${names.join(",")}`);
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-border-subtle">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-text-tertiary">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <span className="text-xs font-medium text-text-secondary tracking-wide">Manual Search</span>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-5">
          <div className="relative">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="myname"
              className="w-full h-14 rounded-xl bg-bg-elevated border border-border-subtle
                text-lg text-text-primary placeholder:text-text-tertiary
                focus:outline-none focus:border-accent/30 focus:ring-1 focus:ring-accent/8
                transition-all duration-200 pl-5 pr-16 font-mono tracking-wide"
            />
            <button
              type="submit"
              disabled={!query.trim() || selectedChains.length === 0}
              className="absolute right-2 top-1/2 -translate-y-1/2 h-10 px-5 rounded-full
                bg-accent text-[#050505] text-sm font-semibold
                disabled:opacity-25 disabled:cursor-not-allowed
                hover:bg-accent-strong transition-all duration-200 cursor-pointer"
            >
              Go
            </button>
          </div>

          <div>
            <p className="text-[11px] text-text-tertiary mb-2.5 uppercase tracking-wider font-medium">Chains</p>
            <div className="flex flex-wrap gap-2">
              {CHAIN_OPTIONS.map((chain) => {
                const active = selectedChains.includes(chain.id);
                return (
                  <button
                    key={chain.id}
                    type="button"
                    onClick={() => toggleChain(chain.id)}
                    className={`
                      flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-full border transition-all duration-200 cursor-pointer font-mono
                      ${active
                        ? "border-opacity-25 text-opacity-100"
                        : "bg-bg-surface border-border-subtle text-text-tertiary hover:text-text-secondary hover:border-border-default"
                      }
                    `}
                    style={active ? {
                      color: chain.color,
                      borderColor: `${chain.color}40`,
                      backgroundColor: `${chain.color}10`,
                    } : undefined}
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: active ? chain.color : "currentColor", opacity: active ? 1 : 0.4 }}
                    />
                    {chain.tld}
                  </button>
                );
              })}
            </div>
          </div>
        </form>

        <p className="mt-10 text-[11px] text-text-tertiary tracking-wide">
          Checks availability across selected chains
        </p>
      </div>
    </div>
  );
}
