import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { scanForAnomalies, invalidateRatings } from "@/lib/anomaly-engine";

export async function GET() {
  try {
    // Run automated scan
    await scanForAnomalies();

    // Fetch all logged anomalies
    const anomalies = await prisma.anomalyLog.findMany({
      orderBy: [{ resolved: "asc" }, { createdAt: "desc" }],
      include: {
        vendor: {
          select: {
            id: true,
            name: true,
            stallNumber: true,
            category: true,
          },
        },
      },
    });

    const formatted = anomalies.map((a: any) => {
      let parsedDetails = {};
      try {
        parsedDetails = JSON.parse(a.details);
      } catch {
        parsedDetails = { raw: a.details };
      }

      return {
        id: a.id,
        vendorId: a.vendorId,
        vendorName: a.vendor.name,
        stallNumber: a.vendor.stallNumber,
        category: a.vendor.category,
        type: a.type,
        severity: a.severity,
        details: parsedDetails,
        resolved: a.resolved,
        resolvedAt: a.resolvedAt,
        resolvedBy: a.resolvedBy,
        createdAt: a.createdAt,
      };
    });

    return NextResponse.json({
      anomalies: formatted,
      totalCount: formatted.length,
      unresolvedCount: formatted.filter((a: any) => !a.resolved).length,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { anomalyId, action, vendorId } = body;

    if (!anomalyId) {
      return NextResponse.json({ error: "anomalyId is required" }, { status: 400 });
    }

    if (action === "INVALIDATE_RECENT_RATINGS") {
      // Invalidate ratings for this vendor over the last 1 hour
      const result = await invalidateRatings({
        vendorId,
        adminEmail: "admin@grandfoodfest.com",
        anomalyId,
      });

      return NextResponse.json({
        ...result,
        message: `Resolved anomaly. Invalidated ${result.invalidatedCount} suspicious ratings.`,
      });
    } else if (action === "DISMISS_ANOMALY") {
      // Mark as resolved/dismissed without altering ratings
      await prisma.anomalyLog.update({
        where: { id: anomalyId },
        data: {
          resolved: true,
          resolvedAt: new Date(),
          resolvedBy: "admin@grandfoodfest.com (Dismissed as benign)",
        },
      });

      return NextResponse.json({
        success: true,
        message: "Anomaly dismissed and logged.",
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
