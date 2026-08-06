"use client";

import Link from "next/link";
import { ModeLabels, useDemo } from "@/components/useDemo";

export default function HomePage() {
  const { state, loading, advance, runAll, reset } = useDemo();
  const order = state?.order;

  return (
    <div>
      <section
        className="container"
        style={{
          minHeight: "calc(100vh - 72px)",
          display: "grid",
          alignContent: "center",
          padding: "3rem 0 4rem",
          gap: "2rem",
          position: "relative",
        }}
      >
        <div
          className="rise"
          style={{
            position: "absolute",
            inset: "8% -5% auto auto",
            width: "min(52vw, 560px)",
            height: "min(70vh, 640px)",
            background:
              "radial-gradient(ellipse at 40% 40%, rgba(212,180,90,0.2), transparent 55%), linear-gradient(145deg, rgba(61,107,69,0.45), rgba(11,20,16,0.1))",
            clipPath: "polygon(18% 0%, 100% 0%, 82% 100%, 0% 100%)",
            filter: "blur(0px)",
            animation: "rise 1.1s ease both",
            pointerEvents: "none",
            zIndex: 0,
          }}
        />
        <div style={{ position: "relative", zIndex: 1, maxWidth: 640 }}>
          <p className="rise muted" style={{ letterSpacing: "0.14em", textTransform: "uppercase", fontSize: "0.78rem" }}>
            UAE SME trade · Arc Testnet
          </p>
          <h1 className="brand rise rise-delay-1" style={{ fontSize: "clamp(3rem, 8vw, 5.5rem)", margin: "0.4rem 0" }}>
            Arc<span style={{ color: "var(--gold)" }}>MOQ</span>
          </h1>
          <p className="rise rise-delay-2" style={{ fontSize: "1.25rem", color: "var(--mist)", maxWidth: 480 }}>
            Small buyers. Real inventory. One autonomous global order.
          </p>
          <div className="rise rise-delay-3" style={{ display: "flex", gap: "0.75rem", marginTop: "1.75rem", flexWrap: "wrap" }}>
            <button className="btn" onClick={() => runAll()} disabled={loading}>
              Run full demo
            </button>
            <Link className="btn btn-ghost" href="/mandate" style={{ display: "inline-block" }}>
              Create mandate
            </Link>
            <button className="btn btn-ghost" onClick={() => reset()} disabled={loading}>
              Reset
            </button>
          </div>
        </div>
      </section>

      <section className="container" style={{ paddingBottom: "4rem" }}>
        <h2 style={{ fontSize: "1.75rem", marginBottom: "1rem" }}>Active group order</h2>
        <div className="panel rise">
          {!order ? (
            <p className="muted">Loading…</p>
          ) : (
            <>
              <div className="grid-2">
                <div>
                  <h3 style={{ margin: "0 0 0.5rem", fontSize: "1.5rem" }}>{order.productName}</h3>
                  <p className="muted" style={{ margin: 0 }}>
                    Origin {order.origin} · {order.packaging}
                  </p>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: "1rem", marginTop: "1.5rem" }}>
                    <Stat label="Current demand" value={`${order.totalDemand || "—"} tins`} />
                    <Stat label="Supplier MOQ" value={`${order.supplierMOQ} tins`} />
                    <Stat label="UAE businesses" value={`${order.buyerCount || order.mandates.length}`} />
                    <Stat label="Est. wholesale savings" value={`~${order.estimatedSavingsPct}%`} />
                  </div>
                </div>
                <div>
                  <p style={{ margin: "0 0 0.75rem" }}>
                    Status: <strong style={{ color: "var(--gold)" }}>{order.status}</strong>
                  </p>
                  <p className="muted" style={{ fontSize: "0.95rem" }}>
                    Demo step {state?.demoStep ?? 0} / 6 — Spanish EVOO for UAE restaurants, hotels, grocers & caterers.
                  </p>
                  <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem", flexWrap: "wrap" }}>
                    <button className="btn" onClick={() => advance((state?.demoStep ?? 0) + 1)} disabled={loading}>
                      Next scene
                    </button>
                    <Link href="/agent" className="btn btn-ghost" style={{ display: "inline-block" }}>
                      Agent activity
                    </Link>
                  </div>
                </div>
              </div>
              <ModeLabels labels={state?.labels} />
            </>
          )}
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="muted" style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.06em" }}>
        {label}
      </div>
      <div className="brand" style={{ fontSize: "1.35rem", marginTop: "0.25rem" }}>
        {value}
      </div>
    </div>
  );
}
