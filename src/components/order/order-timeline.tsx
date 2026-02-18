"use client";

import { useEffect, useState, useCallback } from "react";
import type { Chain, OrderStatus, OrderWithEvents } from "@/types";
import { OrderStatusBadge } from "./order-status-badge";
import { formatDate } from "@/lib/utils/format";
import { Spinner } from "@/components/ui/spinner";
import { ChainBadge } from "@/components/ui/chain-badge";

interface TxLink {
  label: string;
  url: string;
}

interface TimelineStep {
  label: string;
  status: "done" | "active" | "pending";
  timestamp?: string;
  detail?: string;
  txLink?: TxLink;
}

function getExplorerUrl(chain: Chain, txHash: string): string {
  switch (chain) {
    case "ethereum":
      return `https://etherscan.io/tx/${txHash}`;
    case "base":
      return `https://basescan.org/tx/${txHash}`;
    case "near":
      return `https://nearblocks.io/txns/${txHash}`;
    case "solana":
      return `https://solscan.io/tx/${txHash}`;
    case "arbitrum":
      return `https://arbiscan.io/tx/${txHash}`;
  }
}

function buildTimeline(order: OrderWithEvents): TimelineStep[] {
  const o = order.order;
  const steps: TimelineStep[] = [];

  const statusOrder: OrderStatus[] = [
    "PENDING_PAYMENT",
    "PAYMENT_CONFIRMED",
    "SWAPPING",
    "REGISTERING",
    "REGISTERED",
  ];
  const currentIndex = statusOrder.indexOf(o.status);
  const isFailed = o.status === "REGISTRATION_FAILED";
  const isExpired = o.status === "EXPIRED";
  const swapTx = o.swap_tx;
  const regTx = o.registration_tx;

  steps.push({
    label: "Order Created",
    status: "done",
    timestamp: o.created_at,
    detail: `Order ${o.id}`,
  });

  if (isExpired) {
    steps.push({ label: "Payment Expired", status: "done" });
    return steps;
  }

  steps.push({
    label: "Payment Confirmed",
    status: currentIndex >= 1 ? "done" : currentIndex === 0 ? "active" : "pending",
    timestamp: o.paid_at || undefined,
    txLink: o.pingpay_payment_id
      ? { label: `Payment ${o.pingpay_payment_id.slice(0, 12)}...`, url: `https://pay.pingpay.io/dashboard` }
      : undefined,
  });

  if (o.chain !== "near") {
    steps.push({
      label: `Swapping USDC → ${o.chain === "solana" ? "SOL" : "ETH"}`,
      status: currentIndex >= 2 ? "done" : currentIndex === 1 ? "active" : "pending",
      txLink: swapTx
        ? { label: `${swapTx.slice(0, 10)}...${swapTx.slice(-6)}`, url: getExplorerUrl(o.chain, swapTx) }
        : undefined,
    });
  }

  const regIdx = o.chain !== "near" ? 3 : 2;
  steps.push({
    label: "Registering On-Chain",
    status: currentIndex >= regIdx ? "done" : currentIndex === regIdx - 1 ? "active" : "pending",
  });

  if (isFailed) {
    steps.push({
      label: "Registration Failed",
      status: "done",
      detail: o.registration_error || "An error occurred",
    });
  } else {
    steps.push({
      label: "Name Registered",
      status: currentIndex >= regIdx + 1 ? "done" : currentIndex === regIdx ? "active" : "pending",
      timestamp: o.registered_at || undefined,
      txLink: regTx
        ? { label: `${regTx.slice(0, 10)}...${regTx.slice(-6)}`, url: getExplorerUrl(o.chain, regTx) }
        : undefined,
    });
  }

  return steps;
}

