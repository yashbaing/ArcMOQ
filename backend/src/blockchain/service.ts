import type { Address } from 'viem';
import { getClients, getOnChainBalances, setupDemoOnChain } from '../blockchain/client';
import { getDeployments, ARC_RPC, EXPLORER_URL } from '../config/chain';

export async function getArcTestnetStatus() {
  const deployments = getDeployments();
  const clients = getClients();
  let chainId: number | null = null;
  let blockNumber: bigint | null = null;
  let deployerBalance: { native: string; usdc: string } | null = null;
  if (clients) {
    chainId = await clients.publicClient.getChainId();
    blockNumber = await clients.publicClient.getBlockNumber();
    deployerBalance = await getOnChainBalances(clients.account.address);
  }
  return {
    network: 'Arc Testnet',
    chainId: deployments.chainId,
    rpc: ARC_RPC,
    explorerUrl: EXPLORER_URL,
    connected: chainId === deployments.chainId,
    liveBlock: blockNumber ? Number(blockNumber) : null,
    deployer: deployments.deployer,
    deployerBalance,
    hasSigner: Boolean(clients),
    contracts: deployments.contracts,
    deployedAt: deployments.deployedAt,
  };
}

export async function initializeArcTestnetDemo() {
  return setupDemoOnChain();
}

export async function verifyContractDeployed(address: Address): Promise<boolean> {
  const clients = getClients();
  if (!clients) return false;
  const code = await clients.publicClient.getBytecode({ address });
  return Boolean(code && code !== '0x');
}
