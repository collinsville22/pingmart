import { Account } from "@near-js/accounts";
import { actionCreators } from "@near-js/transactions";
import { NEAR } from "@near-js/tokens";
import { getNearWallet, getDeps } from "@/lib/wallets/near";

const NEAR_REGISTRAR = "near";
const NEAR_RPC = "https://rpc.mainnet.fastnear.com";
const STORAGE_DEPOSIT = NEAR.toUnits("0.1");

async function fetchOwnerPublicKey(ownerAccountId: string): Promise<string> {
  const res = await fetch(NEAR_RPC, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "query",
      params: {
        request_type: "view_access_key_list",
        finality: "final",
        account_id: ownerAccountId,
      },
    }),
    signal: AbortSignal.timeout(10000),
  });

  const data = await res.json();
  const keys = data?.result?.keys;
  if (!keys?.length) {
    throw new Error(`Could not fetch public key for ${ownerAccountId}`);
  }
  return keys[0].public_key;
}

export async function registerNearAccount(
  label: string,
  ownerAccountId: string,
  onProgress?: (step: string) => void,
): Promise<{ txHash: string }> {
  const { accountId, keyPair } = await getNearWallet();
  const newAccountId = `${label}.near`;

  onProgress?.("Creating NEAR account...");

  const ownerPublicKey = await fetchOwnerPublicKey(ownerAccountId);
  const { rpcProvider, signer } = getDeps(keyPair);
  const account = new Account(accountId, rpcProvider, signer);

  try {
    const result = await account.signAndSendTransactionLegacy({
      receiverId: NEAR_REGISTRAR,
      actions: [
        actionCreators.functionCall(
          "create_account",
          {
            new_account_id: newAccountId,
            new_public_key: ownerPublicKey,
          },
          BigInt("300000000000000"),
          STORAGE_DEPOSIT,
        ),
      ],
    });

    const txHash =
      result?.transaction_outcome?.id ??
      result?.transaction?.hash ??
      "";

    return { txHash: String(txHash) };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);

    if (msg.includes("AccountAlreadyExists") || msg.includes("already exists")) {
      throw new Error(`Account ${newAccountId} already exists`);
    }

    throw new Error(`NEAR account creation failed: ${msg}`);
  }
}
