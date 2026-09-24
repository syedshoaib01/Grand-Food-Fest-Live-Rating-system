import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const event = await prisma.event.findFirst({
      orderBy: { createdAt: "desc" },
      include: {
        days: {
          orderBy: { dayNumber: "asc" },
        },
      },
    });

    if (!event) {
      return NextResponse.json({ error: "Festival event not configured" }, { status: 404 });
    }

    const activeDay =
      event.days.find((d: { status: string }) => d.status === "LIVE") || event.days[0];

    return NextResponse.json({
      event: {
        id: event.id,
        name: event.name,
        slug: event.slug,
        startDate: event.startDate,
        endDate: event.endDate,
        status: event.status,
        ratingLimitPerAttendeePerDay: event.ratingLimitPerAttendeePerDay,
        minimumRatingsForLeaderboard: event.minimumRatingsForLeaderboard,
      },
      activeDay,
      days: event.days,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
