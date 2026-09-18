import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin, anonymizePassToken } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.authorized) {
    return auth.response;
  }

  try {
    const { searchParams } = new URL(req.url);
    const vendorId = searchParams.get("vendorId") || undefined;
    const eventDayId = searchParams.get("eventDayId") || undefined;
    const ratingVal = searchParams.get("rating") ? parseInt(searchParams.get("rating")!, 10) : undefined;
    const isValid = searchParams.get("isValid") !== null ? searchParams.get("isValid") === "true" : undefined;
    const searchSession = searchParams.get("searchSession") || undefined;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "40", 10);
    const skip = (page - 1) * limit;

    const where: any = {};
    if (vendorId) where.vendorId = vendorId;
    if (eventDayId) where.eventDayId = eventDayId;
    if (ratingVal) where.rating = ratingVal;
    if (isValid !== undefined) where.isValid = isValid;
    if (searchSession) {
      where.attendeeSession = {
        passToken: { contains: searchSession },
      };
    }

    const [total, ratings] = await Promise.all([
      prisma.rating.count({ where }),
      prisma.rating.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          vendor: { select: { name: true, stallNumber: true, category: true } },
          eventDay: { select: { dayNumber: true, date: true } },
          attendeeSession: { select: { passToken: true, passHash: true, id: true } },
        },
      }),
    ]);

    const formatted = ratings.map((r: any) => ({
      id: r.id,
      rating: r.rating,
      isValid: r.isValid,
      createdAt: r.createdAt.toISOString(),
      vendor: {
        id: r.vendorId,
        name: r.vendor.name,
        stall: r.vendor.stallNumber,
        category: r.vendor.category,
      },
      eventDay: {
        id: r.eventDayId,
        dayNumber: r.eventDay.dayNumber,
      },
      attendee: {
        passToken: anonymizePassToken(r.attendeeSession.passToken),
        anonymousHash: r.attendeeSession.passHash.substring(0, 10) + "...",
      },
    }));

    return NextResponse.json({
      ratings: formatted,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.authorized) {
    return auth.response;
  }

  try {
    const body = await req.json();
    const { ratingId, isValid } = body;

    if (!ratingId) {
      return NextResponse.json({ error: "ratingId is required" }, { status: 400 });
    }

    const updated = await prisma.rating.update({
      where: { id: ratingId },
      data: { isValid: Boolean(isValid) },
      include: { vendor: { select: { name: true } } },
    });

    return NextResponse.json({
      success: true,
      message: `Rating marked as ${updated.isValid ? "valid" : "invalid"}.`,
      rating: updated,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
