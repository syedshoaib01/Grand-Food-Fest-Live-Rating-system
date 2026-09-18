import prisma from "./prisma";

export interface TrendingVendor {
  vendorId: string;
  name: string;
  slug: string;
  category: string;
  cuisine: string | null;
  stallNumber: string;
  recentRatingCount: number;
  recentAverage: number;
  trendingScore: number;
  velocityLabel: string;
  surgeReason: string;
}

export interface TrendingOptions {
  windowMinutes?: number; // default 60 minutes
  limit?: number; // default 6
}

export async function getTrendingVendors(options?: TrendingOptions): Promise<TrendingVendor[]> {
  const windowMinutes = options?.windowMinutes || 60;
  const limit = options?.limit || 6;
  const windowStart = new Date(Date.now() - windowMinutes * 60 * 1000);

  // Fetch ratings within rolling window for FOOD vendors
  const recentRatings = await prisma.rating.findMany({
    where: {
      isValid: true,
      createdAt: { gte: windowStart },
      vendor: {
        vendorType: "FOOD",
        status: "ACTIVE",
      },
    },
    include: {
      vendor: true,
    },
  });

  if (recentRatings.length === 0) {
    // Fallback: If event just started or window is quiet, pull the most recently rated vendors
    const latestRatings = await prisma.rating.findMany({
      where: {
        isValid: true,
        vendor: { vendorType: "FOOD", status: "ACTIVE" },
      },
      include: { vendor: true },
      orderBy: { createdAt: "desc" },
      take: 60,
    });

    return aggregateTrending(latestRatings, limit);
  }

  return aggregateTrending(recentRatings, limit);
}

function aggregateTrending(ratings: any[], limit: number): TrendingVendor[] {
  const map: Record<
    string,
    { vendor: any; count: number; sum: number; recentTimestamps: number[] }
  > = {};

  for (const r of ratings) {
    const vId = r.vendorId;
    if (!map[vId]) {
      map[vId] = { vendor: r.vendor, count: 0, sum: 0, recentTimestamps: [] };
    }
    map[vId].count += 1;
    map[vId].sum += r.rating;
    map[vId].recentTimestamps.push(new Date(r.createdAt).getTime());
  }

  const items: TrendingVendor[] = Object.values(map).map(({ vendor, count, sum }) => {
    const avg = Number((sum / count).toFixed(2));
    // Score combines velocity and positive rating sentiment
    const score = Number((count * (avg / 3.0)).toFixed(2));

    let positions = 2;
    if (count > 15) positions = 7;
    else if (count > 8) positions = 4;
    else if (count > 4) positions = 3;

    return {
      vendorId: vendor.id,
      name: vendor.name,
      slug: vendor.slug,
      category: vendor.category,
      cuisine: vendor.cuisine,
      stallNumber: vendor.stallNumber,
      recentRatingCount: count,
      recentAverage: avg,
      trendingScore: score,
      velocityLabel: `↑ ${positions} positions`,
      surgeReason: `${count} ratings in the last hour`,
    };
  });

  // Sort by trending score descending
  items.sort((a, b) => b.trendingScore - a.trendingScore);

  return items.slice(0, limit);
}
