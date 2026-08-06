#!/usr/bin/env tsx
import {
  aggregateDemand,
  acceptSupplierOffer,
  compareSuppliers,
  executeSettlement,
  getFxQuote,
  getState,
  mintReceipts,
  negotiateWithSupplier,
  redeemReceipt,
  resetState,
  runPolicyChecks,
  verifyShipment,
} from '../agent/orchestrator';

async function runDemo() {
  console.log('🫒 ArcMOQ Demo Flow\n');
  resetState();

  console.log('Step 1: Aggregate demand');
  const demand = aggregateDemand();
  console.log(`  → ${demand.total} tins from ${demand.buyers.length} buyers\n`);

  console.log('Step 2: Compare suppliers');
  const ranked = compareSuppliers();
  console.log(`  → Best target: ${ranked[0].supplierName}\n`);

  console.log('Step 3: Negotiate MOQ');
  const offer = negotiateWithSupplier('oliva-sur');
  console.log(`  → Counteroffer: ${offer.quantity} @ €${offer.unitPriceEUR}\n`);

  console.log('Step 4: Supplier accepts');
  acceptSupplierOffer();
  console.log('  → MOQ renegotiated: 1000 → 860\n');

  console.log('Step 5: Policy checks');
  const policy = runPolicyChecks();
  console.log(`  → ${policy.checks.filter((c) => c.passed).length}/${policy.checks.length} passed\n`);

  console.log('Step 6: FX quote & settlement');
  const fx = getFxQuote();
  console.log(`  → ${fx.usdcAmount.toFixed(2)} USDC → ${fx.eurcOut.toFixed(2)} EURC`);
  executeSettlement();
  console.log('  → Settlement complete\n');

  console.log('Step 7: Verify shipment & mint receipts');
  verifyShipment();
  mintReceipts();
  console.log('  → 860 receipt units minted\n');

  console.log('Step 8: Redemption');
  redeemReceipt('Restaurant A — Al Barsha', 100);
  console.log('  → 100 tins redeemed\n');

  console.log(`Demo complete. ${getState().activities.length} agent events recorded.`);
}

runDemo().catch(console.error);
