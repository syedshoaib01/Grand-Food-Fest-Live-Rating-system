import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getLiveLeaderboard } from "@/lib/ranking-engine";
import { requireAdmin, anonymizePassToken } from "@/lib/auth";

function convertToCSV(rows: Record<string, any>[]): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const csvLines = [headers.join(",")];

  for (const row of rows) {
    const line = headers.map((header) => {
      const val = row[header];
      if (val === null || val === undefined) return "";
      const str = String(val).replace(/"/g, '""');
      return str.includes(",") || str.includes("\n") || str.includes('"') ? `"${str}"` : str;
    });
    csvLines.push(line.join(","));
  }

  return csvLines.join("\n");
}

export async function GET(req: NextRequest, { params }: { params: { type: string } }) {
  const auth = await requireAdmin(req);
  if (!auth.authorized) {
    return auth.response;
  }

  try {
    const { type } = params;
    const { searchParams } = new URL(req.url);
    const format = searchParams.get("format") || "csv"; // csv | json

    let data: Record<string, any>[] = [];
    let filename = `gff-export-${type}-${new Date().toISOString().slice(0, 10)}`;

    if (type === "leaderboard") {
      const result = await getLiveLeaderboard();
      data = result.allRanked.map((v) => ({
        Rank: v.rank,
        VendorName: v.name,
        Category: v.category,
        Cuisine: v.cuisine || "",
        StallNumber: v.stallNumber,
        BayesianScore: v.rankingScore,
        RawAverageRating: v.ratingAverage,
        RatingCount: v.ratingCount,
        Trend: v.trendFormatted,
        IsEligibleTop10: v.isEligibleForLeaderboard ? "YES" : "NO",
      }));
    } else if (type === "vendors") {
      const vendors = await prisma.vendor.findMany({
        orderBy: [{ vendorType: "asc" }, { stallNumber: "asc" }],
        include: {
          ratings: { where: { isValid: true }, select: { rating: true } },
        },
      });

      data = vendors.map((v: any) => {
        const count = v.ratings.length;
        const sum = v.ratings.reduce((acc: number, r: { rating: number }) => acc + r.rating, 0);
        const avg = count > 0 ? (sum / count).toFixed(2) : "0.00";
        return {
          ID: v.id,
          Name: v.name,
          Stall: v.stallNumber,
          Type: v.vendorType,
          Category: v.category,
          Cuisine: v.cuisine || "",
          Status: v.status,
          TotalRatings: count,
          AverageRating: avg,
        };
      });
    } else if (type === "ratings") {
      const ratings = await prisma.rating.findMany({
        take: 5000,
        orderBy: { createdAt: "desc" },
        include: {
          vendor: { select: { name: true, stallNumber: true } },
          eventDay: { select: { dayNumber: true } },
          attendeeSession: { select: { passToken: true } },
        },
      });

      data = ratings.map((r: any) => ({
        RatingID: r.id,
        Timestamp: r.createdAt.toISOString(),
        DayNumber: r.eventDay.dayNumber,
        VendorName: r.vendor.name,
        Stall: r.vendor.stallNumber,
        RatingStars: r.rating,
        AttendeeIdentifier: anonymizePassToken(r.attendeeSession.passToken),
        IsValid: r.isValid ? "TRUE" : "FALSE",
      }));
    } else if (type === "summary") {
      const [event, totalRatings, totalSessions, totalVendors] = await Promise.all([
        prisma.event.findFirst({ include: { days: true } }),
        prisma.rating.count({ where: { isValid: true } }),
        prisma.attendeeSession.count(),
        prisma.vendor.count(),
      ]);

      data = [
        {
          FestivalName: event?.name || "Grand Food Fest",
          Status: event?.status || "LIVE",
          TotalRatingsCounted: totalRatings,
          TotalAttendeeSessions: totalSessions,
          TotalVendors: totalVendors,
          DaysConfigured: event?.days.length || 3,
          ExportTimestamp: new Date().toISOString(),
        },
      ];
    } else {
      return NextResponse.json({ error: "Invalid export type" }, { status: 400 });
    }

    if (format === "json") {
      return new NextResponse(JSON.stringify(data, null, 2), {
        headers: {
          "Content-Type": "application/json",
          "Content-Disposition": `attachment; filename="${filename}.json"`,
        },
      });
    }

    const csvContent = convertToCSV(data);
    return new NextResponse(csvContent, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}.csv"`,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
