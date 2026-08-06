import { v4 as uuidv4 } from 'uuid';
import {
  AgentActivityEvent,
  BuyerMandateInput,
  GroupOrderView,
  PolicyCheckResult,
  SettlementView,
  SupplierOffer,
  SupplierQuote,
} from '@arcmoq/shared';
import {
  DEMO_BUYERS,
  DEMO_NEGOTIATED_OFFER,
  DEMO_PRODUCT,
  DEMO_SUPPLIERS,
  DEMO_TOTAL_DEMAND,
  DEMO_BATCH_ID,
  aedFromEur,
  demoSavingsPercent,
} from '@arcmoq/shared';
import { AED_PER_EUR, STABLEFX_FEE_BPS, USDC_TO_EURC_RATE } from '@arcmoq/shared';

export interface AppState {
  groupOrder: GroupOrderView;
  mandates: BuyerMandateInput[];
  suppliers: SupplierQuote[];
  activities: AgentActivityEvent[];
  currentOffer: SupplierOffer | null;
  settlement: SettlementView | null;
  policyResult: PolicyCheckResult | null;
  batchVerified: boolean;
  receiptsMinted: boolean;
  demoStep: number;
}

const initialState: AppState = {
  groupOrder: {
    id: 'order-1',
    productName: DEMO_PRODUCT.name,
    origin: DEMO_PRODUCT.origin,
    packaging: DEMO_PRODUCT.packaging,
    currentDemand: DEMO_TOTAL_DEMAND,
    supplierMoq: DEMO_PRODUCT.supplierOriginalMoq,
    buyerCount: DEMO_BUYERS.length,
    estimatedSavingsPercent: demoSavingsPercent(),
    status: 'open',
  },
  mandates: [...DEMO_BUYERS],
  suppliers: [...DEMO_SUPPLIERS],
  activities: [],
  currentOffer: null,
  settlement: null,
  policyResult: null,
  batchVerified: false,
  receiptsMinted: false,
  demoStep: 0,
};

let state: AppState = structuredClone(initialState);

export function getState(): AppState {
  return state;
}

export function resetState(): void {
  state = structuredClone(initialState);
}

function addActivity(
  type: AgentActivityEvent['type'],
  title: string,
  detail: string,
  metadata?: Record<string, unknown>
): AgentActivityEvent {
  const event: AgentActivityEvent = {
    id: uuidv4(),
    timestamp: new Date().toISOString(),
    type,
    title,
    detail,
    metadata,
  };
  state.activities.push(event);
  return event;
}

/** Demand Matching Agent */
export function aggregateDemand(): { total: number; compatible: boolean; buyers: BuyerMandateInput[] } {
  const buyers = state.mandates;
  const total = buyers.reduce((s, b) => s + b.quantity, 0);
  const qualities = new Set(buyers.map((b) => b.qualityStandard));
  const compatible = qualities.size === 1;

  addActivity(
    'demand_aggregated',
    'Demand aggregated',
    `Combined ${buyers.length} UAE buyer mandates into ${total} tins. Compatible quality: ${compatible ? 'Yes' : 'No'}.`,
    { total, buyerCount: buyers.length }
  );

  state.groupOrder.currentDemand = total;
  state.groupOrder.buyerCount = buyers.length;
  state.demoStep = Math.max(state.demoStep, 1);
  return { total, compatible, buyers };
}

/** Supplier Research Agent */
export function compareSuppliers(): SupplierQuote[] {
  const demand = state.groupOrder.currentDemand;
  const ranked = [...state.suppliers].sort((a, b) => {
    const scoreA = a.qualityScore - (a.moq > demand ? 20 : 0) + (a.acceptsEURC ? 5 : 0);
    const scoreB = b.qualityScore - (b.moq > demand ? 20 : 0) + (b.acceptsEURC ? 5 : 0);
    return scoreB - scoreA;
  });

  addActivity(
    'supplier_compared',
    'Compared three suppliers',
    `Evaluated ${state.suppliers.length} sandbox suppliers on price, MOQ (${demand} tins demand), delivery, EURC acceptance, and verification.`,
    { suppliers: ranked.map((s) => ({ id: s.supplierId, price: s.unitPriceEUR, moq: s.moq })) }
  );

  state.demoStep = Math.max(state.demoStep, 2);
  return ranked;
}

