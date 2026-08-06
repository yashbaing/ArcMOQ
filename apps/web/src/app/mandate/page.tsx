"use client";

import { FormEvent, useState } from "react";
import { useDemo } from "@/components/useDemo";
import Link from "next/link";

export default function MandatePage() {
  const { state, refresh, advance, loading } = useDemo();
  const [form, setForm] = useState({
    businessName: "Restaurant A — Dubai Marina",
    quantity: 100,
    maxBudgetAED: 16500,
    deliveryDeadline: "2026-09-30",
    quality: "Extra Virgin",
    maxPriceVariancePct: 2,
    allowAutonomous: true,
  });
  const [saved, setSaved] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    await refresh();
    setSaved(true);
    await advance(1);
  };

  const primary = state?.order.mandates.find((m) => m.businessName.includes("Restaurant A"));

  return (
    <div className="container" style={{ padding: "2.5rem 0 4rem" }}>
      <p className="muted" style={{ letterSpacing: "0.1em", textTransform: "uppercase", fontSize: "0.75rem" }}>
        Screen 2 · Buyer mandate
      </p>
      <h1 style={{ fontSize: "clamp(2rem, 4vw, 3rem)", marginTop: "0.35rem" }}>Authorize your buy</h1>
      <p className="muted" style={{ maxWidth: 520 }}>
        The AI agent may execute only within these limits. Costs below budget run autonomously; overruns need approval.
      </p>

      <div className="grid-2" style={{ marginTop: "2rem" }}>
        <form className="panel rise" onSubmit={onSubmit}>
          <Field label="Business name">
            <input
              value={form.businessName}
              onChange={(e) => setForm({ ...form, businessName: e.target.value })}
              required
            />
          </Field>
          <Field label="Quantity (5L tins)">
            <input
              type="number"
              min={1}
              value={form.quantity}
              onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })}
              required
            />
          </Field>
          <Field label="Maximum budget (AED)">
            <input
              type="number"
              min={1}
              value={form.maxBudgetAED}
              onChange={(e) => setForm({ ...form, maxBudgetAED: Number(e.target.value) })}
              required
            />
          </Field>
          <Field label="Delivery deadline">
            <input
              type="date"
              value={form.deliveryDeadline}
              onChange={(e) => setForm({ ...form, deliveryDeadline: e.target.value })}
              required
            />
          </Field>
          <Field label="Product specification">
            <input value={form.quality} onChange={(e) => setForm({ ...form, quality: e.target.value })} />
          </Field>
          <Field label="Max price variance (%)">
            <input
              type="number"
              step={0.1}
              value={form.maxPriceVariancePct}
              onChange={(e) => setForm({ ...form, maxPriceVariancePct: Number(e.target.value) })}
            />
          </Field>
          <label style={{ display: "flex", gap: "0.6rem", alignItems: "center", margin: "1rem 0" }}>
            <input
              type="checkbox"
              checked={form.allowAutonomous}
              onChange={(e) => setForm({ ...form, allowAutonomous: e.target.checked })}
            />
            Allow autonomous execution within limits
          </label>
          <button className="btn" type="submit" disabled={loading}>
            Save mandate
          </button>
          {saved && <p className="ok" style={{ marginTop: "0.75rem" }}>Mandate saved · demo scene 1 ready</p>}
        </form>

        <aside className="panel rise rise-delay-1">
          <h3 style={{ marginTop: 0 }}>AED view (buyer-facing)</h3>
          <p className="muted" style={{ fontSize: "0.9rem" }}>
            Buyers never need to understand USDC/EURC. Settlement still runs on Arc.
          </p>
          <dl style={{ display: "grid", gap: "0.65rem" }}>
            <Row k="Quantity" v={`${primary?.quantity ?? form.quantity} tins`} />
            <Row k="Estimated cost" v={`AED ${((primary?.quantity ?? form.quantity) * 141.2).toLocaleString()}`} />
            <Row k="Maximum authorized" v={`AED ${(primary?.maxBudgetAED ?? form.maxBudgetAED).toLocaleString()}`} />
            <Row k="Final cost" v={primary?.finalCostAED != null ? `AED ${primary.finalCostAED.toLocaleString()}` : "—"} />
            <Row k="Released amount" v={primary?.releasedAED != null ? `AED ${primary.releasedAED.toLocaleString()}` : "—"} />
          </dl>
          <span className="label-chip">AED Collection: Simulated PSP</span>
          <div style={{ marginTop: "1.25rem" }}>
            <Link href="/agent" className="btn btn-ghost" style={{ display: "inline-block" }}>
              Watch agent →
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: "block", marginBottom: "0.9rem" }}>
      <span className="muted" style={{ display: "block", fontSize: "0.8rem", marginBottom: "0.3rem" }}>
        {label}
      </span>
      {children}
    </label>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", borderBottom: "1px solid var(--line)", paddingBottom: "0.4rem" }}>
      <dt className="muted">{k}</dt>
      <dd style={{ margin: 0, fontWeight: 500 }}>{v}</dd>
    </div>
  );
}
