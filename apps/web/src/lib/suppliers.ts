import type { BuyerMandate, CounterOffer, SupplierQuote } from "./types";

export const DEMO_SUPPLIERS: SupplierQuote[] = [
  {
    supplierId: "oliva-sur",
    name: "Oliva Sur Cooperativa",
    origin: "Jaén, Spain",
    unitPriceEUR: 37.5,
    moq: 1000,
    deliveryDays: 30,
    paymentCurrency: "EURC",
    verified: true,
    quality: "Extra Virgin",
  },
  {
    supplierId: "andalucia-gold",
    name: "Andalucía Gold Exports",
    origin: "Córdoba, Spain",
    unitPriceEUR: 39.2,
    moq: 800,
    deliveryDays: 21,
    paymentCurrency: "EURC",
    verified: true,
    quality: "Extra Virgin",
  },
  {
    supplierId: "med-grove",
    name: "MedGrove Trading",
    origin: "Seville, Spain",
    unitPriceEUR: 36.8,
    moq: 1200,
    deliveryDays: 40,
    paymentCurrency: "USDC",
    verified: true,
    quality: "Extra Virgin",
  },
];

export const DEMO_BUYERS: Omit<BuyerMandate, "funded" | "fundedUSDC" | "usedUSDC">[] = [
  {
    id: "m-a",
    buyerAddress: "0xA111111111111111111111111111111111111111",
    businessName: "Restaurant A — Dubai Marina",
    product: "Extra Virgin Olive Oil",
    quantity: 100,
    maxBudgetAED: 16500,
    quality: "Extra Virgin",
    deliveryDeadline: "2026-09-30",
    maxPriceVariancePct: 2,
    allowAutonomous: true,
  },
  {
    id: "m-b",
    buyerAddress: "0xB222222222222222222222222222222222222222",
    businessName: "Restaurant B — Abu Dhabi",
    product: "Extra Virgin Olive Oil",
    quantity: 180,
    maxBudgetAED: 28500,
    quality: "Extra Virgin",
    deliveryDeadline: "2026-09-30",
    maxPriceVariancePct: 2,
    allowAutonomous: true,
  },
  {
    id: "m-c",
    buyerAddress: "0xC333333333333333333333333333333333333333",
    businessName: "Hotel C — Palm Jumeirah",
    product: "Extra Virgin Olive Oil",
    quantity: 250,
    maxBudgetAED: 40000,
    quality: "Extra Virgin",
    deliveryDeadline: "2026-10-15",
    maxPriceVariancePct: 3,
    allowAutonomous: true,
  },
  {
    id: "m-d",
    buyerAddress: "0xD444444444444444444444444444444444444444",
    businessName: "Grocery D — Sharjah",
    product: "Extra Virgin Olive Oil",
    quantity: 130,
    maxBudgetAED: 21000,
    quality: "Extra Virgin",
    deliveryDeadline: "2026-09-30",
    maxPriceVariancePct: 2,
    allowAutonomous: true,
  },
  {
    id: "m-e",
    buyerAddress: "0xE555555555555555555555555555555555555555",
    businessName: "Catering Company E — Dubai",
    product: "Extra Virgin Olive Oil",
    quantity: 200,
    maxBudgetAED: 32000,
    quality: "Extra Virgin",
    deliveryDeadline: "2026-10-01",
    maxPriceVariancePct: 2,
    allowAutonomous: true,
  },
];

/** Sandbox supplier negotiation — structured offer in, structured response out. */
export function sandboxNegotiate(
  supplier: SupplierQuote,
  offer: CounterOffer
): { status: "accepted" | "rejected"; reason: string } {
  if (supplier.supplierId !== offer.supplierId) {
    return { status: "rejected", reason: "Supplier mismatch" };
  }
  if (offer.paymentCurrency !== supplier.paymentCurrency && supplier.paymentCurrency === "EURC") {
    // Oliva Sur prefers EURC; reject USDC-only
    if (offer.paymentCurrency !== "EURC") {
      return { status: "rejected", reason: "Supplier requires EURC" };
    }
  }
  // Accept reduced MOQ if: quantity >= 80% of MOQ, price >= list-2%, immediate EURC, recurring intent
  const moqOk = offer.quantity >= supplier.moq * 0.8;
  const priceOk = offer.unitPriceEUR >= supplier.unitPriceEUR - 0.5;
  const settleOk = offer.paymentCurrency === "EURC" && offer.paymentTiming === "immediate";
  const recurringOk = offer.recurringIntent !== "none";

  if (supplier.supplierId === "oliva-sur" && moqOk && priceOk && settleOk && recurringOk) {
    return {
      status: "accepted",
      reason: "Accepted reduced MOQ for immediate EURC settlement + monthly recurring intent",
    };
  }

  if (offer.quantity >= supplier.moq && priceOk) {
    return { status: "accepted", reason: "Meets published MOQ" };
  }

  return { status: "rejected", reason: "Counteroffer outside supplier commercial policy" };
}
