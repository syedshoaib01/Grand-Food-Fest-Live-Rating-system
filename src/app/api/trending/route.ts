import { NextRequest, NextResponse } from "next/server";
import { getTrendingVendors } from "@/lib/trending-engine";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const windowMinutes = parseInt(searchParams.get("window") || "60", 10);
    const limit = parseInt(searchParams.get("limit") || "6", 10);

    const trending = await getTrendingVendors({ windowMinutes, limit });

    return NextResponse.json({
      trending,
      windowMinutes,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
