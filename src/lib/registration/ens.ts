import { getEvmWalletClient, getEvmPublicClient } from "@/lib/wallets/evm";
import { randomSecret } from "@/lib/utils/crypto";

const CONTROLLER = "0x253553366Da8546fC250F225fe3d25d0C782303b" as const;
const PUBLIC_RESOLVER = "0x231b0Ee14048e9dCcD1d247744d114a4EB5E8E63" as const;

const CONTROLLER_ABI = [
  {
    name: "rentPrice",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "name", type: "string" },
      { name: "duration", type: "uint256" },
    ],
    outputs: [
      {
        name: "price",
        type: "tuple",
        components: [
          { name: "base", type: "uint256" },
          { name: "premium", type: "uint256" },
        ],
      },
    ],
  },
  {
    name: "makeCommitment",
    type: "function",
    stateMutability: "pure",
    inputs: [
      { name: "name", type: "string" },
      { name: "owner", type: "address" },
      { name: "duration", type: "uint256" },
      { name: "secret", type: "bytes32" },
      { name: "resolver", type: "address" },
      { name: "data", type: "bytes[]" },
      { name: "reverseRecord", type: "bool" },
      { name: "ownerControlledFuses", type: "uint16" },
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
    name: "register",
    type: "function",
    stateMutability: "payable",
    inputs: [
      { name: "name", type: "string" },
      { name: "owner", type: "address" },
      { name: "duration", type: "uint256" },
      { name: "secret", type: "bytes32" },
      { name: "resolver", type: "address" },
      { name: "data", type: "bytes[]" },
      { name: "reverseRecord", type: "bool" },
      { name: "ownerControlledFuses", type: "uint16" },
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

export async function getEnsRentPrice(label: string): Promise<bigint> {
  const pub = getEvmPublicClient("ethereum");
  const price = await pub.readContract({
    address: CONTROLLER,
    abi: CONTROLLER_ABI,
    functionName: "rentPrice",
    args: [label, ONE_YEAR],
  });
  return price.base + price.premium;
}

export async function registerENS(
  label: string,
  ownerAddress: string,
  onProgress?: (step: string) => void,
): Promise<{ txHash: string }> {
  const wallet = getEvmWalletClient("ethereum");
  const pub = getEvmPublicClient("ethereum");
  const owner = ownerAddress as `0x${string}`;
  const secret = randomSecret();

  onProgress?.("Calculating commitment...");

  const commitment = await pub.readContract({
    address: CONTROLLER,
    abi: CONTROLLER_ABI,
    functionName: "makeCommitment",
    args: [label, owner, ONE_YEAR, secret, PUBLIC_RESOLVER, [], false, 0],
  });

  onProgress?.("Submitting commitment...");

  const commitHash = await wallet.writeContract({
    address: CONTROLLER,
    abi: CONTROLLER_ABI,
    functionName: "commit",
    args: [commitment],
  });

  await pub.waitForTransactionReceipt({ hash: commitHash });

  onProgress?.("Waiting 60s for commitment to mature...");
  await new Promise((r) => setTimeout(r, 65000));

  const rentPrice = await getEnsRentPrice(label);
  const valueWithBuffer = (rentPrice * BigInt(110)) / BigInt(100);

  onProgress?.("Registering name on-chain...");

  const registerHash = await wallet.writeContract({
    address: CONTROLLER,
    abi: CONTROLLER_ABI,
    functionName: "register",
    args: [label, owner, ONE_YEAR, secret, PUBLIC_RESOLVER, [], false, 0],
    value: valueWithBuffer,
  });

  await pub.waitForTransactionReceipt({ hash: registerHash });

  return { txHash: registerHash };
}
