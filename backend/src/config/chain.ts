import deployments from './deployments.json';

export interface DeploymentConfig {
  network: string;
  chainId: number;
  deployer: string;
  contracts: {
    StableFXAdapter: string;
    GroupOrder: string;
    WarehouseReceipt: string;
    USDC: string;
    EURC: string;
  };
  deployedAt: string;
}

export function getDeployments(): DeploymentConfig {
  return deployments as DeploymentConfig;
}

export const ARC_RPC = process.env.ARC_RPC_URL || 'https://rpc.testnet.arc.io';
export const EXPLORER_URL = 'https://testnet.arcscan.app';
