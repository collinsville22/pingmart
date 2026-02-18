import { Transaction, sendAndConfirmTransaction } from "@solana/web3.js";
import { getMerchantSolKeypair, getSolConnection } from "@/lib/wallets/solana";

const BONFIDA_PROXY = "https://sns-sdk-proxy.bonfida.workers.dev";

export async function registerSolanaSNS(
  label: string,
  ownerAddress: string,
  onProgress?: (step: string) => void,
): Promise<{ txHash: string }> {
  const keypair = getMerchantSolKeypair();
  const buyer = keypair.publicKey.toBase58();

  onProgress?.("Fetching registration transaction from Bonfida...");

  const res = await fetch(
    `${BONFIDA_PROXY}/register?buyer=${buyer}&domain=${label}&space=1000&serialize=true`,
    { signal: AbortSignal.timeout(15000) },
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Bonfida register API failed: ${res.status} ${text}`);
  }

  const data = await res.json();

  if (!data.s || data.s !== "ok") {
    throw new Error(`Bonfida registration failed: ${JSON.stringify(data)}`);
  }

  onProgress?.("Signing and submitting transaction...");

  const txBuffer = Buffer.from(data.result, "base64");
  const tx = Transaction.from(txBuffer);

  const connection = getSolConnection();

  const { blockhash, lastValidBlockHeight } =
    await connection.getLatestBlockhash();
  tx.recentBlockhash = blockhash;
  tx.lastValidBlockHeight = lastValidBlockHeight;
  tx.feePayer = keypair.publicKey;

  const txHash = await sendAndConfirmTransaction(connection, tx, [keypair]);

  onProgress?.("Solana name registered");

  return { txHash };
}
