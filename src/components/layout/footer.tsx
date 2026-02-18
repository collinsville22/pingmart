export function Footer() {
  return (
    <footer className="w-full border-t border-border-subtle/60 mt-auto">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8">
        <div className="flex items-center gap-3 text-xs text-text-tertiary">
          <span className="text-accent font-mono font-medium">PingPay</span>
          <span className="w-1 h-1 rounded-full bg-border-default" />
          <span>ENS</span>
          <span className="w-1 h-1 rounded-full bg-border-default" />
          <span>Solana</span>
          <span className="w-1 h-1 rounded-full bg-border-default" />
          <span>NEAR</span>
          <span className="w-1 h-1 rounded-full bg-border-default" />
          <span>Base</span>
          <span className="w-1 h-1 rounded-full bg-border-default" />
          <span>Arbitrum</span>
        </div>
        <div className="text-[11px] text-text-tertiary font-mono tracking-wider uppercase">
          v0.1.0
        </div>
      </div>
    </footer>
  );
}
