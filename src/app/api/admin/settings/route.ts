import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const event = await prisma.event.findFirst({
      include: {
        days: { orderBy: { dayNumber: "asc" } },
      },
    });

    if (!event) return NextResponse.json({ error: "No event found" }, { status: 404 });

    return NextResponse.json({ event });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const event = await prisma.event.findFirst();
    if (!event) return NextResponse.json({ error: "No event found" }, { status: 404 });

    // Update event properties
    const updatedEvent = await prisma.event.update({
      where: { id: event.id },
      data: {
        status: body.eventStatus || undefined,
        minimumRatingsForLeaderboard:
          body.minimumRatingsForLeaderboard !== undefined
            ? parseInt(body.minimumRatingsForLeaderboard, 10)
            : undefined,
        ratingLimitPerAttendeePerDay:
          body.ratingLimitPerAttendeePerDay !== undefined
            ? parseInt(body.ratingLimitPerAttendeePerDay, 10)
            : undefined,
      },
      include: { days: { orderBy: { dayNumber: "asc" } } },
    });

    // If activeDayId is provided, set it to LIVE and others to CLOSED or UPCOMING
    if (body.activeDayId) {
      await prisma.eventDay.updateMany({
        where: { eventId: event.id },
        data: { status: "CLOSED" },
      });
      await prisma.eventDay.update({
        where: { id: body.activeDayId },
        data: { status: "LIVE" },
      });
    }

    const refreshedEvent = await prisma.event.findUnique({
      where: { id: event.id },
      include: { days: { orderBy: { dayNumber: "asc" } } },
    });

    return NextResponse.json({
      success: true,
      message: "Event settings updated successfully.",
      event: refreshedEvent,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
