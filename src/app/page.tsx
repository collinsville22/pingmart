import { ChatPanel } from "@/components/chat/chat-panel";
import { SearchBox } from "@/components/search/search-box";

export default function HomePage() {
  return (
    <div className="dot-grid">
      <div className="relative z-10 mx-auto max-w-6xl px-5 sm:px-8 pt-12 sm:pt-20 pb-10">
        <div className="mb-12 sm:mb-16 animate-fade-in">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-px flex-1 max-w-[40px] bg-accent/40" />
            <span className="text-[11px] font-mono tracking-[0.2em] uppercase text-accent/70">
              Cross-Chain Names
            </span>
          </div>
          <h1 className="font-display text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[0.95] text-text-primary">
            Claim your Web3 name.
            <br />
            <span className="text-gradient">Across every chain.</span>
          </h1>
          <p className="mt-5 text-base sm:text-lg text-text-secondary max-w-lg leading-relaxed">
            Search names across ENS, Solana, NEAR, Base, and Arbitrum. Get AI-powered
            suggestions and pay with any crypto or fiat via PingPay.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 animate-slide-up stagger-2">
          <div className="rounded-2xl bg-bg-surface border border-border-subtle overflow-hidden h-[540px] flex flex-col transition-all duration-300 hover:border-accent/15">
            <ChatPanel />
          </div>
          <div className="rounded-2xl bg-bg-surface border border-border-subtle overflow-hidden h-[540px] flex flex-col transition-all duration-300 hover:border-accent/15">
            <SearchBox />
          </div>
        </div>

        <div className="mt-14 flex flex-wrap items-center justify-center gap-3 animate-fade-in stagger-4">
          {[
            { label: ".eth", color: "#627EEA" },
            { label: ".sol", color: "#9945FF" },
            { label: ".near", color: "#00EC97" },
            { label: ".base.eth", color: "#0052FF" },
            { label: ".arb", color: "#28A0F0" },
          ].map((chain) => (
            <div
              key={chain.label}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-bg-surface border border-border-subtle text-xs font-mono"
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: chain.color }}
              />
              <span className="text-text-secondary">{chain.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
