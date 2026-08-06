import { EURC_PER_USDC, FX_FEE_BPS, aedToUsdc, eurToUsdc, usdcToAed } from "../arc";
import { matchDemands } from "./matching";
import { negotiate } from "./negotiation";
import { allPoliciesPassed, runPolicyChecks } from "./policy";
import { compareSuppliers } from "./research";
import { DEMO_BUYERS, DEMO_SUPPLIERS } from "../suppliers";
import type {
  AgentEvent,
  BuyerMandate,
  DemoState,
  SettlementRecord,
  WarehouseBatch,
} from "../types";

const SUPPLIER_WALLET = "0x5155155155155155155155155155155155155151";

function event(type: string, title: string, detail: string, label?: AgentEvent["label"]): AgentEvent {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    ts: new Date().toISOString(),
    type,
    title,
    detail,
    label,
  };
}

export function createInitialState(): DemoState {
  const mandates: BuyerMandate[] = DEMO_BUYERS.map((b) => ({
    ...b,
    funded: false,
    fundedUSDC: 0,
    usedUSDC: 0,
  }));

  return {
    order: {
      id: "EVOO-ES-UAE-001",
      productName: "Extra Virgin Olive Oil",
      origin: "Jaén, Spain",
      packaging: "5-liter tins",
      supplierMOQ: 1000,
      totalDemand: 0,
      buyerCount: 0,
      estimatedSavingsPct: 18,
      status: "open",
      mandates,
    },
    suppliers: DEMO_SUPPLIERS,
    policyChecks: [],
    agentTimeline: [],
    demoStep: 0,
    labels: {
      aedCollection: "AED Collection: Simulated PSP",
      arcSettlement: "Arc Settlement: Live Testnet",
      supplierQuotes: "Supplier Quotes: Sandbox",
      stableFX: "StableFX: Test or Adapter Mode",
      warehouseAttestation: "Warehouse Attestation: Demo Verifier",
    },
  };
}

/** Global in-memory demo store (server). */
let state: DemoState = createInitialState();

export function getState(): DemoState {
  return state;
}

export function resetState(): DemoState {
  state = createInitialState();
  return state;
}

export function upsertMandate(partial: Partial<BuyerMandate> & { businessName: string }): DemoState {
  const existing = state.order.mandates.find((m) => m.businessName === partial.businessName);
  if (existing) {
    Object.assign(existing, partial);
  } else {
    const m: BuyerMandate = {
      id: `m-${Date.now()}`,
      buyerAddress: partial.buyerAddress ?? `0x${Date.now().toString(16).padStart(40, "0")}`,
      businessName: partial.businessName,
      product: partial.product ?? "Extra Virgin Olive Oil",
      quantity: partial.quantity ?? 100,
      maxBudgetAED: partial.maxBudgetAED ?? 15000,
      quality: partial.quality ?? "Extra Virgin",
      deliveryDeadline: partial.deliveryDeadline ?? "2026-09-30",
      maxPriceVariancePct: partial.maxPriceVariancePct ?? 2,
      allowAutonomous: partial.allowAutonomous ?? true,
      funded: false,
      fundedUSDC: 0,
      usedUSDC: 0,
    };
    state.order.mandates.push(m);
  }
  recomputeDemand();
  return state;
}

function recomputeDemand() {
  const match = matchDemands(state.order.mandates);
  state.order.totalDemand = match.totalDemand;
  state.order.buyerCount = state.order.mandates.length;
}

/** Advance one demo scene (0→6). */
export function advanceDemo(step?: number): DemoState {
  const target = step ?? state.demoStep + 1;
  while (state.demoStep < target && state.demoStep < 6) {
    runStep(state.demoStep + 1);
  }
  return state;
}

function runStep(step: number) {
  switch (step) {
    case 1:
      sceneMandate();
      break;
    case 2:
      sceneGroupDemand();
      break;
    case 3:
      sceneNegotiate();
      break;
    case 4:
      sceneSettle();
      break;
    case 5:
      sceneMintRWA();
      break;
    case 6:
      sceneRedeem();
      break;
  }
  state.demoStep = step;
}

function sceneMandate() {
  // Ensure Restaurant A mandate is primary
  const a = state.order.mandates.find((m) => m.id === "m-a")!;
  a.quantity = 100;
  a.maxBudgetAED = 16500;
  a.allowAutonomous = true;
  state.agentTimeline.push(
    event("mandate", "Buyer mandate created", `${a.businessName}: ${a.quantity} tins · max AED ${a.maxBudgetAED.toLocaleString()} · autonomous yes`)
  );
}

function sceneGroupDemand() {
  recomputeDemand();
  const match = matchDemands(state.order.mandates);
  state.agentTimeline.push(
    event(
      "match",
      "Aggregated UAE demand",
      `${match.totalDemand} tins across ${match.buyers.length} businesses · supplier MOQ still 1,000`,
      "sandbox"
    )
  );
  if (!match.compatible) {
    state.agentTimeline.push(event("match", "Compatibility warnings", match.issues.join("; ")));
  }
}

