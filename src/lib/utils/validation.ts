import { z } from "zod";

const NAME_REGEX = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?\.(eth|sol|near|base\.eth|arb)$/i;
const EVM_ADDRESS_REGEX = /^0x[a-fA-F0-9]{40}$/;
const SOL_ADDRESS_REGEX = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
const NEAR_ADDRESS_REGEX = /^[a-z0-9_-]+\.near$/;

export const NameSchema = z
  .string()
  .min(1)
  .max(253)
  .regex(NAME_REGEX, "Invalid name format");

export const ChainSchema = z.enum(["ethereum", "solana", "near", "base", "arbitrum"]);

export const OwnerAddressSchema = z.string().min(1, "Wallet address required");

export const CreateOrderSchema = z
  .object({
    name: NameSchema,
    chain: ChainSchema,
    ownerAddress: OwnerAddressSchema,
  })
  .refine(
    (data) => {
      switch (data.chain) {
        case "ethereum":
        case "base":
        case "arbitrum":
          return EVM_ADDRESS_REGEX.test(data.ownerAddress);
        case "solana":
          return SOL_ADDRESS_REGEX.test(data.ownerAddress);
        case "near":
          return NEAR_ADDRESS_REGEX.test(data.ownerAddress) || data.ownerAddress.length === 64;
        default:
          return false;
      }
    },
    { message: "Invalid wallet address for selected chain" },
  );

export const NameCheckQuerySchema = z.object({
  names: z
    .string()
    .transform((s) => s.split(",").map((d) => d.trim().toLowerCase()))
    .pipe(z.array(z.string().min(1)).min(1).max(50)),
});

export const PingPayWebhookSchema = z.object({
  id: z.string(),
  type: z.string(),
  resourceId: z.string(),
  data: z.record(z.string(), z.unknown()).optional(),
  createdAt: z.string(),
});
