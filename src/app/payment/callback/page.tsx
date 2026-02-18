"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Spinner } from "@/components/ui/spinner";
import { Suspense } from "react";

function CallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const orderId = searchParams.get("orderId");
    if (orderId) {
      router.replace(`/order/${orderId}`);
    } else {
      router.replace("/");
    }
  }, [searchParams, router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
      <div className="relative">
        <div className="w-20 h-20 rounded-2xl bg-accent/8 border border-accent/15 flex items-center justify-center">
          <Spinner size={28} />
        </div>
        <div className="absolute -inset-2 rounded-3xl bg-accent/5 animate-pulse-glow -z-10" />
      </div>
      <div className="text-center">
        <p className="font-display text-lg font-semibold text-text-primary mb-1">Processing payment</p>
        <p className="text-sm text-text-tertiary">Redirecting you to your order...</p>
      </div>
    </div>
  );
}

export default function PaymentCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
          <div className="w-20 h-20 rounded-2xl bg-bg-surface border border-border-subtle flex items-center justify-center">
            <Spinner size={28} />
          </div>
          <p className="text-sm text-text-tertiary">Loading...</p>
        </div>
      }
    >
      <CallbackHandler />
    </Suspense>
  );
}
