import { createPublicClient, createWalletClient, http, type Hex } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { ARC_TESTNET } from "./arc";

export const arcPublicClient = createPublicClient({
  chain: {
    id: ARC_TESTNET.id,
    name: ARC_TESTNET.name,
    nativeCurrency: ARC_TESTNET.nativeCurrency,
    rpcUrls: ARC_TESTNET.rpcUrls,
    blockExplorers: ARC_TESTNET.blockExplorers,
  },
  transport: http(process.env.ARC_RPC_URL ?? "https://rpc.testnet.arc.io"),
});

export function getAgentWallet() {
  const pk = process.env.PRIVATE_KEY as Hex | undefined;
  if (!pk) return null;
  const account = privateKeyToAccount(pk.startsWith("0x") ? pk : (`0x${pk}` as Hex));
  const client = createWalletClient({
    account,
    chain: {
      id: ARC_TESTNET.id,
      name: ARC_TESTNET.name,
      nativeCurrency: ARC_TESTNET.nativeCurrency,
      rpcUrls: ARC_TESTNET.rpcUrls,
      blockExplorers: ARC_TESTNET.blockExplorers,
    },
    transport: http(process.env.ARC_RPC_URL ?? "https://rpc.testnet.arc.io"),
  });
  return { account, client };
}

export function getDeployedAddresses() {
  return {
    groupOrder: process.env.NEXT_PUBLIC_GROUP_ORDER as `0x${string}` | undefined,
    warehouseReceipt: process.env.NEXT_PUBLIC_WAREHOUSE_RECEIPT as `0x${string}` | undefined,
    stableFXAdapter: process.env.NEXT_PUBLIC_STABLEFX_ADAPTER as `0x${string}` | undefined,
    orderId: process.env.NEXT_PUBLIC_ORDER_ID ? Number(process.env.NEXT_PUBLIC_ORDER_ID) : undefined,
  };
}
