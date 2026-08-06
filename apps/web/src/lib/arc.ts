export const ARC_TESTNET = {
  id: 5042002,
  name: "Arc Testnet",
  nativeCurrency: { name: "USDC", symbol: "USDC", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://rpc.testnet.arc.io"] },
  },
  blockExplorers: {
    default: { name: "ArcScan", url: "https://testnet.arcscan.app" },
  },
  testnet: true,
} as const;

export const ARC_USDC = "0x3600000000000000000000000000000000000000" as const;
export const ARC_EURC = "0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a" as const;
export const STABLEFX_ESCROW = "0xd68256f4D69C6BbEcB873D8588AE0Dc6B8E22E10" as const;

/** Conceptual AED→USDC display rate for UI only — NOT a StableFX claim. */
export const AED_PER_USD = 3.6725;
/** Adapter-mode EURC per USDC (matches onchain StableFXAdapter default). */
export const EURC_PER_USDC = 0.92;
export const FX_FEE_BPS = 10;

export function aedToUsdc(aed: number): number {
  return aed / AED_PER_USD;
}

export function usdcToAed(usdc: number): number {
  return usdc * AED_PER_USD;
}

export function eurToUsdc(eur: number): number {
  return eur / EURC_PER_USDC;
}

export function usdcToEur(usdc: number): number {
  const gross = usdc * EURC_PER_USDC;
  return gross * (1 - FX_FEE_BPS / 10_000);
}

export function explorerTx(hash: string): string {
  return `https://testnet.arcscan.app/tx/${hash}`;
}

export function explorerAddress(addr: string): string {
  return `https://testnet.arcscan.app/address/${addr}`;
}

export function toToken6(amount: number): bigint {
  return BigInt(Math.round(amount * 1e6));
}

export function fromToken6(amount: bigint): number {
  return Number(amount) / 1e6;
}
