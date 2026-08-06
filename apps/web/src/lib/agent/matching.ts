import type { BuyerMandate } from "../types";

export type MatchResult = {
  compatible: boolean;
  totalDemand: number;
  buyers: BuyerMandate[];
  issues: string[];
};

/** Demand Matching Agent — combine compatible mandates. */
export function matchDemands(mandates: BuyerMandate[]): MatchResult {
  const issues: string[] = [];
  if (mandates.length === 0) {
    return { compatible: false, totalDemand: 0, buyers: [], issues: ["No mandates"] };
  }

  const product = mandates[0].product;
  const quality = mandates[0].quality;

  for (const m of mandates) {
    if (m.product !== product) issues.push(`${m.businessName}: product mismatch`);
    if (m.quality !== quality) issues.push(`${m.businessName}: quality mismatch`);
    if (!m.allowAutonomous) issues.push(`${m.businessName}: autonomous execution disabled`);
  }

  // Packaging assumed compatible for demo (5L tins)
  const deadlines = mandates.map((m) => new Date(m.deliveryDeadline).getTime());
  const spreadDays = (Math.max(...deadlines) - Math.min(...deadlines)) / 86400000;
  if (spreadDays > 45) issues.push("Delivery deadline spread exceeds 45 days");

  const totalDemand = mandates.reduce((s, m) => s + m.quantity, 0);

  return {
    compatible: issues.length === 0,
    totalDemand,
    buyers: mandates,
    issues,
  };
}
