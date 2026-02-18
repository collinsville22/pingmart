import type { Order } from "@/types";
import { formatPrice } from "@/lib/utils/format";
import { extractSld, extractTld } from "@/lib/utils/format";
import { ChainBadge } from "@/components/ui/chain-badge";
import { getPeriodLabel, getBasePrice, PROCESSING_FEE } from "@/lib/naming/pricing";

export function OrderSummary({ order }: { order: Order }) {
  const sld = extractSld(order.domain);
  const tld = extractTld(order.domain);
  const label = order.domain.split(".")[0];
  const basePrice = getBasePrice(order.chain, label);
  const ownerAddress = order.owner_address;

  return (
    <div className="rounded-2xl bg-bg-surface border border-border-subtle overflow-hidden">
      <div className="p-6 space-y-5">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-accent/8 border border-accent/15 flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-accent">
              <circle cx="12" cy="12" r="10" />
              <path d="M2 12h20" />
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            </svg>
          </div>
          <div>
            <p className="font-mono text-xl tracking-wide">
              <span className="text-text-primary">{sld}</span>
              <span className="text-accent">.{tld}</span>
            </p>
            <div className="flex items-center gap-2 mt-1">
              <ChainBadge chain={order.chain} />
              <span className="text-xs text-text-tertiary">
                {getPeriodLabel(order.chain)}
              </span>
            </div>
          </div>
        </div>

        <div className="border-t border-border-subtle pt-5 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-text-secondary">Name</span>
            <span className="text-text-primary font-mono">{order.domain}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-text-secondary">Chain</span>
            <span className="text-text-primary capitalize">{order.chain}</span>
          </div>
          {ownerAddress && (
            <div className="flex justify-between text-sm">
              <span className="text-text-secondary">Owner</span>
              <span className="text-text-primary font-mono text-xs truncate max-w-[200px]">{ownerAddress}</span>
            </div>
          )}
          <div className="border-t border-border-subtle/50 pt-3 space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-text-tertiary">Registration</span>
              <span className="text-text-secondary font-mono">{formatPrice(basePrice)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-text-tertiary">Processing fee</span>
              <span className="text-text-secondary font-mono">{formatPrice(PROCESSING_FEE)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center px-6 py-4 bg-bg-elevated border-t border-border-subtle">
        <span className="text-sm font-medium text-text-secondary">Total</span>
        <span className="text-xl font-mono font-bold text-accent">
          {formatPrice(order.price_usd)}
        </span>
      </div>
    </div>
  );
}
