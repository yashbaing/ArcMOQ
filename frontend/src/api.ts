import { AgentActivityEvent, BuyerMandateInput, GroupOrderView, PolicyCheckResult, ReceiptView, SettlementView, SupplierQuote } from '@arcmoq/shared';

function apiBase(): string {
  const configured = import.meta.env.VITE_API_URL?.trim();
  if (configured) return configured.replace(/\/$/, '');
  return '/api';
}

export interface AppStateResponse {
  groupOrder: GroupOrderView;
  mandates: BuyerMandateInput[];
  suppliers: SupplierQuote[];
  activities: AgentActivityEvent[];
  currentOffer: Record<string, unknown> | null;
  settlement: SettlementView | null;
  policyResult: PolicyCheckResult | null;
  batchVerified: boolean;
  receiptsMinted: boolean;
  demoStep: number;
  deployments: {
    contracts: Record<string, string>;
    chainId: number;
  };
  explorerUrl: string;
}

async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${apiBase()}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(body || `Request failed (${res.status})`);
  }
  return res.json();
}

export const api = {
  getState: () => fetchJson<AppStateResponse>('/state'),
  reset: () => fetchJson<AppStateResponse>('/reset', { method: 'POST' }),
  runDemo: () => fetchJson<AppStateResponse>('/agent/run-demo', { method: 'POST' }),
  aggregate: () => fetchJson('/agent/aggregate', { method: 'POST' }),
  compare: () => fetchJson<SupplierQuote[]>('/agent/compare', { method: 'POST' }),
  negotiate: (supplierId: string) => fetchJson('/agent/negotiate', { method: 'POST', body: JSON.stringify({ supplierId }) }),
  accept: () => fetchJson('/agent/accept', { method: 'POST' }),
  policyCheck: () => fetchJson<PolicyCheckResult>('/agent/policy-check', { method: 'POST' }),
  settle: (txHash?: string) => fetchJson<SettlementView>('/agent/settle', { method: 'POST', body: JSON.stringify({ txHash }) }),
  verifyShipment: () => fetchJson('/agent/verify-shipment', { method: 'POST' }),
  mintReceipts: () => fetchJson('/agent/mint-receipts', { method: 'POST' }),
  redeem: (buyerName: string, quantity: number) => fetchJson('/agent/redeem', { method: 'POST', body: JSON.stringify({ buyerName, quantity }) }),
  addMandate: (mandate: BuyerMandateInput) => fetchJson('/mandates', { method: 'POST', body: JSON.stringify(mandate) }),
  estimate: (quantity: number) => fetchJson<{ estimatedCostAED: number; unitPriceAED: number }>('/mandates/estimate', { method: 'POST', body: JSON.stringify({ quantity }) }),
};

export function buildReceipts(state: AppStateResponse): ReceiptView[] {
  return state.mandates.map((m) => ({
    batchId: 'EVOO-ES-UAE-001',
    productName: state.groupOrder.productName,
    origin: state.groupOrder.origin,
    packaging: state.groupOrder.packaging,
    buyerName: m.buyerName,
    buyerAddress: m.buyerAddress,
    allocation: m.quantity,
    verificationStatus: state.batchVerified ? 'verified' : 'pending',
    shipmentStatus: state.receiptsMinted
      ? state.activities.some((a) => a.type === 'redemption' && a.metadata?.buyerName === m.buyerName)
        ? 'redeemed'
        : 'arrived'
      : state.settlement
        ? 'in_transit'
        : 'pending',
    tokenId: state.receiptsMinted ? '1' : undefined,
    redemptionHistory: state.activities
      .filter((a) => a.type === 'redemption' && a.metadata?.buyerName === m.buyerName)
      .map((a) => ({
        quantity: Number(a.metadata?.quantity || 0),
        timestamp: a.timestamp,
        txHash: a.metadata?.txHash as string | undefined,
      })),
  }));
}
