"use client";

import { ModeLabels, useDemo } from "@/components/useDemo";
import { useState } from "react";

export default function InventoryPage() {
  const { state, loading, advance, refresh } = useDemo();
  const [busy, setBusy] = useState(false);
  const batch = state?.batch;

  const mintScene = async () => {
    await advance(5);
  };

  const redeem = async () => {
    setBusy(true);
    try {
      if ((state?.demoStep ?? 0) < 5) await advance(5);
      await fetch("/api/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "redeem", businessName: "Restaurant A — Dubai Marina" }),
      });
      await refresh();
      if ((state?.demoStep ?? 0) < 6) await advance(6);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="container" style={{ padding: "2.5rem 0 4rem" }}>
      <p className="muted" style={{ letterSpacing: "0.1em", textTransform: "uppercase", fontSize: "0.75rem" }}>
        Screen 5 · Inventory receipt (RWA)
      </p>
      <h1 style={{ fontSize: "clamp(2rem, 4vw, 3rem)", marginTop: "0.35rem" }}>Digital warehouse receipt</h1>
      <p className="muted" style={{ maxWidth: 560 }}>
        Not a speculative token — a commercial claim on verified goods. AI extracts docs; warehouse attestation mints.
      </p>

      <div style={{ display: "flex", gap: "0.5rem", margin: "1.25rem 0", flexWrap: "wrap" }}>
        <button className="btn" disabled={loading} onClick={mintScene}>
          Verify & mint receipts
        </button>
        <button className="btn btn-ghost" disabled={busy || loading} onClick={redeem}>
          Redeem Restaurant A (100 tins)
        </button>
      </div>

      <div className="grid-2">
        <div className="panel rise">
          {!batch ? (
            <p className="muted">No batch yet — settle the order, then mint.</p>
          ) : (
            <>
              <h3 style={{ marginTop: 0 }}>{batch.batchId}</h3>
              <dl style={{ display: "grid", gap: "0.55rem" }}>
                <Row k="Product" v={batch.productName} />
                <Row k="Origin" v={batch.origin} />
                <Row k="Packaging" v={batch.packaging} />
                <Row k="Quantity" v={`${batch.totalQuantity} tins`} />
                <Row k="Supplier" v={batch.supplier} />
                <Row k="Verification" v={batch.verified ? "Attested" : "Pending"} />
                <Row k="Shipment status" v={batch.status} />
                <Row k="Token ID" v={String(batch.tokenId ?? "—")} />
                <Row k="Attestation" v={batch.attestationHash ?? "—"} mono />
              </dl>
              <span className="label-chip">Warehouse Attestation: Demo Verifier</span>
            </>
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div className="panel rise rise-delay-1">
            <h3 style={{ marginTop: 0 }}>Allocations</h3>
            {(batch?.allocations ?? []).map((a) => (
              <div key={a.buyer} style={{ padding: "0.55rem 0", borderBottom: "1px solid var(--line)" }}>
                <strong>{a.businessName}</strong>
                <div className="muted">
                  {a.quantity} units · redeemed {a.redeemed}
                </div>
              </div>
            ))}
          </div>

          <div className="panel rise rise-delay-2">
            <h3 style={{ marginTop: 0 }}>Document extraction (AI assist)</h3>
            {(batch?.documents ?? []).map((d) => (
              <div key={d.name} style={{ marginBottom: "0.75rem" }}>
                <strong>{d.name}</strong>
                <pre className="mono muted" style={{ margin: "0.25rem 0 0", whiteSpace: "pre-wrap", fontSize: "0.75rem" }}>
                  {JSON.stringify(d.extracted, null, 2)}
                </pre>
              </div>
            ))}
            {!batch?.documents?.length && <p className="muted">Upload simulation runs during mint scene.</p>}
          </div>

          <div className="panel rise rise-delay-3">
            <h3 style={{ marginTop: 0 }}>Redemption history</h3>
            {(batch?.redemptionHistory ?? []).length === 0 && <p className="muted">No redemptions yet.</p>}
            {(batch?.redemptionHistory ?? []).map((r, i) => (
              <div key={i} style={{ padding: "0.4rem 0", borderBottom: "1px solid var(--line)" }}>
                {r.buyer}: burned {r.quantity} → goods released
              </div>
            ))}
          </div>
        </div>
      </div>
      <ModeLabels labels={state?.labels} />
    </div>
  );
}

function Row({ k, v, mono }: { k: string; v: string; mono?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", borderBottom: "1px solid var(--line)", paddingBottom: "0.35rem" }}>
      <dt className="muted">{k}</dt>
      <dd className={mono ? "mono" : undefined} style={{ margin: 0, textAlign: "right", wordBreak: "break-all" }}>
        {v}
      </dd>
    </div>
  );
}
