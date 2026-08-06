export type OrderStatus =
  | 'open'
  | 'funded'
  | 'negotiating'
  | 'accepted'
  | 'settled'
  | 'shipment_pending'
  | 'verified'
  | 'expired'
  | 'cancelled';

export type AllocationStatus =
  | 'pending_funding'
  | 'funded'
  | 'supplier_paid'
  | 'pending_shipment'
  | 'receipt_minted'
  | 'redeemed'
  | 'refunded';

export interface BuyerMandateInput {
  buyerName: string;
  buyerAddress: string;
  quantity: number;
  maxBudgetAED: number;
  deliveryDeadline: string;
  qualityStandard: string;
  maxPriceVarianceBps: number;
  allowAutonomousExecution: boolean;
}

export interface SupplierQuote {
  supplierId: string;
  supplierName: string;
  unitPriceEUR: number;
  moq: number;
  deliveryDays: number;
  acceptsEURC: boolean;
  acceptsUSDC: boolean;
  verified: boolean;
  qualityScore: number;
}

export interface SupplierOffer {
  supplierId: string;
  quantity: number;
  unitPriceEUR: number;
  deliveryDays: number;
  paymentCurrency: 'EURC' | 'USDC';
  paymentTiming: 'immediate' | 'net30';
  recurringIntent?: string;
  expiry: string;
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
}

export interface AgentActivityEvent {
  id: string;
  timestamp: string;
  type:
    | 'demand_aggregated'
    | 'supplier_compared'
    | 'negotiation_started'
    | 'counteroffer_submitted'
    | 'supplier_accepted'
    | 'policy_check'
    | 'fx_quote'
    | 'settlement_executed'
    | 'shipment_verified'
    | 'receipt_minted'
    | 'redemption';
  title: string;
  detail: string;
  metadata?: Record<string, unknown>;
}

export interface GroupOrderView {
  id: string;
  productName: string;
  origin: string;
  packaging: string;
  currentDemand: number;
  supplierMoq: number;
  buyerCount: number;
  estimatedSavingsPercent: number;
  status: OrderStatus;
  onchainOrderId?: number;
}

export interface SettlementView {
  totalUSDC: string;
  eurcPaid: string;
  fxRate: number;
  fxFeeBps: number;
  supplierWallet: string;
  txHash?: string;
  status: 'pending' | 'completed' | 'failed';
  explorerUrl?: string;
}

export interface ReceiptView {
  batchId: string;
  productName: string;
  origin: string;
  packaging: string;
  buyerName: string;
  buyerAddress: string;
  allocation: number;
  verificationStatus: 'pending' | 'verified' | 'disputed';
  shipmentStatus: 'pending' | 'in_transit' | 'arrived' | 'redeemed';
  tokenId?: string;
  redemptionHistory: Array<{ quantity: number; timestamp: string; txHash?: string }>;
}

export interface PolicyCheckResult {
  passed: boolean;
  checks: Array<{ name: string; passed: boolean; detail: string }>;
}
