import { getEvmWalletClient, getEvmPublicClient } from "@/lib/wallets/evm";

const CONTROLLER = "0xa7d2607c6BD39Ae9521e514026CBB078405Ab322" as const;
const BASE_RESOLVER = "0x426fA03fB86E510d0Dd9F70335Cf102a98b10875" as const;

const CONTROLLER_ABI = [
  {
    name: "registerPrice",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "name", type: "string" },
      { name: "duration", type: "uint256" },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "register",
    type: "function",
    stateMutability: "payable",
    inputs: [
      {
        name: "request",
        type: "tuple",
        components: [
          { name: "name", type: "string" },
          { name: "owner", type: "address" },
          { name: "duration", type: "uint256" },
          { name: "resolver", type: "address" },
          { name: "data", type: "bytes[]" },
          { name: "reverseRecord", type: "bool" },
          { name: "coinTypes", type: "uint256[]" },
          { name: "signatureExpiry", type: "uint256" },
          { name: "signature", type: "bytes" },
        ],
      },
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

export async function getBaseRegisterPrice(label: string): Promise<bigint> {
  const pub = getEvmPublicClient("base");
  return pub.readContract({
    address: CONTROLLER,
    abi: CONTROLLER_ABI,
    functionName: "registerPrice",
    args: [label, ONE_YEAR],
  });
}

export async function registerBasename(
  label: string,
  ownerAddress: string,
  onProgress?: (step: string) => void,
): Promise<{ txHash: string }> {
  const wallet = getEvmWalletClient("base");
  const pub = getEvmPublicClient("base");
  const owner = ownerAddress as `0x${string}`;

  onProgress?.("Fetching registration price...");
  const price = await getBaseRegisterPrice(label);
  const valueWithBuffer = (price * BigInt(110)) / BigInt(100);

  onProgress?.("Registering name on Base...");

  const hash = await wallet.writeContract({
    address: CONTROLLER,
    abi: CONTROLLER_ABI,
    functionName: "register",
    args: [
      {
        name: label,
        owner,
        duration: ONE_YEAR,
        resolver: BASE_RESOLVER,
        data: [],
        reverseRecord: false,
        coinTypes: [],
        signatureExpiry: BigInt(0),
        signature: "0x",
      },
    ],
    value: valueWithBuffer,
  });

  await pub.waitForTransactionReceipt({ hash });

  return { txHash: hash };
}
