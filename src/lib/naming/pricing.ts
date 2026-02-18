import type { Chain } from "@/types";

export const PROCESSING_FEE = 1.0;

export function getBasePrice(chain: Chain, label: string): number {
  switch (chain) {
    case "ethereum": {
      if (label.length <= 3) return 640;
      if (label.length === 4) return 160;
      return 8;
    }
    case "solana": {
      if (label.length <= 1) return 750;
      if (label.length === 2) return 700;
      if (label.length === 3) return 640;
      if (label.length === 4) return 160;
      return 20;
    }
    case "near":
      return 0.5;
    case "base": {
      if (label.length <= 3) return 100;
      if (label.length === 4) return 10;
      return 0.1;
    }
    case "arbitrum": {
      if (label.length <= 3) return 640;
      if (label.length === 4) return 160;
      return 8;
    }
  }
}

export function getPrice(chain: Chain, label: string): number {
  return getBasePrice(chain, label) + PROCESSING_FEE;
}

export function getPriceLabel(chain: Chain): string {
  switch (chain) {
    case "ethereum":
    case "arbitrum":
      return "/yr";
    case "solana":
      return "";
    case "near":
      return "";
    case "base":
      return "/yr";
  }
}

export function getPeriodLabel(chain: Chain): string {
  switch (chain) {
    case "ethereum":
    case "arbitrum":
      return "1 year registration";
    case "solana":
      return "Permanent";
    case "near":
      return "Account creation";
    case "base":
      return "1 year registration";
  }
}
