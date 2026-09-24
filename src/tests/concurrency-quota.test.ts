import { describe, it, expect, beforeAll } from "vitest";
import prisma from "@/lib/prisma";
import { submitRatings, getOrCreateAttendeeSession } from "@/lib/voting-engine";

describe("Voting Concurrency & Quota Safety (PostgreSQL Transactional Locking)", () => {
  let event: any;
  let liveDay: any;
  let foodVendors: any[];

  beforeAll(async () => {
    // Fetch live event and day
    event = await prisma.event.findFirst({
      where: { status: "LIVE" },
      include: { days: true },
    });
    if (!event) {
      throw new Error("Live event required for concurrency test.");
    }

    liveDay = event.days.find((d: any) => d.status === "LIVE") || event.days[0];

    // Pick 8 active food vendors
    foodVendors = await prisma.vendor.findMany({
      where: {
        eventId: event.id,
        vendorType: "FOOD",
        status: "ACTIVE",
      },
      take: 8,
    });

    expect(foodVendors.length).toBeGreaterThanOrEqual(8);
  });

  it("strictly enforces max 5 vendors under simultaneous parallel requests", async () => {
    // Generate a fresh unique attendee pass
    const pass = `PASS-CONC-${Date.now().toString().slice(-6)}`;
    const session = await getOrCreateAttendeeSession(pass, liveDay.id);

    // Request A tries to rate 4 vendors (vendors 0, 1, 2, 3)
    const requestA = submitRatings({
      sessionId: session.id,
      ratings: [
        { vendorId: foodVendors[0].id, rating: 5 },
        { vendorId: foodVendors[1].id, rating: 4 },
        { vendorId: foodVendors[2].id, rating: 5 },
        { vendorId: foodVendors[3].id, rating: 4 },
      ],
    });

    // Request B tries to rate 2 other vendors (vendors 4, 5) -> Total would be 6 if both succeeded
    const requestB = submitRatings({
      sessionId: session.id,
      ratings: [
        { vendorId: foodVendors[4].id, rating: 5 },
        { vendorId: foodVendors[5].id, rating: 3 },
      ],
    });

    // Request C tries to rate vendor 6 -> Total would be 7
    const requestC = submitRatings({
      sessionId: session.id,
      ratings: [{ vendorId: foodVendors[6].id, rating: 5 }],
    });

    // Fire all three simultaneously
    const results = await Promise.allSettled([requestA, requestB, requestC]);

    // Check how many succeeded vs rejected
    const succeeded = results.filter((r) => r.status === "fulfilled");
    const rejected = results.filter((r) => r.status === "rejected");

    // At least one must succeed, and at least one must be rejected due to quota limit
    expect(succeeded.length).toBeGreaterThanOrEqual(1);
    expect(rejected.length).toBeGreaterThanOrEqual(1);

    // Query the database directly to verify the hard invariant:
    const dbRatings = await prisma.rating.findMany({
      where: {
        attendeeSessionId: session.id,
        eventDayId: liveDay.id,
        isValid: true,
      },
    });

    const uniqueVendors = new Set(dbRatings.map((r) => r.vendorId));
    // CRITICAL INVARIANT: NEVER > 5 distinct vendors
    expect(uniqueVendors.size).toBeLessThanOrEqual(5);
  });

  it("handles simultaneous same-vendor updates without duplicating records", async () => {
    const pass = `PASS-SAME-${Date.now().toString().slice(-6)}`;
    const session = await getOrCreateAttendeeSession(pass, liveDay.id);
    const targetVendor = foodVendors[0];

    // Fire 5 simultaneous updates for the SAME vendor with different star values
    const parallelUpdates = [1, 2, 3, 4, 5].map((star) =>
      submitRatings({
        sessionId: session.id,
        ratings: [{ vendorId: targetVendor.id, rating: star }],
      })
    );

    await Promise.all(parallelUpdates);

    // Verify exactly ONE rating row exists for this vendor and attendee on this day
    const ratings = await prisma.rating.findMany({
      where: {
        attendeeSessionId: session.id,
        vendorId: targetVendor.id,
        eventDayId: liveDay.id,
      },
    });

    expect(ratings.length).toBe(1);
    // Rating should be an integer between 1 and 5
    expect(ratings[0].rating).toBeGreaterThanOrEqual(1);
    expect(ratings[0].rating).toBeLessThanOrEqual(5);
  });

  it("correctly handles concurrent idempotency replays (double-taps)", async () => {
    const pass = `PASS-IDEMP-${Date.now().toString().slice(-6)}`;
    const session = await getOrCreateAttendeeSession(pass, liveDay.id);
    const idempotencyKey = `idem-${Date.now()}-${Math.random()}`;

    const submissionParams = {
      sessionId: session.id,
      idempotencyKey,
      ratings: [
        { vendorId: foodVendors[0].id, rating: 5 },
        { vendorId: foodVendors[1].id, rating: 5 },
      ],
    };

    // Simulate 4 concurrent network retries of the exact same submission
    const parallelSubmissions = [
      submitRatings(submissionParams),
      submitRatings(submissionParams),
      submitRatings(submissionParams),
      submitRatings(submissionParams),
    ];

    const results = await Promise.all(parallelSubmissions);

    // All should succeed without error
    results.forEach((res) => {
      expect(res.success).toBe(true);
    });

    // Total rated count must be exactly 2, not 8
    const ratings = await prisma.rating.findMany({
      where: {
        attendeeSessionId: session.id,
        eventDayId: liveDay.id,
      },
    });

    expect(ratings.length).toBe(2);
  });
});