export function OrderTimeline({ initialData }: { initialData: OrderWithEvents }) {
  const [data, setData] = useState(initialData);
  const [retrying, setRetrying] = useState(false);
  const isTerminal = ["REGISTERED", "REGISTRATION_FAILED", "EXPIRED"].includes(data.order.status) && !retrying;

  const poll = useCallback(async () => {
    const res = await fetch(`/api/orders/${data.order.id}`);
    if (res.ok) {
      const json = await res.json();
      setData(json);
      if (retrying && json.order.status !== "REGISTRATION_FAILED") {
        setRetrying(false);
      }
    }
  }, [data.order.id, retrying]);

  useEffect(() => {
    if (isTerminal) return;
    const interval = setInterval(poll, 3000);
    return () => clearInterval(interval);
  }, [isTerminal, poll]);

  async function handleRetry() {
    setRetrying(true);
    await fetch(`/api/orders/${data.order.id}/retry`, { method: "POST" });
    setTimeout(poll, 1000);
  }

  const timeline = buildTimeline(data);
  const parts = data.order.domain.split(".");
  const sld = parts.slice(0, -1).join(".");
  const tld = parts[parts.length - 1];

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-mono text-2xl sm:text-3xl tracking-wide">
            <span className="text-text-primary">{sld}</span>
            <span className="text-accent">.{tld}</span>
          </p>
          <div className="flex items-center gap-2 mt-1.5">
            <ChainBadge chain={data.order.chain} />
            <span className="text-xs text-text-tertiary font-mono tracking-wide">
              {data.order.id}
            </span>
          </div>
        </div>
        <OrderStatusBadge status={data.order.status} />
      </div>

      {data.order.status === "REGISTRATION_FAILED" && !retrying && (
        <div className="rounded-2xl border border-error/20 bg-error/5 p-5 space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-full bg-error/12 flex items-center justify-center shrink-0">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-error">
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-error">Registration Failed</p>
              <p className="text-xs text-text-secondary mt-0.5">
                {data.order.registration_error || "An error occurred during registration"}
              </p>
            </div>
          </div>
          <button
            onClick={handleRetry}
            className="w-full rounded-xl border border-accent/25 bg-accent/10 px-4 py-2.5 text-sm font-medium text-accent hover:bg-accent/20 transition-colors cursor-pointer"
          >
            Retry Registration
          </button>
        </div>
      )}

      {data.order.status === "REGISTERED" && (
        <div className="rounded-2xl border border-success/20 bg-success/5 p-5 space-y-3">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-full bg-success/12 flex items-center justify-center shrink-0">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-success">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-success">Name is yours!</p>
              <p className="text-xs text-text-secondary mt-0.5">
                {data.order.domain} has been registered on-chain
              </p>
            </div>
          </div>
          {data.order.registration_tx && (
            <a
              href={getExplorerUrl(data.order.chain, data.order.registration_tx)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full rounded-xl border border-success/20 bg-success/8 px-4 py-2.5 text-xs font-mono text-success hover:bg-success/15 transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
              View Transaction on Explorer
            </a>
          )}
        </div>
      )}

      <div className="rounded-2xl bg-bg-surface border border-border-subtle p-6">
        <div className="space-y-0">
          {timeline.map((step, i) => {
            const isLast = i === timeline.length - 1;
            return (
              <div key={step.label} className="flex gap-4">
                <div className="flex flex-col items-center">
                  {step.status === "done" ? (
                    <div className="w-7 h-7 rounded-full bg-accent/12 border border-accent/25 flex items-center justify-center shrink-0">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-accent">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </div>
                  ) : step.status === "active" ? (
                    <div className="w-7 h-7 rounded-full border-2 border-accent flex items-center justify-center shrink-0 animate-pulse-glow">
                      <Spinner size={12} />
                    </div>
                  ) : (
                    <div className="w-7 h-7 rounded-full border border-border-default bg-bg-elevated shrink-0" />
                  )}
                  {!isLast && (
                    <div
                      className={`w-px flex-1 min-h-[32px] ${
                        step.status === "done" ? "bg-accent/20" : "bg-border-subtle"
                      }`}
                    />
                  )}
                </div>
                <div className={`pb-6 ${isLast ? "pb-0" : ""}`}>
                  <p className={`text-sm font-medium ${step.status === "pending" ? "text-text-tertiary" : "text-text-primary"}`}>
                    {step.label}
                  </p>
                  {step.timestamp && (
                    <p className="text-xs text-text-tertiary mt-0.5">
                      {formatDate(step.timestamp)}
                    </p>
                  )}
                  {step.detail && (
                    <p className="text-xs text-text-tertiary mt-0.5 font-mono tracking-wide">
                      {step.detail}
                    </p>
                  )}
                  {step.txLink && (
                    <a
                      href={step.txLink.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-accent hover:text-accent/80 mt-1 font-mono tracking-wide transition-colors"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                        <polyline points="15 3 21 3 21 9" />
                        <line x1="10" y1="14" x2="21" y2="3" />
                      </svg>
                      {step.txLink.label}
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {!isTerminal && (
        <p className="text-[11px] text-text-tertiary text-center tracking-wide uppercase">
          Auto-updating every 5s
        </p>
      )}
    </div>
  );
}
