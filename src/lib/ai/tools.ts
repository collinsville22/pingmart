import { z } from "zod";
import { tool } from "ai";
import { checkNames } from "@/lib/naming/client";

export const checkDomainsTool = tool({
  description:
    "Check if blockchain names are available across chains (ENS .eth, Solana .sol, NEAR .near, Base .base.eth, Arbitrum .arb). Always verify before suggesting names.",
  inputSchema: z.object({
    domains: z
      .array(z.string())
      .min(1)
      .max(30)
      .describe(
        'Full blockchain names to check, e.g. ["myname.eth", "myname.sol", "myname.near", "myname.base.eth", "myname.arb"]',
      ),
  }),
  execute: async ({ domains }: { domains: string[] }) => {
    return checkNames(domains);
  },
});
