"use client";

import { useEffect, useState } from "react";
import { ModeLabels, useDemo } from "@/components/useDemo";
import { explorerTx } from "@/lib/arc";
import Link from "next/link";

export default function SettlementPage() {
  const { state, loading, advance } = useDemo();
  const [network, setNetwork] = useState<{
    rpcOk?: boolean;
    blockNumber?: string;
    privateKeyConfigured?: boolean;
    contracts?: { groupOrder?: string };
  } | null>(null);

  useEffect(() => {
    fetch("/api/network")
      .then((r) => r.json())
      .then(setNetwork)
      .catch(() => setNetwork(null));
  }, []);

  const s = state?.settlement;

  return (
    <div className="container" style={{ padding: "2.5rem 0 4rem" }}>
      <p className="muted" style={{ letterSpacing: "0.1em", textTransform: "uppercase", fontSize: "0.75rem" }}>
        Screen 4 · Settlement
      </p>
      <h1 style={{ fontSize: "clamp(2rem, 4vw, 3rem)", marginTop: "0.35rem" }}>USDC → EURC on Arc</h1>
      <p className="muted" style={{ maxWidth: 560 }}>
        AED-facing UX · USDC pooled on Arc · StableFX adapter · EURC to Spanish supplier. Not AED→USDC via StableFX.
      </p>

      <div style={{ display: "flex", gap: "0.5rem", margin: "1.25rem 0", flexWrap: "wrap" }}>
        <button
          className="btn"
          disabled={loading || (state?.demoStep ?? 0) >= 4}
          onClick={() => advance(4)}
        >
          Execute settlement scene
        </button>
        <Link href="/inventory" className="btn btn-ghost" style={{ display: "inline-block" }}>
          Inventory receipts →
        </Link>
      </div>

      <div className="grid-2">
        <div className="panel rise">
          <h3 style={{ marginTop: 0 }}>Policy gate</h3>
          {(state?.policyChecks ?? []).length === 0 && <p className="muted">Run settlement to evaluate policies.</p>}
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {(state?.policyChecks ?? []).map((c) => (
              <li key={c.name} style={{ padding: "0.55rem 0", borderBottom: "1px solid var(--line)" }}>
                <span className={c.passed ? "ok" : "fail"}>{c.passed ? "✓" : "✗"}</span> {c.name}
                <div className="muted mono" style={{ fontSize: "0.8rem" }}>
                  {c.detail}
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="panel rise rise-delay-1">
          <h3 style={{ marginTop: 0 }}>Settlement receipt</h3>
          {!s ? (
            <p className="muted">No settlement yet.</p>
          ) : (
            <dl style={{ display: "grid", gap: "0.6rem" }}>
              <Row k="Total pooled USDC" v={`$${s.pooledUSDC.toLocaleString()}`} />
              <Row k="EURC paid" v={`€${s.eurcPaid.toLocaleString()}`} />
              <Row k="FX quote" v={`${s.fxRate} EURC/USDC`} />
              <Row k="FX fee" v={`${s.fxFeeBps} bps ($${s.fxFeeUSDC})`} />
              <Row k="Supplier wallet" v={s.supplierWallet} mono />
              <Row k="Quote ID" v={s.quoteId} mono />
              <Row k="Status" v={s.status} />
              <Row
                k="Tx link"
                v={
                  s.txHash ? (
                    <a href={explorerTx(s.txHash)} target="_blank" rel="noreferrer">
                      ArcScan ↗
                    </a>
                  ) : (
                    "Pending live deploy / faucet key"
                  )
                }
              />
            </dl>
          )}
          <div style={{ marginTop: "1rem" }}>
            <span className="label-chip">{s?.mode ?? "StableFX: Test or Adapter Mode"}</span>
            <span className="label-chip">Arc Settlement: Live Testnet</span>
          </div>
        </div>
      </div>

      <div className="panel" style={{ marginTop: "1.25rem" }}>
        <h3 style={{ marginTop: 0 }}>Arc Testnet connectivity</h3>
        <p className="muted">
          RPC {network?.rpcOk ? <span className="ok">online</span> : <span className="fail">unreachable</span>}
          {network?.blockNumber ? ` · block ${network.blockNumber}` : ""}
          {" · "}
          agent key {network?.privateKeyConfigured ? "configured" : "not set (demo uses adapter simulation)"}
        </p>
        <p className="muted" style={{ fontSize: "0.9rem" }}>
          Deploy: <span className="mono">cd contracts && forge script script/DeployArcMOQ.s.sol --rpc-url $ARC_RPC --broadcast</span>
        </p>
      </div>
      <ModeLabels labels={state?.labels} />
    </div>
  );
}

function Row({ k, v, mono }: { k: string; v: React.ReactNode; mono?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", borderBottom: "1px solid var(--line)", paddingBottom: "0.35rem" }}>
      <dt className="muted">{k}</dt>
      <dd className={mono ? "mono" : undefined} style={{ margin: 0, textAlign: "right", wordBreak: "break-all" }}>
        {v}
      </dd>
    </div>
  );
}
