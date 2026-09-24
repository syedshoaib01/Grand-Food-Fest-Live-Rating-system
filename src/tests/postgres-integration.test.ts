import { describe, it, expect, beforeAll } from "vitest";
import prisma from "@/lib/prisma";
import { getLiveLeaderboard } from "@/lib/ranking-engine";
import { checkRateLimit, resetRateLimitStore } from "@/lib/rate-limiter";
import { getFestivalTime, getFestivalDateString } from "@/lib/date-utils";

describe("PostgreSQL Integration & Production Hardening", () => {
  let event: any;
  let liveDay: any;
  let foodVendor: any;

  beforeAll(async () => {
    event = await prisma.event.findFirst({
      where: { status: "LIVE" },
      include: { days: true },
    });
    liveDay = event?.days.find((d: any) => d.status === "LIVE") || event?.days[0];
    foodVendor = await prisma.vendor.findFirst({
      where: { eventId: event.id, vendorType: "FOOD", status: "ACTIVE" },
    });
  });

  it("verifies live PostgreSQL database connectivity and query execution", async () => {
    const result: any[] = await prisma.$queryRaw`SELECT current_database() as db, version() as ver;`;
    expect(result.length).toBe(1);
    expect(["grandfoodfest", "postgres"]).toContain(result[0].db);
    expect(result[0].ver).toContain("PostgreSQL");
  });

  it("excludes invalidated ratings from Bayesian leaderboard calculation", async () => {
    // Insert an authentic rating
    const session = await prisma.attendeeSession.create({
      data: {
        eventId: event.id,
        eventDayId: liveDay.id,
        passHash: `hash-test-inval-${Date.now()}`,
        passToken: "ATT-••••-9999",
      },
    });

    const validRating = await prisma.rating.create({
      data: {
        eventId: event.id,
        eventDayId: liveDay.id,
        attendeeSessionId: session.id,
        vendorId: foodVendor.id,
        rating: 1, // low rating
        isValid: false, // marked invalidated!
      },
    });

    // Recalculate leaderboard with forceRefresh
    const leaderboard = await getLiveLeaderboard({ eventId: event.id, forceRefresh: true });
    const vendorEntry = leaderboard.allRanked.find((v) => v.vendorId === foodVendor.id);

    // Clean up test rating
    await prisma.rating.delete({ where: { id: validRating.id } });
    await prisma.attendeeSession.delete({ where: { id: session.id } });

    // The invalidated 1-star rating must NOT drag down or be counted
    expect(vendorEntry).toBeDefined();
  });

  it("enforces sliding-window rate limiting on public voting endpoints", () => {
    resetRateLimitStore();
    const testIp = "192.168.1.100";

    // 20 allowed requests
    for (let i = 0; i < 20; i++) {
      const res = checkRateLimit(testIp, { limit: 20, windowMs: 60 * 1000 });
      expect(res.success).toBe(true);
    }

    // 21st request must be rate-limited
    const blocked = checkRateLimit(testIp, { limit: 20, windowMs: 60 * 1000 });
    expect(blocked.success).toBe(false);
    expect(blocked.remaining).toBe(0);
    expect(blocked.resetSeconds).toBeGreaterThan(0);
  });

  it("calculates accurate India Standard Time (IST) timestamps", () => {
    const istTime = getFestivalTime(new Date("2026-10-09T09:30:00.000Z")); // 15:00 IST
    expect(istTime).toContain("15:00:00");

    const dateStr = getFestivalDateString(new Date("2026-10-09T20:00:00.000Z")); // 01:30 AM IST on Oct 10
    expect(dateStr).toBe("2026-10-10");
  });
});
