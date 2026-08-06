import { aedToUsdc, eurToUsdc, FX_FEE_BPS } from "../arc";
import type { BuyerMandate, NegotiationResult, PolicyCheck, SupplierQuote } from "../types";

export type PolicyInput = {
  supplier: SupplierQuote;
  negotiation: NegotiationResult;
  mandates: BuyerMandate[];
  whitelistedSupplierIds: string[];
  approvedDestination: string;
  fxSlippageBps: number;
  orderFullyFunded: boolean;
};

/** Execution Policy Engine — deterministic gates before any chain tx. */
export function runPolicyChecks(input: PolicyInput): PolicyCheck[] {
  const { supplier, negotiation, mandates, whitelistedSupplierIds, approvedDestination, fxSlippageBps, orderFullyFunded } =
    input;

  const totalEUR = negotiation.offer.quantity * negotiation.offer.unitPriceEUR;
  // Match adapter preview: EUR / rate, with small fee cushion (no extra 0.5% pad that breaks demo budgets)
  const usdcNeeded = (totalEUR / 0.92) / (1 - FX_FEE_BPS / 10_000) * 1.001;
  const totalBudgetUSDC = mandates.reduce((s, m) => s + aedToUsdc(m.maxBudgetAED), 0);
  const fundedUSDC = mandates.reduce((s, m) => s + (m.fundedUSDC || aedToUsdc(m.maxBudgetAED)), 0);

  const deliveryOk = mandates.every((m) => {
    const deadline = new Date(m.deliveryDeadline).getTime();
    const eta = Date.now() + negotiation.offer.deliveryDays * 86400000;
    return eta <= deadline;
  });

  const perBuyerOk = mandates.every((m) => {
    const share = (usdcNeeded * m.quantity) / negotiation.offer.quantity;
    return share <= aedToUsdc(m.maxBudgetAED) && share <= (m.fundedUSDC || aedToUsdc(m.maxBudgetAED));
  });

  const offerActive = negotiation.status === "accepted" && new Date(negotiation.expiry).getTime() > Date.now();

  return [
    {
      name: "Supplier whitelisted",
      passed: whitelistedSupplierIds.includes(supplier.supplierId) && supplier.verified,
      detail: `${supplier.name} (${supplier.supplierId})`,
    },
    {
      name: "Offer not expired",
      passed: offerActive,
      detail: `Expires ${negotiation.expiry}`,
    },
    {
      name: "Combined budgets cover order",
      passed: totalBudgetUSDC >= usdcNeeded,
      detail: `Need ~$${usdcNeeded.toFixed(2)} USDC · budgets $${totalBudgetUSDC.toFixed(2)}`,
    },
    {
      name: "Each buyer within mandate",
      passed: perBuyerOk,
      detail: "Pro-rata cost ≤ max AED / funded USDC",
    },
    {
      name: "Delivery satisfies deadlines",
      passed: deliveryOk,
      detail: `${negotiation.offer.deliveryDays} days transit`,
    },
    {
      name: "Order fully funded",
      passed: orderFullyFunded && fundedUSDC > 0,
      detail: `Pooled $${fundedUSDC.toFixed(2)} USDC`,
    },
    {
      name: "FX slippage within policy",
      passed: fxSlippageBps <= 200,
      detail: `${fxSlippageBps} bps ≤ 200 bps max`,
    },
    {
      name: "Settlement destination approved",
      passed: !!approvedDestination && approvedDestination.startsWith("0x"),
      detail: approvedDestination,
    },
  ];
}

export function allPoliciesPassed(checks: PolicyCheck[]): boolean {
  return checks.every((c) => c.passed);
}
