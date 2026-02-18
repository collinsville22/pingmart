"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface PaymentButtonProps {
  paymentUrl: string;
  orderId: string;
}

export function PaymentButton({ paymentUrl, orderId }: PaymentButtonProps) {
  const [loading, setLoading] = useState(false);
  const [paid, setPaid] = useState(false);

  function handlePay() {
    setLoading(true);
    setPaid(true);
    window.open(paymentUrl, "_blank");
    setLoading(false);
  }

  return (
    <div className="space-y-4">
      <Button
        size="lg"
        onClick={handlePay}
        loading={loading}
        className="w-full animate-pulse-glow text-base font-bold tracking-wide"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
          <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
          <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
        </svg>
        Pay with PingPay
      </Button>

      {paid && (
        <Link
          href={`/order/${orderId}`}
          className="flex items-center justify-center gap-2 w-full rounded-full border border-accent/25 bg-accent/5 px-5 py-3 text-sm font-medium text-accent hover:bg-accent/10 transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          I&apos;ve paid — check order status
        </Link>
      )}

      <p className="text-center text-xs text-text-tertiary leading-relaxed">
        {paid
          ? "Complete payment in the PingPay tab, then click above."
          : "Pay with any crypto or fiat currency. Opens PingPay checkout in a new tab."}
      </p>
    </div>
  );
}
