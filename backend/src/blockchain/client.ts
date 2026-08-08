import {
  createPublicClient,
  createWalletClient,
  http,
  type Address,
  type Hash,
  type PublicClient,
  type WalletClient,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { arcTestnet } from "../config/chain.js";
import { getDeployment } from "../config/deployments.js";
import { groupOrderAbi, warehouseReceiptAbi, stableFxAdapterAbi } from "./abis.js";

let publicClient: PublicClient | null = null;
let walletClient: WalletClient | null = null;

function getPublicClient(): PublicClient {
  if (!publicClient) {
    publicClient = createPublicClient({
      chain: arcTestnet,
      transport: http(arcTestnet.rpcUrls.default.http[0]),
    });
  }
  return publicClient;
}

function getWalletClient(): WalletClient {
  if (!walletClient) {
    const key = process.env.DEPLOYER_PRIVATE_KEY;
    if (!key) throw new Error("DEPLOYER_PRIVATE_KEY not set");
    const account = privateKeyToAccount(key as `0x${string}`);
    walletClient = createWalletClient({
      account,
      chain: arcTestnet,
      transport: http(arcTestnet.rpcUrls.default.http[0]),
    });
  }
  return walletClient;
}

export async function getChainId(): Promise<number> {
  return getPublicClient().getChainId();
}

export async function getBlockNumber(): Promise<bigint> {
  return getPublicClient().getBlockNumber();
}

export async function whitelistBuyer(buyer: Address): Promise<Hash> {
  const client = getWalletClient();
  const hash = await client.writeContract({
    address: getDeployment("GroupOrder").address,
    abi: groupOrderAbi,
    functionName: "whitelistBuyer",
    args: [buyer],
  });
  await getPublicClient().waitForTransactionReceipt({ hash });
  return hash;
}

export async function setBuyerKyb(buyer: Address, kybHash: `0x${string}`): Promise<Hash> {
  const client = getWalletClient();
  const hash = await client.writeContract({
    address: getDeployment("GroupOrder").address,
    abi: groupOrderAbi,
    functionName: "setBuyerKyb",
    args: [buyer, kybHash],
  });
  await getPublicClient().waitForTransactionReceipt({ hash });
  return hash;
}

export async function createGroupOrderOnChain(params: {
  commodity: string;
  quantity: bigint;
  unitPrice: bigint;
  deadline: bigint;
  minParticipants: bigint;
  maxParticipants: bigint;
}): Promise<Hash> {
  const client = getWalletClient();
  const hash = await client.writeContract({
    address: getDeployment("GroupOrder").address,
    abi: groupOrderAbi,
    functionName: "createOrder",
    args: [
      params.commodity,
      params.quantity,
      params.unitPrice,
      params.deadline,
      params.minParticipants,
      params.maxParticipants,
    ],
  });
  await getPublicClient().waitForTransactionReceipt({ hash });
  return hash;
}

export async function joinGroupOrderOnChain(orderId: bigint, amount: bigint): Promise<Hash> {
  const client = getWalletClient();
  const hash = await client.writeContract({
    address: getDeployment("GroupOrder").address,
    abi: groupOrderAbi,
    functionName: "joinOrder",
    args: [orderId, amount],
  });
  await getPublicClient().waitForTransactionReceipt({ hash });
  return hash;
}

export async function issueReceiptOnChain(
  orderId: bigint,
  holder: Address,
  commodity: string,
  quantity: bigint,
  warehouse: string
): Promise<Hash> {
  const client = getWalletClient();
  const hash = await client.writeContract({
    address: getDeployment("WarehouseReceipt").address,
    abi: warehouseReceiptAbi,
    functionName: "issueReceipt",
    args: [orderId, holder, commodity, quantity, warehouse],
  });
  await getPublicClient().waitForTransactionReceipt({ hash });
  return hash;
}

export async function convertStableOnChain(
  fromToken: Address,
  toToken: Address,
  amount: bigint
): Promise<Hash> {
  const client = getWalletClient();
  const hash = await client.writeContract({
    address: getDeployment("StableFXAdapter").address,
    abi: stableFxAdapterAbi,
    functionName: "convert",
    args: [fromToken, toToken, amount],
  });
  await getPublicClient().waitForTransactionReceipt({ hash });
  return hash;
}

export async function readOrderCount(): Promise<bigint> {
  return getPublicClient().readContract({
    address: getDeployment("GroupOrder").address,
    abi: groupOrderAbi,
    functionName: "orderCount",
  });
}

export async function readOrder(orderId: bigint) {
  return getPublicClient().readContract({
    address: getDeployment("GroupOrder").address,
    abi: groupOrderAbi,
    functionName: "getOrder",
    args: [orderId],
  });
}
