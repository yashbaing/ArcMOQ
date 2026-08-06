export const ARC_TESTNET = {
  chainId: 5042002,
  name: 'Arc Testnet',
  rpcUrl: 'https://rpc.testnet.arc.io',
  explorerUrl: 'https://testnet.arcscan.app',
  nativeCurrency: { name: 'USDC', symbol: 'USDC', decimals: 6 },
} as const;

export const ARC_CONTRACTS = {
  USDC: '0x3600000000000000000000000000000000000000' as `0x${string}`,
  EURC: '0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a' as `0x${string}`,
  STABLEFX_ESCROW: '0xd68256f4D69C6BbEcB873D8588AE0Dc6B8E22E10' as `0x${string}`,
  PERMIT2: '0x000000000022D473030F116dDEE9F6B43aC78BA3' as `0x${string}`,
} as const;

export const DEMO_PRODUCT = {
  id: 'evoo-jaen-5l',
  name: 'Extra Virgin Olive Oil',
  origin: 'Jaén, Spain',
  packaging: '5-liter tins',
  supplierOriginalMoq: 1000,
} as const;

/** AED per EUR for demo display (simulated FX) */
export const AED_PER_EUR = 3.97;

/** Demo USDC/EURC rate (1:1 with small spread for adapter mode) */
export const USDC_TO_EURC_RATE = 0.92;
export const STABLEFX_FEE_BPS = 30;

export const LABELS = {
  aedCollection: 'AED Collection: Simulated PSP',
  arcSettlement: 'Arc Settlement: Live Testnet',
  supplierQuotes: 'Supplier Quotes: Sandbox',
  stableFx: 'StableFX: Test Adapter Mode',
  warehouseAttestation: 'Warehouse Attestation: Demo Verifier',
} as const;
