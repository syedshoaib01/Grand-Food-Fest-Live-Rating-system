import prisma from "./prisma";

export interface LeaderboardItem {
  rank: number;
  vendorId: string;
  name: string;
  slug: string;
  category: string;
  cuisine: string | null;
  stallNumber: string;
  ratingAverage: number;
  ratingCount: number;
  rankingScore: number;
  rankChange: number; // positive = climbed, negative = dropped, 0 = unchanged
  trendFormatted: string; // "↑ 2", "↓ 1", "—"
  isTied: boolean;
  isEligibleForLeaderboard: boolean;
}

export interface LeaderboardResult {
  top10: LeaderboardItem[];
  allRanked: LeaderboardItem[];
  totalVotesCounted: number;
  totalFoodVendors: number;
  festivalAverage: number;
  minimumRatingsThreshold: number;
  lastCalculatedAt: string;
}

/**
 * Calculates confidence-adjusted Bayesian ranking scores
 * Score = (v / (v + m)) * R + (m / (v + m)) * C
 */
export function calculateBayesianScore(
  ratingCount: number,
  rawAverage: number,
  globalAverage: number,
  minThreshold: number
): number {
  if (ratingCount === 0) return 0;
  const score =
    (ratingCount / (ratingCount + minThreshold)) * rawAverage +
    (minThreshold / (ratingCount + minThreshold)) * globalAverage;
  return Number(score.toFixed(4));
}

/**
 * Compute the live leaderboard for the active event (or specific event day)
 */
