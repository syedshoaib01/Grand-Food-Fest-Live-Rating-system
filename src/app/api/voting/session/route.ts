import { NextRequest, NextResponse } from "next/server";
import { getSessionStatus } from "@/lib/voting-engine";
import { verifySessionPayload } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const cookie = req.cookies.get("gff_session")?.value;
    let sessionId: string | null = null;

    if (cookie) {
      const decoded = verifySessionPayload<{ sessionId: string }>(cookie);
      if (decoded?.sessionId) {
        sessionId = decoded.sessionId;
      }
    }

    if (!sessionId) {
      return NextResponse.json({ authenticated: false, session: null }, { status: 200 });
    }

    const status = await getSessionStatus(sessionId);
    return NextResponse.json({
      authenticated: true,
      ...status,
    });
  } catch (error: any) {
    return NextResponse.json({ authenticated: false, error: error.message }, { status: 200 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true, message: "Session cleared" });
  response.cookies.delete("gff_session");
  return response;
}
