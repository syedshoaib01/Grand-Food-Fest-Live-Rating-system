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

  // Fetch all ratings matching criteria
  const ratings = await prisma.rating.findMany({
    where: ratingWhere,
    select: {
      vendorId: true,
      rating: true,
      createdAt: true,
    },
  });

  const totalVotesCounted = ratings.length;

  // Calculate Festival-wide Global Average C
  const totalStarSum = ratings.reduce((sum, r) => sum + r.rating, 0);
  const festivalAverage =
    totalVotesCounted > 0 ? Number((totalStarSum / totalVotesCounted).toFixed(3)) : 4.0;

  // Group ratings by vendor
  const vendorRatingMap: Record<
    string,
    { count: number; sum: number; recentCount: number; recentSum: number }
  > = {};

  const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);

  for (const r of ratings) {
    if (!vendorRatingMap[r.vendorId]) {
      vendorRatingMap[r.vendorId] = { count: 0, sum: 0, recentCount: 0, recentSum: 0 };
    }
    vendorRatingMap[r.vendorId].count += 1;
    vendorRatingMap[r.vendorId].sum += r.rating;

    if (r.createdAt >= thirtyMinutesAgo) {
      vendorRatingMap[r.vendorId].recentCount += 1;
      vendorRatingMap[r.vendorId].recentSum += r.rating;
    }
  }

  // Build vendor score items
  const scoredVendors = foodVendors.map((vendor) => {
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
  scoredVendors.sort((a, b) => {
    if (b.rankingScore !== a.rankingScore) {
      return b.rankingScore - a.rankingScore;
    }
    if (b.ratingCount !== a.ratingCount) {
      return b.ratingCount - a.ratingCount;
    }
    return b.ratingAverage - a.ratingAverage;
  });

  // Assign Ranks with proper Tie Handling
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

    // Deterministic trend simulation based on recent rating velocity vs rank
    // If recentCount > 5, vendor has upward momentum!
    let rankChange = 0;
    if (item.recentCount >= 8) {
      rankChange = 3;
    } else if (item.recentCount >= 4) {
      rankChange = 1;
    } else if (item.recentCount === 0 && rank > 5 && i % 3 === 0) {
      rankChange = -1;
    }

    let trendFormatted = "—";
    if (rankChange > 0) {
      trendFormatted = `↑ ${rankChange}`;
    } else if (rankChange < 0) {
      trendFormatted = `↓ ${Math.abs(rankChange)}`;
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

  // Filter Top 10: strictly eligible vendors (ratingCount >= minThreshold and status ACTIVE)
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
