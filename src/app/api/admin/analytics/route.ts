import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getLiveLeaderboard } from "@/lib/ranking-engine";
import { getTrendingVendors } from "@/lib/trending-engine";
import { requireAdmin } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.authorized) {
    return auth.response;
  }

  try {
    const event = await prisma.event.findFirst({
      orderBy: { createdAt: "desc" },
      include: {
        days: { where: { status: "LIVE" } },
      },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const activeDay = event.days[0] || (await prisma.eventDay.findFirst({ orderBy: { dayNumber: "asc" } }));
    const activeDayId = activeDay?.id;

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    // Queries in parallel for high performance
    const [
      totalSessionsToday,
      totalRatingsToday,
      ratingsLastHour,
      activeFoodVendorsCount,
      activeLifestyleVendorsCount,
      allRatings,
      leaderboard,
      trending,
    ] = await Promise.all([
      prisma.attendeeSession.count({
        where: activeDayId ? { eventDayId: activeDayId } : {},
      }),
      prisma.rating.count({
        where: {
          isValid: true,
          ...(activeDayId ? { eventDayId: activeDayId } : {}),
        },
      }),
      prisma.rating.count({
        where: {
          isValid: true,
          createdAt: { gte: oneHourAgo },
          ...(activeDayId ? { eventDayId: activeDayId } : {}),
        },
      }),
      prisma.vendor.count({
        where: { vendorType: "FOOD", status: "ACTIVE" },
      }),
      prisma.vendor.count({
        where: { vendorType: "LIFESTYLE", status: "ACTIVE" },
      }),
      prisma.rating.findMany({
        where: {
          isValid: true,
          ...(activeDayId ? { eventDayId: activeDayId } : {}),
        },
        select: { rating: true, vendorId: true },
      }),
      getLiveLeaderboard({ eventId: event.id, eventDayId: activeDayId }),
      getTrendingVendors({ windowMinutes: 60, limit: 5 }),
    ]);

    const totalRatingsSum = allRatings.reduce((sum: number, r: { rating: number }) => sum + r.rating, 0);
    const avgRatingToday =
      totalRatingsToday > 0 ? Number((totalRatingsSum / totalRatingsToday).toFixed(2)) : 0;

    // Determine Most Rated Vendor
    const vendorCounts: Record<string, number> = {};
    for (const r of allRatings) {
      vendorCounts[r.vendorId] = (vendorCounts[r.vendorId] || 0) + 1;
    }

    let mostRatedVendorId = "";
    let highestCount = 0;
    for (const [vId, count] of Object.entries(vendorCounts)) {
      if (count > highestCount) {
        highestCount = count;
        mostRatedVendorId = vId;
      }
    }

    const mostRatedVendor = mostRatedVendorId
      ? await prisma.vendor.findUnique({
          where: { id: mostRatedVendorId },
          select: { name: true, stallNumber: true },
        })
      : null;

    const rank1 = leaderboard.top10[0] || null;
    const rank10 = leaderboard.top10[9] || null;
    const fastestRising = trending[0] || null;

    return NextResponse.json({
      metrics: {
        totalAttendeesToday: totalSessionsToday,
        votingSessionsToday: totalSessionsToday,
        ratingsToday: totalRatingsToday,
        ratingsLastHour,
        activeFoodVendors: activeFoodVendorsCount,
        activeLifestyleVendors: activeLifestyleVendorsCount,
        averageRatingToday: avgRatingToday,
      },
      highlights: {
        currentRank1: rank1
          ? { name: rank1.name, score: rank1.rankingScore, ratings: rank1.ratingCount, stall: rank1.stallNumber }
          : null,
        currentRank10: rank10
          ? { name: rank10.name, score: rank10.rankingScore, ratings: rank10.ratingCount, stall: rank10.stallNumber }
          : null,
        fastestRising: fastestRising
          ? {
              name: fastestRising.name,
              recentCount: fastestRising.recentRatingCount,
              label: fastestRising.velocityLabel,
              stall: fastestRising.stallNumber,
            }
          : null,
        mostRatedVendor: mostRatedVendor
          ? { name: mostRatedVendor.name, totalRatings: highestCount, stall: mostRatedVendor.stallNumber }
          : null,
      },
      eventStatus: event.status,
      activeDay: activeDay ? { dayNumber: activeDay.dayNumber, date: activeDay.date } : null,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
