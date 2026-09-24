import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getLiveLeaderboard } from "@/lib/ranking-engine";
import { requireAdmin } from "@/lib/auth";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;

    const vendor = await prisma.vendor.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
      },
      include: {
        ratings: {
          where: { isValid: true },
          select: { rating: true, createdAt: true },
          orderBy: { createdAt: "desc" },
        },
        awardsWon: true,
        nominees: {
          include: { award: true },
        },
      },
    });

    if (!vendor) {
      return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
    }

    // Calculate rating distribution: 5★ to 1★
    const distribution: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    let sum = 0;

    for (const r of vendor.ratings) {
      if (distribution[r.rating] !== undefined) {
        distribution[r.rating] += 1;
      }
      sum += r.rating;
    }

    const totalRatings = vendor.ratings.length;
    const average = totalRatings > 0 ? Number((sum / totalRatings).toFixed(2)) : 0;

    const percentages: Record<number, number> = {
      5: totalRatings > 0 ? Math.round((distribution[5] / totalRatings) * 100) : 0,
      4: totalRatings > 0 ? Math.round((distribution[4] / totalRatings) * 100) : 0,
      3: totalRatings > 0 ? Math.round((distribution[3] / totalRatings) * 100) : 0,
      2: totalRatings > 0 ? Math.round((distribution[2] / totalRatings) * 100) : 0,
      1: totalRatings > 0 ? Math.round((distribution[1] / totalRatings) * 100) : 0,
    };

    // Retrieve vendor's rank from leaderboard
    let rank: number | null = null;
    let trend = "—";
    let isEligible = false;

    if (vendor.vendorType === "FOOD") {
      const leaderboard = await getLiveLeaderboard({ eventId: vendor.eventId, useCache: true });
      const found = leaderboard.allRanked.find((v) => v.vendorId === vendor.id);
      if (found) {
        rank = found.rank;
        trend = found.trendFormatted;
        isEligible = found.isEligibleForLeaderboard;
      }
    }

    return NextResponse.json({
      vendor: {
        id: vendor.id,
        name: vendor.name,
        slug: vendor.slug,
        description: vendor.description,
        category: vendor.category,
        cuisine: vendor.cuisine,
        stallNumber: vendor.stallNumber,
        vendorType: vendor.vendorType,
        status: vendor.status,
        logoUrl: vendor.logoUrl,
        activeFrom: vendor.activeFrom,
        activeUntil: vendor.activeUntil,
      },
      stats: {
        totalRatings,
        averageRating: average,
        rank,
        trend,
        isEligibleForLeaderboard: isEligible,
        distribution,
        percentages,
      },
      nominations: vendor.nominees.map((n: any) => ({
        awardId: n.award.id,
        awardName: n.award.name,
        category: n.award.category,
        status: n.award.status,
      })),
      awardsWon: vendor.awardsWon.map((a: any) => ({
        id: a.id,
        name: a.name,
        category: a.category,
      })),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAdmin(req);
  if (!auth.authorized) {
    return auth.response;
  }

  try {
    const { id } = params;
    const body = await req.json();

    const updated = await prisma.vendor.update({
      where: { id },
      data: {
        name: body.name,
        description: body.description,
        category: body.category,
        cuisine: body.cuisine,
        stallNumber: body.stallNumber,
        vendorType: body.vendorType,
        status: body.status,
        logoUrl: body.logoUrl,
      },
    });

    return NextResponse.json({ vendor: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAdmin(req);
  if (!auth.authorized) {
    return auth.response;
  }

  try {
    const { id } = params;
    const body = await req.json();

    const updated = await prisma.vendor.update({
      where: { id },
      data: {
        status: body.status,
      },
    });

    return NextResponse.json({ vendor: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