/** Negotiation Agent */
export function negotiateWithSupplier(supplierId: string): SupplierOffer {
  const supplier = state.suppliers.find((s) => s.supplierId === supplierId);
  if (!supplier) throw new Error(`Supplier ${supplierId} not found`);

  addActivity(
    'negotiation_started',
    'Selected supplier for negotiation',
    `Targeting ${supplier.supplierName}: original MOQ ${supplier.moq} tins, €${supplier.unitPriceEUR}/tin.`,
    { supplierId }
  );

  const offer: SupplierOffer = {
    supplierId: DEMO_NEGOTIATED_OFFER.supplierId,
    quantity: DEMO_NEGOTIATED_OFFER.quantity,
    unitPriceEUR: DEMO_NEGOTIATED_OFFER.unitPriceEUR,
    deliveryDays: DEMO_NEGOTIATED_OFFER.deliveryDays,
    paymentCurrency: DEMO_NEGOTIATED_OFFER.paymentCurrency,
    paymentTiming: DEMO_NEGOTIATED_OFFER.paymentTiming,
    recurringIntent: DEMO_NEGOTIATED_OFFER.recurringIntent,
    expiry: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
    status: 'pending',
  };

  addActivity(
    'counteroffer_submitted',
    'Submitted structured counteroffer',
    `860 tins @ €${offer.unitPriceEUR}/tin, immediate EURC settlement, monthly recurring intent.`,
    { offer }
  );

  state.currentOffer = offer;
  state.groupOrder.status = 'negotiating';
  state.demoStep = Math.max(state.demoStep, 3);
  return offer;
}

export function acceptSupplierOffer(): SupplierOffer {
  if (!state.currentOffer) throw new Error('No active offer');
  state.currentOffer.status = 'accepted';

  addActivity(
    'supplier_accepted',
    'Supplier accepted — MOQ renegotiated',
    `Supplier accepted reduced MOQ from 1,000 to ${state.currentOffer.quantity} tins at €${state.currentOffer.unitPriceEUR}/tin.`,
    { moqRenegotiated: true, originalMoq: 1000 }
  );

  state.groupOrder.supplierMoq = state.currentOffer.quantity;
  state.groupOrder.status = 'accepted';
  state.demoStep = Math.max(state.demoStep, 4);
  return state.currentOffer;
}

/** Execution Policy Engine */
export function runPolicyChecks(): PolicyCheckResult {
  const offer = state.currentOffer;
  const checks = [
    {
      name: 'Supplier whitelisted',
      passed: offer?.supplierId === 'oliva-sur',
      detail: 'Oliva Sur is on the approved supplier list.',
    },
    {
      name: 'Offer not expired',
      passed: offer ? new Date(offer.expiry) > new Date() : false,
      detail: offer ? `Expires ${offer.expiry}` : 'No offer',
    },
    {
      name: 'Buyer budgets cover order',
      passed: state.mandates.every((m) => {
        const cost = aedFromEur(m.quantity * (offer?.unitPriceEUR || 0));
        const maxWithVariance = m.maxBudgetAED * (1 + m.maxPriceVarianceBps / 10000);
        return cost <= maxWithVariance;
      }),
      detail: 'All buyer mandates within authorized AED budgets (incl. variance).',
    },
    {
      name: 'Delivery deadlines satisfied',
      passed: true,
      detail: '30-day delivery meets all buyer September deadlines.',
    },
    {
      name: 'Order fully funded',
      passed: true,
      detail: 'USDC pool covers settlement amount.',
    },
    {
      name: 'FX slippage within policy',
      passed: STABLEFX_FEE_BPS <= 50,
      detail: `StableFX adapter fee ${STABLEFX_FEE_BPS} bps within 50 bps limit.`,
    },
    {
      name: 'Settlement destination approved',
      passed: true,
      detail: 'Supplier EURC wallet is whitelisted.',
    },
  ];

  const result: PolicyCheckResult = {
    passed: checks.every((c) => c.passed),
    checks,
  };

  addActivity(
    'policy_check',
    'Policy validation complete',
    result.passed ? 'All 7 checks passed. Agent authorized to execute.' : 'Policy check failed.',
    { checks }
  );

  state.policyResult = result;
  state.demoStep = Math.max(state.demoStep, 5);
  return result;
}

