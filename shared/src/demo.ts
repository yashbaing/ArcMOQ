import { BuyerMandateInput, SupplierQuote } from './types';
import { DEMO_PRODUCT } from './constants';

export const DEMO_BUYERS: BuyerMandateInput[] = [
  {
    buyerName: 'Restaurant A — Al Barsha',
    buyerAddress: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
    quantity: 100,
    maxBudgetAED: 16000,
    deliveryDeadline: '2026-09-30',
    qualityStandard: 'Extra Virgin',
    maxPriceVarianceBps: 200,
    allowAutonomousExecution: true,
  },
  {
    buyerName: 'Restaurant B — Downtown',
    buyerAddress: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
    quantity: 180,
    maxBudgetAED: 27000,
    deliveryDeadline: '2026-09-30',
    qualityStandard: 'Extra Virgin',
    maxPriceVarianceBps: 200,
    allowAutonomousExecution: true,
  },
  {
    buyerName: 'Hotel C — Palm Jumeirah',
    buyerAddress: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
    quantity: 250,
    maxBudgetAED: 37500,
    deliveryDeadline: '2026-09-28',
    qualityStandard: 'Extra Virgin',
    maxPriceVarianceBps: 150,
    allowAutonomousExecution: true,
  },
  {
    buyerName: 'Grocery D — Deira',
    buyerAddress: '0x90F79bf6EB2c4f870365E785982E1f101E93b906',
    quantity: 130,
    maxBudgetAED: 19500,
    deliveryDeadline: '2026-09-30',
    qualityStandard: 'Extra Virgin',
    maxPriceVarianceBps: 200,
    allowAutonomousExecution: true,
  },
  {
    buyerName: 'Catering E — Business Bay',
    buyerAddress: '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65',
    quantity: 200,
    maxBudgetAED: 30000,
    deliveryDeadline: '2026-09-25',
    qualityStandard: 'Extra Virgin',
    maxPriceVarianceBps: 200,
    allowAutonomousExecution: true,
  },
];

export const DEMO_SUPPLIERS: SupplierQuote[] = [
  {
    supplierId: 'oliva-sur',
    supplierName: 'Oliva Sur — Jaén',
    unitPriceEUR: 37.5,
    moq: 1000,
    deliveryDays: 30,
    acceptsEURC: true,
    acceptsUSDC: false,
    verified: true,
    qualityScore: 95,
  },
  {
    supplierId: 'aceites-andalucia',
    supplierName: 'Aceites Andalucía',
    unitPriceEUR: 39.2,
    moq: 800,
    deliveryDays: 21,
    acceptsEURC: true,
    acceptsUSDC: false,
    verified: true,
    qualityScore: 88,
  },
  {
    supplierId: 'iberian-gold',
    supplierName: 'Iberian Gold Oils',
    unitPriceEUR: 36.8,
    moq: 1200,
    deliveryDays: 40,
    acceptsEURC: false,
    acceptsUSDC: true,
    verified: false,
    qualityScore: 82,
  },
];

export const DEMO_TOTAL_DEMAND = DEMO_BUYERS.reduce((s, b) => s + b.quantity, 0);

export const DEMO_NEGOTIATED_OFFER = {
  supplierId: 'oliva-sur',
  quantity: DEMO_TOTAL_DEMAND,
  unitPriceEUR: 38.1,
  deliveryDays: 30,
  paymentCurrency: 'EURC' as const,
  paymentTiming: 'immediate' as const,
  recurringIntent: 'monthly',
};

export const DEMO_BATCH_ID = 'EVOO-ES-UAE-001';

export function aedFromEur(eur: number): number {
  return Math.round(eur * 3.97 * 100) / 100;
}

export function estimateBuyerCostAED(quantity: number, unitPriceEUR: number): number {
  return aedFromEur(quantity * unitPriceEUR);
}

export function demoSavingsPercent(): number {
  const retailAED = aedFromEur(DEMO_TOTAL_DEMAND * 45);
  const wholesaleAED = aedFromEur(DEMO_TOTAL_DEMAND * DEMO_NEGOTIATED_OFFER.unitPriceEUR);
  return Math.round(((retailAED - wholesaleAED) / retailAED) * 100);
}

export { DEMO_PRODUCT };
