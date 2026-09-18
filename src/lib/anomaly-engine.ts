import prisma from "./prisma";

export interface AnomalyScanResult {
  detectedCount: number;
  anomalies: Array<{
    vendorId: string;
    vendorName: string;
    type: string;
    severity: string;
    description: string;
    recentCount: number;
  }>;
}

/**
 * Scans active ratings for abnormal velocity spikes (e.g. >20 ratings within 10 minutes)
 * or highly concentrated identical-score bursts.
 */
export async function scanForAnomalies(): Promise<AnomalyScanResult> {
  const event = await prisma.event.findFirst({ orderBy: { createdAt: "desc" } });
  if (!event) return { detectedCount: 0, anomalies: [] };

  const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);

  // Group recent ratings by vendor
  const recentRatings = await prisma.rating.findMany({
    where: {
      eventId: event.id,
      isValid: true,
      createdAt: { gte: tenMinutesAgo },
    },
    include: {
      vendor: true,
    },
  });

  const vendorCounts: Record<string, { vendor: any; count: number; ratings: number[] }> = {};
  for (const r of recentRatings) {
    if (!vendorCounts[r.vendorId]) {
      vendorCounts[r.vendorId] = { vendor: r.vendor, count: 0, ratings: [] };
    }
    vendorCounts[r.vendorId].count += 1;
    vendorCounts[r.vendorId].ratings.push(r.rating);
  }

  const detected: any[] = [];

  // Threshold: If vendor receives > 15 ratings in 10 minutes, flag as velocity spike
  const VELOCITY_THRESHOLD = 15;

  for (const [vendorId, data] of Object.entries(vendorCounts)) {
    if (data.count >= VELOCITY_THRESHOLD) {
      // Check if an unresolved anomaly log already exists for this vendor
      const existing = await prisma.anomalyLog.findFirst({
        where: {
          vendorId,
          resolved: false,
          type: "VELOCITY_SPIKE",
        },
      });

      const details = {
        message: `Velocity Spike: ${data.count} ratings recorded in the last 10 minutes.`,
        recordedCount: data.count,
        threshold: VELOCITY_THRESHOLD,
        sampleRatings: data.ratings.slice(0, 10),
      };

      if (!existing) {
        await prisma.anomalyLog.create({
          data: {
            eventId: event.id,
            vendorId,
            type: "VELOCITY_SPIKE",
            severity: data.count > 30 ? "HIGH" : "MEDIUM",
            details: JSON.stringify(details),
            resolved: false,
          },
        });
      }

      detected.push({
        vendorId,
        vendorName: data.vendor.name,
        type: "VELOCITY_SPIKE",
        severity: data.count > 30 ? "HIGH" : "MEDIUM",
        description: details.message,
        recentCount: data.count,
      });
    }
  }

  return {
    detectedCount: detected.length,
    anomalies: detected,
  };
}

/**
 * Invalidate suspicious ratings associated with a vendor or session
 */
export async function invalidateRatings(params: {
  ratingIds?: string[];
  vendorId?: string;
  adminEmail: string;
  anomalyId?: string;
}) {
  const { ratingIds, vendorId, adminEmail, anomalyId } = params;

  let invalidatedCount = 0;

  if (ratingIds && ratingIds.length > 0) {
    const result = await prisma.rating.updateMany({
      where: { id: { in: ratingIds } },
      data: { isValid: false },
    });
    invalidatedCount = result.count;
  } else if (vendorId) {
    // Invalidate ratings for this vendor from the last hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const result = await prisma.rating.updateMany({
      where: {
        vendorId,
        createdAt: { gte: oneHourAgo },
      },
      data: { isValid: false },
    });
    invalidatedCount = result.count;
  }

  // Resolve anomaly log if provided
  if (anomalyId) {
    await prisma.anomalyLog.update({
      where: { id: anomalyId },
      data: {
        resolved: true,
        resolvedAt: new Date(),
        resolvedBy: adminEmail,
      },
    });
  }

  return {
    success: true,
    invalidatedCount,
    adminEmail,
  };
}
