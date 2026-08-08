import { createPublicClient, createWalletClient, http, parseUnits, formatUnits, type Address } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { getDeployments, ARC_RPC } from '../config/chain';
import GroupOrderAbi from './abis/GroupOrder.json';
import WarehouseReceiptAbi from './abis/WarehouseReceipt.json';
import StableFXAdapterAbi from './abis/StableFXAdapter.json';
import IERC20Abi from './abis/IERC20.json';

const arcTestnet = {
  id: 5042002,
  name: 'Arc Testnet',
  nativeCurrency: { name: 'USDC', symbol: 'USDC', decimals: 6 },
  rpcUrls: { default: { http: [ARC_RPC] } },
} as const;

export function getClients() {
  const key = process.env.DEPLOYER_PRIVATE_KEY;
  if (!key) return null;

  const account = privateKeyToAccount(key as `0x${string}`);
  const publicClient = createPublicClient({ chain: arcTestnet, transport: http(ARC_RPC) });
  const walletClient = createWalletClient({ account, chain: arcTestnet, transport: http(ARC_RPC) });
  return { publicClient, walletClient, account };
}

export async function setupDemoOnChain(): Promise<Record<string, string | string[]>> {
  const clients = getClients();
  const deployments = getDeployments();
  if (!clients || deployments.contracts.GroupOrder === '0x0000000000000000000000000000000000000000') {
    return { status: 'skipped', reason: 'Contracts not deployed or no private key' };
  }

  const { walletClient, publicClient, account } = clients;
  const groupOrder = deployments.contracts.GroupOrder as Address;
  const receipt = deployments.contracts.WarehouseReceipt as Address;
  const usdc = deployments.contracts.USDC as Address;

  const supplier = '0x000000000000000000000000000000000000dEaD' as Address;
  const buyers = [
    '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
    '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
  ] as Address[];

  const hashes: string[] = [];

  const whitelistTx = await walletClient.writeContract({
    address: groupOrder,
    abi: GroupOrderAbi,
    functionName: 'setSupplierWhitelist',
    args: [supplier, true],
  });
  await publicClient.waitForTransactionReceipt({ hash: whitelistTx });
  hashes.push(whitelistTx);

  for (const buyer of buyers) {
    const kybOrderTx = await walletClient.writeContract({
      address: groupOrder,
      abi: GroupOrderAbi,
      functionName: 'setKybApproved',
      args: [buyer, true],
    });
    await publicClient.waitForTransactionReceipt({ hash: kybOrderTx });
    hashes.push(kybOrderTx);

    const kybReceiptTx = await walletClient.writeContract({
      address: receipt,
      abi: WarehouseReceiptAbi,
      functionName: 'setKybApproved',
      args: [buyer, true],
    });
    await publicClient.waitForTransactionReceipt({ hash: kybReceiptTx });
    hashes.push(kybReceiptTx);
  }

  const orderTx = await walletClient.writeContract({
    address: groupOrder,
    abi: GroupOrderAbi,
    functionName: 'createOrder',
    args: ['Extra Virgin Olive Oil', 'Jaen, Spain', '5-liter tins', 860n],
  });
  await publicClient.waitForTransactionReceipt({ hash: orderTx });
  hashes.push(orderTx);

  return { status: 'ok', hashes };
}

export async function getOnChainBalances(address: Address) {
  const clients = getClients();
  const deployments = getDeployments();
  if (!clients) return null;

  const balance = await clients.publicClient.getBalance({ address });
  const usdc = await clients.publicClient.readContract({
    address: deployments.contracts.USDC as Address,
    abi: IERC20Abi,
    functionName: 'balanceOf',
    args: [address],
  });

  return {
    native: formatUnits(balance, 6),
    usdc: formatUnits(usdc as bigint, 6),
  };
}
