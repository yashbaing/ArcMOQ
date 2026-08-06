import type { BuyerMandate, SupplierQuote } from "../types";
import { eurToUsdc, usdcToAed } from "../arc";

export type ComparisonRow = {
  supplierId: string;
  score: number;
  totalEUR: number;
  totalUSDCEst: number;
  totalAEDEst: number;
  moqGap: number;
  meetsDemand: boolean;
  reasons: string[];
};

/** Supplier Research Agent — structured comparison only. */
export function compareSuppliers(
  suppliers: SupplierQuote[],
  demandQty: number,
  mandates: BuyerMandate[]
): ComparisonRow[] {
  const deadline = Math.min(
    ...mandates.map((m) => new Date(m.deliveryDeadline).getTime())
  );
  const now = Date.now();
  const maxDays = Math.max(1, Math.ceil((deadline - now) / (86400 * 1000)));

  return suppliers
    .map((s) => {
      const qty = Math.max(demandQty, s.moq);
      const totalEUR = s.unitPriceEUR * qty;
      const totalUSDCEst = eurToUsdc(totalEUR);
      const totalAEDEst = usdcToAed(totalUSDCEst);
      const moqGap = Math.max(0, s.moq - demandQty);
      const meetsDemand = demandQty >= s.moq;
      const reasons: string[] = [];
      let score = 100;

      // Prefer lower unit price
      score -= s.unitPriceEUR;
      // Prefer smaller MOQ gap
      score -= moqGap * 0.05;
      // Prefer faster delivery within buyer deadlines
      if (s.deliveryDays > maxDays) {
        score -= 25;
        reasons.push(`Delivery ${s.deliveryDays}d may miss buyer deadline`);
      } else {
        reasons.push(`Delivery ${s.deliveryDays}d within mandate window`);
      }
      if (s.paymentCurrency === "EURC") {
        score += 8;
        reasons.push("Accepts EURC settlement");
      } else {
        score -= 5;
        reasons.push("USDC only — extra FX hop for EUR supplier books");
      }
      if (s.verified) {
        score += 5;
        reasons.push("Supplier verified / whitelisted candidate");
      }
      if (meetsDemand) {
        reasons.push("Demand meets published MOQ");
      } else {
        reasons.push(`MOQ gap: ${moqGap} tins — negotiation required`);
        score += 3; // slightly prefer negotiable targets with small gaps
      }

      return {
        supplierId: s.supplierId,
        score,
        totalEUR,
        totalUSDCEst,
        totalAEDEst,
        moqGap,
        meetsDemand,
        reasons,
      };
    })
    .sort((a, b) => b.score - a.score);
}
