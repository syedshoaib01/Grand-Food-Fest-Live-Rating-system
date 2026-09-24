import { describe, it, expect, beforeAll, afterAll } from "vitest";
import prisma from "@/lib/prisma";
import { submitRatings, getOrCreateAttendeeSession } from "@/lib/voting-engine";
import { getLiveLeaderboard } from "@/lib/ranking-engine";

describe("Lightweight Load & Concurrency Simulation (PostgreSQL)", () => {
  let event: any;
  let liveDay: any;
  let foodVendors: any[] = [];

  beforeAll(async () => {
    event = await prisma.event.create({
      data: {
        name: "Load Simulation Fest",
        slug: `load-fest-${Date.now()}`,
        startDate: new Date(),
        endDate: new Date(),
        status: "LIVE",
        ratingLimitPerAttendeePerDay: 5,
        minimumRatingsForLeaderboard: 5,
      },
    });

    liveDay = await prisma.eventDay.create({
      data: {
        eventId: event.id,
        dayNumber: 1,
        date: new Date(),
        status: "LIVE",
      },
    });

    for (let i = 1; i <= 20; i++) {
      const v = await prisma.vendor.create({
        data: {
          eventId: event.id,
          name: `Load Vendor ${i}`,
          slug: `load-vendor-${Date.now()}-${i}`,
          category: "Biryani",
          stallNumber: `L-${i}`,
          vendorType: "FOOD",
          status: "ACTIVE",
        },
      });
      foodVendors.push(v);
    }
  });

  afterAll(async () => {
    if (event) {
      await prisma.rating.deleteMany({ where: { eventDay: { eventId: event.id } } });
      await prisma.attendeeSession.deleteMany({ where: { eventId: event.id } });
      await prisma.vendor.deleteMany({ where: { eventId: event.id } });
      await prisma.eventDay.deleteMany({ where: { eventId: event.id } });
      await prisma.event.delete({ where: { id: event.id } });
    }
  });

  it("simulates 200 concurrent rating operations across multiple attendees without quota corruption", async () => {
    const numAttendees = 40;
    const sessionIds: string[] = [];

    // Pre-create attendees
    for (let i = 0; i < numAttendees; i++) {
      const session = await getOrCreateAttendeeSession(`PASS-LOAD-${i.toString().padStart(4, "0")}`, liveDay.id);
      sessionIds.push(session.id);
    }

    // Build 200 concurrent operations:
    // Each attendee attempts to submit ratings for random vendors, some exceeding 5
    const tasks: Promise<any>[] = [];
    const startTime = performance.now();

    for (let i = 0; i < sessionIds.length; i++) {
      const sessionId = sessionIds[i];

      // Attendee submits 3 vendors
      tasks.push(
        submitRatings({
          sessionId,
          ratings: [
            { vendorId: foodVendors[0].id, rating: 5 },
            { vendorId: foodVendors[1].id, rating: 4 },
            { vendorId: foodVendors[2].id, rating: 5 },
          ],
        })
      );

      // Concurrent second submission: 2 more vendors (Total = 5, should succeed)
      tasks.push(
        submitRatings({
          sessionId,
          ratings: [
            { vendorId: foodVendors[3].id, rating: 4 },
            { vendorId: foodVendors[4].id, rating: 3 },
          ],
        })
      );

      // Concurrent third submission: 2 more vendors (Total would be 7, MUST be rejected by quota)
      tasks.push(
        submitRatings({
          sessionId,
          ratings: [
            { vendorId: foodVendors[5].id, rating: 5 },
            { vendorId: foodVendors[6].id, rating: 5 },
          ],
        })
      );

      // Concurrent update of an existing vendor (should succeed without consuming quota)
      tasks.push(
        submitRatings({
          sessionId,
          ratings: [{ vendorId: foodVendors[0].id, rating: 4 }],
        })
      );
    }

    // Await all concurrent tasks
    const results = await Promise.allSettled(tasks);
    const durationMs = Math.round(performance.now() - startTime);

    const succeeded = results.filter((r) => r.status === "fulfilled").length;
    const rejected = results.filter((r) => r.status === "rejected").length;

    // Verify results
    expect(succeeded).toBeGreaterThan(0);
    expect(rejected).toBeGreaterThan(0);

    // Verify database quota invariant across ALL attendees
    const allAttendeeRatings = await prisma.rating.findMany({
      where: {
        attendeeSessionId: { in: sessionIds },
        eventDayId: liveDay.id,
      },
    });

    const attendeeCountMap: Record<string, Set<string>> = {};
    for (const r of allAttendeeRatings) {
      if (!attendeeCountMap[r.attendeeSessionId]) {
        attendeeCountMap[r.attendeeSessionId] = new Set();
      }
      attendeeCountMap[r.attendeeSessionId].add(r.vendorId);
    }

    // Assert: NEVER does any attendee have more than 5 distinct rated vendors!
    for (const [, vendors] of Object.entries(attendeeCountMap)) {
      expect(vendors.size).toBeLessThanOrEqual(5);
    }

    // Benchmark Leaderboard execution time under load
    const benchStart = performance.now();
    const leaderboard = await getLiveLeaderboard({ eventId: event.id, forceRefresh: true });
    const benchDurationMs = Math.round(performance.now() - benchStart);

    expect(leaderboard.top10.length).toBeGreaterThan(0);
    expect(benchDurationMs).toBeLessThan(1500); // SQL aggregation over network must complete under 1.5s
  }, 30000);
});
