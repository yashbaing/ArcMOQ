import { sandboxNegotiate, type DEMO_SUPPLIERS } from "../suppliers";
import type { CounterOffer, NegotiationResult, SupplierQuote } from "../types";

type Supplier = (typeof DEMO_SUPPLIERS)[number] | SupplierQuote;

/** Negotiation Agent — structured counteroffers, not free-form chat. */
export function buildCounterOffer(
  supplier: Supplier,
  quantity: number,
  overrides?: Partial<CounterOffer>
): CounterOffer {
  // Slight premium over list to buy MOQ flexibility
  const negotiatedPrice =
    supplier.supplierId === "oliva-sur"
      ? 38.1
      : Math.round((supplier.unitPriceEUR + 0.4) * 100) / 100;

  return {
    supplierId: supplier.supplierId,
    quantity,
    unitPriceEUR: overrides?.unitPriceEUR ?? negotiatedPrice,
    deliveryDays: overrides?.deliveryDays ?? supplier.deliveryDays,
    paymentCurrency: overrides?.paymentCurrency ?? "EURC",
    paymentTiming: overrides?.paymentTiming ?? "immediate",
    recurringIntent: overrides?.recurringIntent ?? "monthly",
  };
}

export function negotiate(
  supplier: Supplier,
  demandQty: number
): NegotiationResult {
  const offer = buildCounterOffer(supplier, demandQty);
  const result = sandboxNegotiate(supplier, offer);
  const expiry = new Date(Date.now() + 5 * 60 * 1000).toISOString();

  return {
    status: result.status,
    offer,
    originalMOQ: supplier.moq,
    newMOQ: result.status === "accepted" ? demandQty : supplier.moq,
    expiry,
    termsHash: hashTerms(offer),
  };
}

function hashTerms(offer: CounterOffer): string {
  const payload = JSON.stringify(offer);
  let h = 0;
  for (let i = 0; i < payload.length; i++) h = (h * 31 + payload.charCodeAt(i)) >>> 0;
  return `0x${h.toString(16).padStart(64, "0")}`;
}
