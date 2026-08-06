import { NextResponse } from "next/server";
import { getState, upsertMandate } from "@/lib/agent/orchestrator";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(getState().order);
}

export async function POST(req: Request) {
  const body = await req.json();
  const state = upsertMandate(body);
  return NextResponse.json(state.order);
}