export function getFxQuote(): { usdcAmount: number; eurcOut: number; rate: number; feeBps: number } {
  const offer = state.currentOffer;
  if (!offer) throw new Error('No offer');

  const totalEur = offer.quantity * offer.unitPriceEUR;
  const usdcAmount = totalEur / USDC_TO_EURC_RATE;
  const fee = usdcAmount * (STABLEFX_FEE_BPS / 10000);
  const eurcOut = (usdcAmount - fee) * USDC_TO_EURC_RATE;

  addActivity(
    'fx_quote',
    'Requested FX quote',
    `StableFX Test Adapter: ${usdcAmount.toFixed(2)} USDC → ${eurcOut.toFixed(2)} EURC @ rate ${USDC_TO_EURC_RATE}, fee ${STABLEFX_FEE_BPS} bps.`,
    { usdcAmount, eurcOut, rate: USDC_TO_EURC_RATE, feeBps: STABLEFX_FEE_BPS }
  );

  return { usdcAmount, eurcOut, rate: USDC_TO_EURC_RATE, feeBps: STABLEFX_FEE_BPS };
}

export function executeSettlement(txHash?: string): SettlementView {
  const offer = state.currentOffer;
  if (!offer) throw new Error('No offer');
  if (!state.policyResult?.passed) throw new Error('Policy checks must pass first');

  const totalEur = offer.quantity * offer.unitPriceEUR;
  const usdcAmount = totalEur / USDC_TO_EURC_RATE;
  const fee = usdcAmount * (STABLEFX_FEE_BPS / 10000);
  const eurcOut = (usdcAmount - fee) * USDC_TO_EURC_RATE;
  const settlement: SettlementView = {
    totalUSDC: usdcAmount.toFixed(2),
    eurcPaid: eurcOut.toFixed(2),
    fxRate: USDC_TO_EURC_RATE,
    fxFeeBps: STABLEFX_FEE_BPS,
    supplierWallet: '0xSupplierOlivaSurDemo00000000000000000001',
    txHash: txHash || `0x${'demo'.repeat(16)}`,
    status: txHash ? 'completed' : 'completed',
    explorerUrl: txHash ? `https://testnet.arcscan.app/tx/${txHash}` : undefined,
  };

  addActivity(
    'settlement_executed',
    'Executed supplier settlement',
    `Pooled ${settlement.totalUSDC} USDC → ${settlement.eurcPaid} EURC paid to Spanish supplier via Arc Testnet.`,
    { settlement }
  );

  state.settlement = settlement;
  state.groupOrder.status = 'settled';
  state.demoStep = Math.max(state.demoStep, 6);
  return settlement;
}

export function verifyShipment(attestationSigner = 'Demo Warehouse — Jebel Ali'): void {
  addActivity(
    'shipment_verified',
    'Shipment verified by custodian',
    `${attestationSigner} attested batch ${DEMO_BATCH_ID}. AI extracted invoice data; verifier approved minting.`,
    { batchId: DEMO_BATCH_ID, verifier: attestationSigner }
  );
  state.batchVerified = true;
  state.groupOrder.status = 'verified';
  state.demoStep = Math.max(state.demoStep, 7);
}

export function mintReceipts(): void {
  addActivity(
    'receipt_minted',
    'Warehouse receipts minted',
    `860 ERC-1155 receipt units minted across ${state.mandates.length} buyers for batch ${DEMO_BATCH_ID}.`,
    { batchId: DEMO_BATCH_ID, totalUnits: DEMO_TOTAL_DEMAND }
  );
  state.receiptsMinted = true;
  state.demoStep = Math.max(state.demoStep, 8);
}

export function redeemReceipt(buyerName: string, quantity: number, txHash?: string): void {
  addActivity(
    'redemption',
    'Receipt redeemed',
    `${buyerName} redeemed ${quantity} receipt units → ${quantity} physical tins released. Receipt burned onchain.`,
    { buyerName, quantity, txHash }
  );
  state.demoStep = Math.max(state.demoStep, 9);
}

export function addMandate(mandate: BuyerMandateInput): BuyerMandateInput {
  state.mandates.push(mandate);
  state.groupOrder.currentDemand = state.mandates.reduce((s, m) => s + m.quantity, 0);
  state.groupOrder.buyerCount = state.mandates.length;
  return mandate;
}

export function estimateMandateAED(quantity: number, unitPriceEUR = DEMO_NEGOTIATED_OFFER.unitPriceEUR) {
  const eur = quantity * unitPriceEUR;
  return {
    estimatedCostAED: aedFromEur(eur),
    unitPriceAED: aedFromEur(unitPriceEUR),
    aedPerEur: AED_PER_EUR,
  };
}
