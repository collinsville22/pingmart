import { Account } from "@near-js/accounts";
import { actionCreators } from "@near-js/transactions";
import { getNearWallet, getDeps } from "@/lib/wallets/near";

const USDC_CONTRACT = "17208628f84f5d6ad33f0da3bbbeb27ffcb398eac501a31bd6ad2011e36133a1";
const NEAR_RPC = "https://rpc.mainnet.fastnear.com";

export async function transferUsdc(
  receiverId: string,
  amount: string,
): Promise<string> {
  const { accountId, keyPair } = await getNearWallet();
  const { rpcProvider, signer } = getDeps(keyPair);
  const account = new Account(accountId, rpcProvider, signer);

  const result = await account.signAndSendTransactionLegacy({
    receiverId: USDC_CONTRACT,
    actions: [
      actionCreators.functionCall(
        "storage_deposit",
        { account_id: receiverId },
        BigInt("30000000000000"),
        BigInt("12500000000000000000000"),
      ),
      actionCreators.functionCall(
        "ft_transfer",
        { receiver_id: receiverId, amount, memo: null },
        BigInt("30000000000000"),
        BigInt(1),
      ),
    ],
  });

  const txHash =
    result?.transaction_outcome?.id ??
    result?.transaction?.hash ??
    "";

  return String(txHash);
}

export async function getUsdcBalance(): Promise<string> {
  const { accountId } = await getNearWallet();

  const res = await fetch(NEAR_RPC, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "query",
      params: {
        request_type: "call_function",
        finality: "final",
        account_id: USDC_CONTRACT,
        method_name: "ft_balance_of",
        args_base64: Buffer.from(
          JSON.stringify({ account_id: accountId }),
        ).toString("base64"),
      },
    }),
    signal: AbortSignal.timeout(10000),
  });

  const data = await res.json();
  if (data.error) throw new Error(JSON.stringify(data.error));
  const result = JSON.parse(Buffer.from(data.result.result).toString());
  return result || "0";
}
