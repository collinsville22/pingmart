import {
  getMainnetRpcProvider,
  getSignerFromKeyPair,
  transfer,
  formatNearAmount,
  getAccountState,
} from "@near-js/client";
import { KeyPair } from "@near-js/crypto";
import { NEAR } from "@near-js/tokens";
import type { KeyPairString } from "@near-js/crypto";

interface NearWallet {
  accountId: string;
  keyPair: KeyPair;
}

let cached: NearWallet | null = null;

async function init(): Promise<NearWallet> {
  const seedPhrase = process.env.NEAR_SEED_PHRASE;
  if (!seedPhrase) throw new Error("NEAR_SEED_PHRASE not set");

  const { parseSeedPhrase } = await import("near-seed-phrase");
  const parsed = parseSeedPhrase(seedPhrase);
  const keyPair = KeyPair.fromString(parsed.secretKey as KeyPairString);
  const pubKey = keyPair.getPublicKey().toString();

  const lookupRes = await fetch(
    `https://api.fastnear.com/v0/public_key/${pubKey.replace("ed25519:", "")}`,
    { signal: AbortSignal.timeout(8000) },
  );

  let accountId = "";
  if (lookupRes.ok) {
    const data = await lookupRes.json();
    if (data.account_ids?.length) {
      accountId = data.account_ids[0];
    }
  }

  if (!accountId) {
    const pubKeyData = keyPair.getPublicKey().data;
    accountId = Buffer.from(pubKeyData).toString("hex");
  }

  return { accountId, keyPair };
}

export async function getNearWallet(): Promise<NearWallet> {
  if (!cached) cached = await init();
  return cached;
}

export function getDeps(keyPair: KeyPair) {
  return {
    rpcProvider: getMainnetRpcProvider(),
    signer: getSignerFromKeyPair(keyPair),
  };
}

export async function sendNear(receiverId: string, amountNear: string) {
  const { accountId, keyPair } = await getNearWallet();

  return transfer({
    sender: accountId,
    receiver: receiverId,
    amount: NEAR.toUnits(amountNear),
    deps: getDeps(keyPair),
  });
}

export async function getNearBalance(): Promise<string> {
  const { accountId, keyPair } = await getNearWallet();
  const state = await getAccountState({
    account: accountId,
    deps: { rpcProvider: getMainnetRpcProvider() },
  });
  return formatNearAmount(state.availableBalance.toString(), 4);
}

export async function getNearAccountId(): Promise<string> {
  const { accountId } = await getNearWallet();
  return accountId;
}
