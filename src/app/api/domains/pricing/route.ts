import { NextResponse } from "next/server";
import { CHAINS } from "@/lib/naming/chains";
import { getPrice, getPriceLabel, getPeriodLabel } from "@/lib/naming/pricing";
import type { Chain } from "@/types";

export async function GET() {
  const pricing: Record<string, {
    chain: Chain;
    tld: string;
    price: number;
    priceLabel: string;
    period: string;
  }> = {};

  for (const [id, info] of Object.entries(CHAINS)) {
    const chain = id as Chain;
    pricing[chain] = {
      chain,
      tld: info.tld,
      price: getPrice(chain, "example"),
      priceLabel: getPriceLabel(chain),
      period: getPeriodLabel(chain),
    };
  }

  return NextResponse.json(pricing);
}
