import {
  Keypair,
  Connection,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction,
  LAMPORTS_PER_SOL,
  PublicKey,
} from "@solana/web3.js";
import { derivePath } from "ed25519-hd-key";
import crypto from "crypto";

const SOLANA_RPC = "https://api.mainnet-beta.solana.com";

let cached: Keypair | null = null;

function deriveKeypair(): Keypair {
  const mnemonic = process.env.MERCHANT_SOL_MNEMONIC;
  if (!mnemonic) throw new Error("MERCHANT_SOL_MNEMONIC not set");

  const seed = crypto.pbkdf2Sync(mnemonic, "mnemonic", 2048, 64, "sha512");
  const derived = derivePath("m/44'/501'/0'/0'", seed.toString("hex"));
  return Keypair.fromSeed(Buffer.from(derived.key));
}

export function getMerchantSolKeypair(): Keypair {
  if (!cached) cached = deriveKeypair();
  return cached;
}

export function getMerchantSolAddress(): string {
  return getMerchantSolKeypair().publicKey.toBase58();
}

export function getSolConnection(): Connection {
  return new Connection(SOLANA_RPC, "confirmed");
}

export async function sendSol(to: string, lamports: bigint): Promise<string> {
  const keypair = getMerchantSolKeypair();
  const connection = getSolConnection();

  const tx = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: keypair.publicKey,
      toPubkey: new PublicKey(to),
      lamports,
    }),
  );

  return sendAndConfirmTransaction(connection, tx, [keypair]);
}

export async function getSolBalance(): Promise<number> {
  const keypair = getMerchantSolKeypair();
  const connection = getSolConnection();
  const balance = await connection.getBalance(keypair.publicKey);
  return balance / LAMPORTS_PER_SOL;
}