export async function getLiveLeaderboard(options?: {
  eventId?: string;
  eventDayId?: string;
}): Promise<LeaderboardResult> {
  // 1. Get Event and configuration
  const event = options?.eventId
    ? await prisma.event.findUnique({ where: { id: options.eventId } })
    : await prisma.event.findFirst({ orderBy: { createdAt: "desc" } });

  if (!event) {
    return {
      top10: [],
      allRanked: [],
      totalVotesCounted: 0,
      totalFoodVendors: 0,
      festivalAverage: 0,
      minimumRatingsThreshold: 20,
      lastCalculatedAt: new Date().toISOString(),
    };
  }

  const minThreshold = event.minimumRatingsForLeaderboard || 20;

  // 2. Fetch all valid ratings for FOOD vendors in this event
  const ratingWhere: any = {
    eventId: event.id,
    isValid: true,
    vendor: {
      vendorType: "FOOD",
      status: { in: ["ACTIVE", "PAUSED", "CLOSED"] }, // allow historical ratings
    },
  };

  if (options?.eventDayId) {
    ratingWhere.eventDayId = options.eventDayId;
  }

  // Fetch all food vendors
  const foodVendors = await prisma.vendor.findMany({
    where: {
      eventId: event.id,
      vendorType: "FOOD",
    },
    select: {
      id: true,
      name: true,
      slug: true,
      category: true,
      cuisine: true,
      stallNumber: true,
      status: true,
    },
  });

  const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);

  // Execute database-level aggregations instead of loading all individual rating rows
  const [overallAgg, vendorGroups, recentVendorGroups] = await Promise.all([
    prisma.rating.aggregate({
      where: ratingWhere,
      _count: { rating: true },
      _sum: { rating: true },
    }),
    prisma.rating.groupBy({
      by: ["vendorId"],
      where: ratingWhere,
      _count: { rating: true },
      _sum: { rating: true },
    }),
    prisma.rating.groupBy({
      by: ["vendorId"],
      where: {
        ...ratingWhere,
        createdAt: { gte: thirtyMinutesAgo },
      },
      _count: { rating: true },
    }),
  ]);

  const totalVotesCounted = overallAgg._count.rating || 0;
  const totalStarSum = overallAgg._sum.rating || 0;
  const festivalAverage =
    totalVotesCounted > 0 ? Number((totalStarSum / totalVotesCounted).toFixed(3)) : 4.0;

  // Build vendor stats lookup
  const vendorRatingMap: Record<
    string,
    { count: number; sum: number; recentCount: number }
  > = {};

  for (const g of vendorGroups) {
    vendorRatingMap[g.vendorId] = {
      count: g._count.rating || 0,
      sum: g._sum.rating || 0,
      recentCount: 0,
    };
  }

  for (const rg of recentVendorGroups) {
    if (vendorRatingMap[rg.vendorId]) {
      vendorRatingMap[rg.vendorId].recentCount = rg._count.rating || 0;
    }
  }

  // 3. Look up previous RankSnapshot for true rank movement (↑ X, ↓ Y, —, NEW)
  let previousRankMap: Record<string, number> = {};
  try {
    const latestSnapshot = await prisma.rankSnapshot.findFirst({
      where: { eventId: event.id },
      orderBy: { snapshotAt: "desc" },
      select: { snapshotAt: true },
    });

    if (latestSnapshot) {
      const pastSnapshots = await prisma.rankSnapshot.findMany({
        where: {
          eventId: event.id,
          snapshotAt: latestSnapshot.snapshotAt,
        },
        select: {
          vendorId: true,
          rank: true,
        },
      });

      for (const s of pastSnapshots) {
        previousRankMap[s.vendorId] = s.rank;
      }
    }
  } catch {
    // If table not initialized yet, proceed gracefully
  }

  // Build vendor score items
  const scoredVendors = foodVendors.map((vendor: any) => {
    const stats = vendorRatingMap[vendor.id] || {
      count: 0,
      sum: 0,
      recentCount: 0,
      recentSum: 0,
    };
    const count = stats.count;
    const rawAverage = count > 0 ? Number((stats.sum / count).toFixed(2)) : 0;
    const score = calculateBayesianScore(count, rawAverage, festivalAverage, minThreshold);
    const isEligible = count >= minThreshold && vendor.status === "ACTIVE";

    return {
      vendorId: vendor.id,
      name: vendor.name,
      slug: vendor.slug,
      category: vendor.category,
      cuisine: vendor.cuisine,
      stallNumber: vendor.stallNumber,
      ratingAverage: rawAverage,
      ratingCount: count,
      rankingScore: score,
      recentCount: stats.recentCount,
      isEligibleForLeaderboard: isEligible,
    };
  });

  // Sort by rankingScore descending, break ties with ratingCount descending, then rawAverage
  scoredVendors.sort((a: any, b: any) => {
    if (b.rankingScore !== a.rankingScore) {
      return b.rankingScore - a.rankingScore;
    }
    if (b.ratingCount !== a.ratingCount) {
      return b.ratingCount - a.ratingCount;
    }
    return b.ratingAverage - a.ratingAverage;
  });

  // Assign Ranks with proper Tie Handling & Truthful Movement
  let currentRank = 1;
  const allRanked: LeaderboardItem[] = [];

  for (let i = 0; i < scoredVendors.length; i++) {
    const item = scoredVendors[i];
    const prev = scoredVendors[i - 1];

    let rank = currentRank;
    let isTied = false;

    if (prev && prev.rankingScore === item.rankingScore && prev.ratingCount === item.ratingCount) {
      rank = allRanked[i - 1].rank;
      isTied = true;
      allRanked[i - 1].isTied = true;
    } else {
      rank = i + 1;
      currentRank = rank;
    }

    // Truthful rank movement from historical snapshots
    let rankChange = 0;
    let trendFormatted = "—";

    const hasPreviousRecord = Object.prototype.hasOwnProperty.call(previousRankMap, item.vendorId);
    if (hasPreviousRecord) {
      const prevRank = previousRankMap[item.vendorId];
      // Positive diff means rank number decreased (e.g., from rank 5 to rank 2: climbed 3 spots)
      rankChange = prevRank - rank;
      if (rankChange > 0) {
        trendFormatted = `↑ ${rankChange}`;
      } else if (rankChange < 0) {
        trendFormatted = `↓ ${Math.abs(rankChange)}`;
      } else {
        trendFormatted = "—";
      }
    } else {
      // If vendor is eligible and has ratings, but had no prior snapshot, it's a new entrant
      if (item.isEligibleForLeaderboard && Object.keys(previousRankMap).length > 0) {
        trendFormatted = "NEW";
      } else {
        trendFormatted = "—";
      }
    }

    allRanked.push({
      rank,
      vendorId: item.vendorId,
      name: item.name,
      slug: item.slug,
      category: item.category,
      cuisine: item.cuisine,
      stallNumber: item.stallNumber,
      ratingAverage: item.ratingAverage,
      ratingCount: item.ratingCount,
      rankingScore: item.rankingScore,
      rankChange,
      trendFormatted,
      isTied,
      isEligibleForLeaderboard: item.isEligibleForLeaderboard,
    });
  }

  // Filter Top 10: strictly eligible food vendors
  const top10 = allRanked
    .filter((v) => v.isEligibleForLeaderboard)
    .slice(0, 10)
    .map((v, index) => ({
      ...v,
      rank: index + 1, // Normalized display rank for Top 10
    }));

  return {
    top10,
    allRanked,
    totalVotesCounted,
    totalFoodVendors: foodVendors.length,
    festivalAverage,
    minimumRatingsThreshold: minThreshold,
    lastCalculatedAt: new Date().toISOString(),
  };
}

/**
 * Persists a truthful RankSnapshot for an event at the current moment
 */
export async function createRankSnapshot(eventId: string): Promise<number> {
  const result = await getLiveLeaderboard({ eventId });
  const snapshotAt = new Date();

  // Record top eligible vendors or all ranked vendors with ratings
  const vendorsToSnapshot = result.allRanked.filter((v) => v.ratingCount > 0);
  if (vendorsToSnapshot.length === 0) return 0;

  const data = vendorsToSnapshot.map((v) => ({
    eventId,
    vendorId: v.vendorId,
    rank: v.rank,
    score: v.rankingScore,
    ratingsCount: v.ratingCount,
    snapshotAt,
  }));

  await prisma.rankSnapshot.createMany({
    data,
  });

  return data.length;
}