function sceneNegotiate() {
  recomputeDemand();
  const ranked = compareSuppliers(state.suppliers, state.order.totalDemand, state.order.mandates);
  state.comparison = {
    selected: ranked[0]?.supplierId ?? "oliva-sur",
    ranked: ranked.map((r) => ({
      supplierId: r.supplierId,
      score: r.score,
      reasons: r.reasons,
    })),
  };

  state.agentTimeline.push(
    event(
      "research",
      "Compared three suppliers",
      ranked.map((r) => `${r.supplierId} score ${r.score.toFixed(1)}`).join(" · "),
      "sandbox"
    )
  );

  // Prefer oliva-sur for the demo moment (MOQ renegotiation)
  const target = state.suppliers.find((s) => s.supplierId === "oliva-sur")!;
  state.comparison.selected = "oliva-sur";
  state.agentTimeline.push(
    event("research", "Selected supplier for negotiation", `${target.name} — MOQ ${target.moq}, €${target.unitPriceEUR}/tin`, "sandbox")
  );

  const negotiation = negotiate(target, state.order.totalDemand);
  state.negotiation = negotiation;
  state.order.status = negotiation.status === "accepted" ? "offer_accepted" : "negotiating";
  state.order.supplierMOQ = negotiation.newMOQ;

  state.agentTimeline.push(
    event(
      "negotiate",
      "Submitted structured counteroffer",
      JSON.stringify(negotiation.offer),
      "sandbox"
    )
  );
  state.agentTimeline.push(
    event(
      "negotiate",
      negotiation.status === "accepted" ? "Supplier accepted reduced MOQ" : "Supplier rejected offer",
      `MOQ ${negotiation.originalMOQ} → ${negotiation.newMOQ} · €${negotiation.offer.unitPriceEUR}/tin · expiry 5 min`,
      "sandbox"
    )
  );
}

function sceneSettle() {
  if (!state.negotiation || state.negotiation.status !== "accepted") {
    sceneNegotiate();
  }
  const neg = state.negotiation!;
  const supplier = state.suppliers.find((s) => s.supplierId === neg.offer.supplierId)!;

  // Simulate AED PSP → USDC funding
  for (const m of state.order.mandates) {
    const estUSDC = aedToUsdc(m.maxBudgetAED);
    m.funded = true;
    m.fundedUSDC = Math.round(estUSDC * 100) / 100;
  }
  state.order.status = "funded";

  state.agentTimeline.push(
    event("funding", "AED collected via local PSP", state.labels.aedCollection, "simulated")
  );
  state.agentTimeline.push(
    event(
      "funding",
      "USDC deposited into group-order pool",
      `$${state.order.mandates.reduce((s, m) => s + m.fundedUSDC, 0).toFixed(2)} USDC pooled on Arc`,
      "live"
    )
  );

  const checks = runPolicyChecks({
    supplier,
    negotiation: neg,
    mandates: state.order.mandates,
    whitelistedSupplierIds: ["oliva-sur", "andalucia-gold", "med-grove"],
    approvedDestination: SUPPLIER_WALLET,
    fxSlippageBps: 10,
    orderFullyFunded: true,
  });
  state.policyChecks = checks;

  state.agentTimeline.push(
    event(
      "policy",
      "Verified buyer budgets & policy gates",
      checks.map((c) => `${c.passed ? "✓" : "✗"} ${c.name}`).join(" · ")
    )
  );

  if (!allPoliciesPassed(checks)) {
    state.agentTimeline.push(event("policy", "Execution blocked", "One or more policy checks failed"));
    return;
  }

  const totalEUR = neg.offer.quantity * neg.offer.unitPriceEUR;
  const usdcGross = eurToUsdc(totalEUR) / (1 - FX_FEE_BPS / 10_000);
  const eurcOut = totalEUR;
  const feeUSDC = usdcGross * (FX_FEE_BPS / 10_000);

  // Allocate costs per buyer
  for (const m of state.order.mandates) {
    const share = (usdcGross * m.quantity) / neg.offer.quantity;
    m.usedUSDC = Math.round(share * 100) / 100;
    m.finalCostAED = Math.round(usdcToAed(m.usedUSDC) * 100) / 100;
    m.releasedAED = Math.round((m.maxBudgetAED - (m.finalCostAED ?? 0)) * 100) / 100;
  }

  const settlement: SettlementRecord = {
    pooledUSDC: Math.round(usdcGross * 100) / 100,
    eurcPaid: eurcOut,
    fxRate: EURC_PER_USDC,
    fxFeeBps: FX_FEE_BPS,
    fxFeeUSDC: Math.round(feeUSDC * 100) / 100,
    supplierWallet: SUPPLIER_WALLET,
    txHash: undefined,
    status: "simulated",
    quoteId: `sfx-${Date.now().toString(16)}`,
    mode: "StableFX: Test or Adapter Mode",
  };
  state.settlement = settlement;
  state.order.status = "settled";

  state.agentTimeline.push(
    event("fx", "Requested FX quote USDC→EURC", `Rate ${EURC_PER_USDC} · fee ${FX_FEE_BPS} bps`, "adapter")
  );
  state.agentTimeline.push(
    event(
      "settle",
      "Executed supplier settlement",
      `${settlement.pooledUSDC} USDC → ${settlement.eurcPaid} EURC to ${SUPPLIER_WALLET}`,
      "adapter"
    )
  );
}

