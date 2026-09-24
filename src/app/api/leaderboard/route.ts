import { NextRequest, NextResponse } from "next/server";
import { getLiveLeaderboard } from "@/lib/ranking-engine";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const eventDayId = searchParams.get("eventDayId") || undefined;
    const eventId = searchParams.get("eventId") || undefined;

    const result = await getLiveLeaderboard({ eventId, eventDayId, useCache: true });

    return NextResponse.json(result, {
      headers: {
        "Cache-Control": "public, s-maxage=15, stale-while-revalidate=30",
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
