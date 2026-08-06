import { NextResponse } from "next/server";
import { advanceDemo, getState, resetState } from "@/lib/agent/orchestrator";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(getState());
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  if (body.action === "reset") {
    return NextResponse.json(resetState());
  }
  if (body.action === "goto" && typeof body.step === "number") {
    resetState();
    return NextResponse.json(advanceDemo(body.step));
  }
  if (body.action === "runAll") {
    resetState();
    return NextResponse.json(advanceDemo(6));
  }
  return NextResponse.json(advanceDemo(body.step));
}
