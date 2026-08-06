export type BuyerMandate = {
  id: string;
  buyerAddress: string;
  businessName: string;
  product: string;
  quantity: number;
  maxBudgetAED: number;
  quality: string;
  deliveryDeadline: string;
  maxPriceVariancePct: number;
  allowAutonomous: boolean;
  funded: boolean;
  fundedUSDC: number;
  usedUSDC: number;
  finalCostAED?: number;
  releasedAED?: number;
};

export type SupplierQuote = {
  supplierId: string;
  name: string;
  origin: string;
  unitPriceEUR: number;
  moq: number;
  deliveryDays: number;
  paymentCurrency: "EURC" | "USDC";
  verified: boolean;
  quality: string;
};

export type CounterOffer = {
  supplierId: string;
  quantity: number;
  unitPriceEUR: number;
  deliveryDays: number;
  paymentCurrency: "EURC" | "USDC";
  paymentTiming: "immediate" | "net30";
  recurringIntent: "none" | "monthly" | "quarterly";
};

export type NegotiationResult = {
  status: "accepted" | "rejected" | "expired";
  offer: CounterOffer;
  originalMOQ: number;
  newMOQ: number;
  expiry: string;
  termsHash: string;
};

export type AgentEvent = {
  id: string;
  ts: string;
  type: string;
  title: string;
  detail: string;
  label?: "live" | "sandbox" | "simulated" | "adapter";
};

export type PolicyCheck = {
  name: string;
  passed: boolean;
  detail: string;
};

export type SettlementRecord = {
  pooledUSDC: number;
  eurcPaid: number;
  fxRate: number;
  fxFeeBps: number;
  fxFeeUSDC: number;
  supplierWallet: string;
  txHash?: string;
  status: "pending" | "submitted" | "confirmed" | "simulated";
  quoteId: string;
  mode: "Arc Settlement: Live Testnet" | "StableFX: Test or Adapter Mode";
};

export type WarehouseBatch = {
  batchId: string;
  tokenId?: number;
  productName: string;
  origin: string;
  packaging: string;
  totalQuantity: number;
  supplier: string;
  status: "Pending Verification" | "Verified" | "In Transit" | "Arrived" | "Partially Redeemed" | "Redeemed";
  verified: boolean;
  attestationHash?: string;
  allocations: { buyer: string; businessName: string; quantity: number; redeemed: number }[];
  documents: { name: string; extracted: Record<string, string> }[];
  redemptionHistory: { buyer: string; quantity: number; at: string }[];
};

export type GroupOrderState = {
  id: string;
  onchainOrderId?: number;
  productName: string;
  origin: string;
  packaging: string;
  supplierMOQ: number;
  totalDemand: number;
  buyerCount: number;
  estimatedSavingsPct: number;
  status: "open" | "funded" | "negotiating" | "offer_accepted" | "settled" | "receipts_minted";
  mandates: BuyerMandate[];
  contracts?: {
    groupOrder?: string;
    warehouseReceipt?: string;
    stableFXAdapter?: string;
  };
};

export type DemoState = {
  order: GroupOrderState;
  suppliers: SupplierQuote[];
  comparison?: {
    selected: string;
    ranked: { supplierId: string; score: number; reasons: string[] }[];
  };
  negotiation?: NegotiationResult;
  policyChecks: PolicyCheck[];
  agentTimeline: AgentEvent[];
  settlement?: SettlementRecord;
  batch?: WarehouseBatch;
  demoStep: number;
  labels: {
    aedCollection: string;
    arcSettlement: string;
    supplierQuotes: string;
    stableFX: string;
    warehouseAttestation: string;
  };
};
