import { NextResponse } from "next/server";
import { getState, redeemForBuyer } from "@/lib/agent/orchestrator";

export const dynamic = "force-dynamic";

export async function GET() {
  const s = getState();
  return NextResponse.json({ batch: s.batch, labels: s.labels });
}

export async function POST(req: Request) {
  const body = await req.json();
  if (body.action === "redeem") {
    return NextResponse.json(redeemForBuyer(body.businessName ?? "Restaurant A — Dubai Marina"));
  }
  return NextResponse.json({ error: "unknown action" }, { status: 400 });
}
