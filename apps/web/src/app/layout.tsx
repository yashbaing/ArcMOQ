import type { Metadata } from "next";
import { Syne, Outfit } from "next/font/google";
import "./globals.css";
import { SiteNav } from "@/components/SiteNav";

const syne = Syne({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["500", "600", "700", "800"],
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["300", "400", "500", "600"],
});

export const metadata: Metadata = {
  title: "ArcMOQ — Small buyers. Real inventory. One autonomous global order.",
  description:
    "UAE SMEs pool demand for global inventory. An AI agent negotiates and settles in EURC on Arc; buyers receive redeemable warehouse receipts.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${syne.variable} ${outfit.variable}`}>
      <body>
        <div className="atmosphere" aria-hidden />
        <SiteNav />
        <main>{children}</main>
      </body>
    </html>
  );
}
