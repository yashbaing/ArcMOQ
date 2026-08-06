"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Orders" },
  { href: "/mandate", label: "Mandate" },
  { href: "/agent", label: "Agent" },
  { href: "/settlement", label: "Settlement" },
  { href: "/inventory", label: "Receipts" },
];

export function SiteNav() {
  const path = usePathname();
  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 40,
        backdropFilter: "blur(14px)",
        background: "rgba(11, 20, 16, 0.75)",
        borderBottom: "1px solid var(--line)",
      }}
    >
      <div
        className="container"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: 72,
          gap: "1rem",
        }}
      >
        <Link href="/" className="brand" style={{ fontSize: "1.35rem", color: "var(--ink)" }}>
          Arc<span style={{ color: "var(--gold)" }}>MOQ</span>
        </Link>
        <nav style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap", justifyContent: "flex-end" }}>
          {links.map((l) => {
            const active = path === l.href;
            return (
              <Link
                key={l.href}
                href={l.href}
                style={{
                  padding: "0.4rem 0.7rem",
                  color: active ? "var(--citrus)" : "var(--mist)",
                  borderBottom: active ? "2px solid var(--gold)" : "2px solid transparent",
                  fontSize: "0.9rem",
                  fontWeight: 500,
                }}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
