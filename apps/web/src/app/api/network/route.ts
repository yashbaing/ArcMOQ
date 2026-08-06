import { NextResponse } from "next/server";
import { arcPublicClient, getDeployedAddresses } from "@/lib/chain";
import { ARC_EURC, ARC_USDC, explorerAddress } from "@/lib/arc";
import { erc20Abi } from "@/lib/abi";

export const dynamic = "force-dynamic";

export async function GET() {
  const addrs = getDeployedAddresses();
  let usdcDecimals: number | null = null;
  const eurcSymbol: string | null = null;
  let blockNumber: string | null = null;
  let rpcOk = false;

  try {
    const block = await arcPublicClient.getBlockNumber();
    blockNumber = block.toString();
    usdcDecimals = Number(
      await arcPublicClient.readContract({
        address: ARC_USDC,
        abi: erc20Abi,
        functionName: "decimals",
      })
    );
    rpcOk = true;
  } catch {
    rpcOk = false;
  }

  return NextResponse.json({
    network: "Arc Testnet",
    chainId: 5042002,
    rpc: process.env.ARC_RPC_URL ?? "https://rpc.testnet.arc.io",
    rpcOk,
    blockNumber,
    usdc: { address: ARC_USDC, decimals: usdcDecimals, explorer: explorerAddress(ARC_USDC) },
    eurc: { address: ARC_EURC, explorer: explorerAddress(ARC_EURC), symbol: eurcSymbol },
    contracts: addrs,
    faucet: "https://faucet.circle.com",
    explorer: "https://testnet.arcscan.app",
    privateKeyConfigured: Boolean(process.env.PRIVATE_KEY),
  });
}
