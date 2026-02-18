import { getEvmWalletClient, getEvmPublicClient } from "@/lib/wallets/evm";
import { randomSecret } from "@/lib/utils/crypto";

const CONTROLLER = "0xb7da95ec908cba7587b2243ca45d5a2fa92ce618" as const;
const RESOLVER = "0xd64b43a3C74100e6fD9E88c1E96ee01F6f41B5c0" as const;

const CONTROLLER_ABI = [
  {
    name: "rentPrice",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "name", type: "string" },
      { name: "duration", type: "uint256" },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "makeCommitment",
    type: "function",
    stateMutability: "pure",
    inputs: [
      { name: "name", type: "string" },
      { name: "owner", type: "address" },
      { name: "secret", type: "bytes32" },
    ],
    outputs: [{ name: "", type: "bytes32" }],
  },
  {
    name: "commit",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "commitment", type: "bytes32" }],
    outputs: [],
  },
  {
    name: "registerWithConfig",
    type: "function",
    stateMutability: "payable",
    inputs: [
      { name: "name", type: "string" },
      { name: "owner", type: "address" },
      { name: "duration", type: "uint256" },
      { name: "secret", type: "bytes32" },
      { name: "resolver", type: "address" },
      { name: "addr", type: "address" },
    ],
    outputs: [],
  },
  {
    name: "available",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "name", type: "string" }],
    outputs: [{ name: "", type: "bool" }],
  },
] as const;

const ONE_YEAR = BigInt(365 * 24 * 60 * 60);

export async function getArbRentPrice(label: string): Promise<bigint> {
  const pub = getEvmPublicClient("arbitrum");
  return pub.readContract({
    address: CONTROLLER,
    abi: CONTROLLER_ABI,
    functionName: "rentPrice",
    args: [label, ONE_YEAR],
  });
}

export async function registerArbitrum(
  label: string,
  ownerAddress: string,
  onProgress?: (step: string) => void,
): Promise<{ txHash: string }> {
  const wallet = getEvmWalletClient("arbitrum");
  const pub = getEvmPublicClient("arbitrum");
  const owner = ownerAddress as `0x${string}`;
  const secret = randomSecret();

  onProgress?.("Calculating commitment...");

  const commitment = await pub.readContract({
    address: CONTROLLER,
    abi: CONTROLLER_ABI,
    functionName: "makeCommitment",
    args: [label, owner, secret],
  });

  onProgress?.("Submitting commitment...");

  const commitHash = await wallet.writeContract({
    address: CONTROLLER,
    abi: CONTROLLER_ABI,
    functionName: "commit",
    args: [commitment],
  });

  await pub.waitForTransactionReceipt({ hash: commitHash });

  onProgress?.("Waiting 15s for commitment to mature...");
  await new Promise((r) => setTimeout(r, 15000));

  const rentPrice = await getArbRentPrice(label);
  const valueWithBuffer = (rentPrice * BigInt(110)) / BigInt(100);

  onProgress?.("Registering name on-chain...");

  const registerHash = await wallet.writeContract({
    address: CONTROLLER,
    abi: CONTROLLER_ABI,
    functionName: "registerWithConfig",
    args: [label, owner, ONE_YEAR, secret, RESOLVER, owner],
    value: valueWithBuffer,
  });

  await pub.waitForTransactionReceipt({ hash: registerHash });

  return { txHash: registerHash };
}
