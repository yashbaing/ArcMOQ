"use client";

import { useCallback, useEffect, useState } from "react";
import type { DemoState } from "@/lib/types";

export function useDemo() {
  const [state, setState] = useState<DemoState | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const res = await fetch("/api/demo");
    const data = await res.json();
    setState(data);
  }, []);

  useEffect(() => {
    refresh().catch((e) => setError(String(e)));
  }, [refresh]);

  const advance = async (step?: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(step != null ? { action: "goto", step } : {}),
      });
      setState(await res.json());
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  };

  const runAll = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "runAll" }),
      });
      setState(await res.json());
    } finally {
      setLoading(false);
    }
  };

  const reset = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reset" }),
      });
      setState(await res.json());
    } finally {
      setLoading(false);
    }
  };

  return { state, loading, error, refresh, advance, runAll, reset };
}

export function ModeLabels({ labels }: { labels?: DemoState["labels"] }) {
  if (!labels) return null;
  return (
    <div style={{ marginTop: "1rem" }}>
      {Object.values(labels).map((l) => (
        <span key={l} className="label-chip">
          {l}
        </span>
      ))}
    </div>
  );
}
