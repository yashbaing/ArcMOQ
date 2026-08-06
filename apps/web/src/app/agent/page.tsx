"use client";

import { ModeLabels, useDemo } from "@/components/useDemo";
import Link from "next/link";

export default function AgentPage() {
  const { state, loading, advance } = useDemo();
  const step = state?.demoStep ?? 0;

  return (
    <div className="container" style={{ padding: "2.5rem 0 4rem" }}>
      <p className="muted" style={{ letterSpacing: "0.1em", textTransform: "uppercase", fontSize: "0.75rem" }}>
        Screen 3 · Agent activity
      </p>
      <h1 style={{ fontSize: "clamp(2rem, 4vw, 3rem)", marginTop: "0.35rem" }}>Procurement agent</h1>
      <p className="muted" style={{ maxWidth: 560 }}>
        Research → match → negotiate → policy. The LLM reasons; deterministic code gates every transfer.
      </p>

      <div style={{ display: "flex", gap: "0.5rem", margin: "1.25rem 0", flexWrap: "wrap" }}>
        <button className="btn" disabled={loading || step >= 3} onClick={() => advance(Math.max(step, 2) === step ? step + 1 : 3)}>
          {step < 3 ? "Run negotiation scenes" : "Negotiation complete"}
        </button>
        <Link href="/settlement" className="btn btn-ghost" style={{ display: "inline-block" }}>
          Settlement →
        </Link>
      </div>

      <div className="grid-2">
        <div className="panel rise">
          <h3 style={{ marginTop: 0 }}>Timeline</h3>
          <ol style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {(state?.agentTimeline ?? []).length === 0 && (
              <li className="muted">Advance the demo to populate agent events.</li>
            )}
            {(state?.agentTimeline ?? []).map((ev, i) => (
              <li
                key={ev.id}
                className="rise"
                style={{
                  padding: "0.85rem 0",
                  borderBottom: "1px solid var(--line)",
                  animationDelay: `${i * 0.05}s`,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: "0.5rem" }}>
                  <strong>{ev.title}</strong>
                  {ev.label && <span className="label-chip">{ev.label}</span>}
                </div>
                <p className="muted mono" style={{ margin: "0.35rem 0 0", wordBreak: "break-word" }}>
                  {ev.detail}
                </p>
              </li>
            ))}
          </ol>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div className="panel rise rise-delay-1">
            <h3 style={{ marginTop: 0 }}>Supplier comparison</h3>
            {(state?.suppliers ?? []).map((s) => {
              const rank = state?.comparison?.ranked.find((r) => r.supplierId === s.supplierId);
              const selected = state?.comparison?.selected === s.supplierId;
              return (
                <div
                  key={s.supplierId}
                  style={{
                    padding: "0.75rem 0",
                    borderBottom: "1px solid var(--line)",
                    opacity: selected || !state?.comparison ? 1 : 0.7,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <strong style={{ color: selected ? "var(--citrus)" : "inherit" }}>{s.name}</strong>
                    <span className="mono">€{s.unitPriceEUR} · MOQ {s.moq}</span>
                  </div>
                  <p className="muted" style={{ margin: "0.25rem 0 0", fontSize: "0.85rem" }}>
                    {s.deliveryDays}d · {s.paymentCurrency}
                    {rank ? ` · score ${rank.score.toFixed(1)}` : ""}
                    {selected ? " · selected" : ""}
                  </p>
                </div>
              );
            })}
            <span className="label-chip">Supplier Quotes: Sandbox</span>
          </div>

          {state?.negotiation && (
            <div className="panel rise rise-delay-2">
              <h3 style={{ marginTop: 0 }}>MOQ renegotiated</h3>
              <p style={{ fontSize: "1.5rem", margin: "0.25rem 0" }} className="brand">
                {state.negotiation.originalMOQ} → {state.negotiation.newMOQ} tins
              </p>
              <p className="muted">
                €{state.negotiation.offer.unitPriceEUR}/tin · {state.negotiation.offer.paymentCurrency} immediate ·{" "}
                {state.negotiation.status}
              </p>
            </div>
          )}
        </div>
      </div>
      <ModeLabels labels={state?.labels} />
    </div>
  );
}