function sceneMintRWA() {
  if (state.order.status !== "settled") sceneSettle();

  const docs: { name: string; extracted: Record<string, string> }[] = [
    {
      name: "Commercial Invoice",
      extracted: {
        supplier: "Oliva Sur Cooperativa",
        quantity: "860",
        batchId: "EVOO-ES-UAE-001",
        currency: "EUR",
      },
    },
    {
      name: "Packing List",
      extracted: { packaging: "5-liter tins", units: "860", netWeightKg: "3956" },
    },
    {
      name: "Bill of Lading",
      extracted: {
        shipmentRef: "MSCU-ES-DXB-78421",
        destination: "Jebel Ali, UAE",
        vessel: "MSC Olivia",
      },
    },
  ];

  state.agentTimeline.push(
    event(
      "docs",
      "AI extracted shipment fields from documents",
      "Supplier, quantity, batch ID, destination, shipment reference — pending human/warehouse attestation",
      "sandbox"
    )
  );

  const attestationHash = `0xattest${Date.now().toString(16)}`;
  const batch: WarehouseBatch = {
    batchId: "EVOO-ES-UAE-001",
    tokenId: 1,
    productName: state.order.productName,
    origin: state.order.origin,
    packaging: state.order.packaging,
    totalQuantity: state.order.totalDemand,
    supplier: "Oliva Sur Cooperativa",
    status: "In Transit",
    verified: true,
    attestationHash,
    allocations: state.order.mandates.map((m) => ({
      buyer: m.buyerAddress,
      businessName: m.businessName,
      quantity: m.quantity,
      redeemed: 0,
    })),
    documents: docs,
    redemptionHistory: [],
  };
  state.batch = batch;
  state.order.status = "receipts_minted";

  state.agentTimeline.push(
    event(
      "attest",
      "Warehouse attestation verified shipment",
      `${state.labels.warehouseAttestation} · ${attestationHash}`,
      "simulated"
    )
  );
  state.agentTimeline.push(
    event(
      "mint",
      "Minted warehouse receipt units",
      `860 ERC-1155 units allocated to ${state.order.mandates.length} KYB buyers`,
      "live"
    )
  );
}

function sceneRedeem() {
  if (!state.batch) sceneMintRWA();
  const batch = state.batch!;
  batch.status = "Arrived";
  const restaurant = batch.allocations.find((a) => a.businessName.includes("Restaurant A"));
  if (restaurant && restaurant.redeemed === 0) {
    restaurant.redeemed = restaurant.quantity;
    batch.redemptionHistory.push({
      buyer: restaurant.businessName,
      quantity: restaurant.quantity,
      at: new Date().toISOString(),
    });
    const remaining = batch.allocations.reduce((s, a) => s + (a.quantity - a.redeemed), 0);
    batch.status = remaining === 0 ? "Redeemed" : "Partially Redeemed";
    state.agentTimeline.push(
      event(
        "redeem",
        "Restaurant A redeemed allocation",
        `${restaurant.quantity} receipt units burned → ${restaurant.quantity} physical tins released`
      )
    );
  }
}

export function redeemForBuyer(businessName: string): DemoState {
  if (!state.batch) return state;
  const alloc = state.batch.allocations.find((a) => a.businessName === businessName);
  if (!alloc || alloc.redeemed >= alloc.quantity) return state;
  const qty = alloc.quantity - alloc.redeemed;
  alloc.redeemed = alloc.quantity;
  state.batch.redemptionHistory.push({
    buyer: businessName,
    quantity: qty,
    at: new Date().toISOString(),
  });
  const remaining = state.batch.allocations.reduce((s, a) => s + (a.quantity - a.redeemed), 0);
  state.batch.status = remaining === 0 ? "Redeemed" : "Partially Redeemed";
  state.agentTimeline.push(
    event("redeem", `${businessName} redeemed`, `${qty} units burned`)
  );
  return state;
}

export function attachTxHash(hash: string): DemoState {
  if (state.settlement) {
    state.settlement.txHash = hash;
    state.settlement.status = "confirmed";
    state.settlement.mode = "Arc Settlement: Live Testnet";
  }
  return state;
}
