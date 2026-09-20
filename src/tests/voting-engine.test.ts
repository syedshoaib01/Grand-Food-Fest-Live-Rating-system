import { describe, it, expect, beforeAll, afterAll } from "vitest";
import prisma from "../lib/prisma";
import {
  getOrCreateAttendeeSession,
  submitRatings,
  getSessionStatus,
} from "../lib/voting-engine";
import { calculateBayesianScore } from "../lib/ranking-engine";

describe("Grand Food Fest — Voting Engine & Business Rules", () => {
  let testEvent: any;
  let testDay1: any;
  let testDay2: any;
  let testFoodVendors: any[] = [];
  let testLifestyleVendor: any;
  let testInactiveVendor: any;

  beforeAll(async () => {
    // Setup test event & entities
    testEvent = await prisma.event.create({
      data: {
        name: "Test Fest Hyd 2026",
        slug: `test-fest-${Date.now()}`,
        startDate: new Date(),
        endDate: new Date(),
        status: "LIVE",
        ratingLimitPerAttendeePerDay: 5,
        minimumRatingsForLeaderboard: 5,
      },
    });

    testDay1 = await prisma.eventDay.create({
      data: {
        eventId: testEvent.id,
        dayNumber: 1,
        date: new Date("2026-10-09"),
        status: "LIVE",
      },
    });

    testDay2 = await prisma.eventDay.create({
      data: {
        eventId: testEvent.id,
        dayNumber: 2,
        date: new Date("2026-10-10"),
        status: "LIVE",
      },
    });

    // Create 7 active food vendors
    for (let i = 1; i <= 7; i++) {
      const v = await prisma.vendor.create({
        data: {
          eventId: testEvent.id,
          name: `Test Food Vendor ${i}`,
          slug: `test-food-vendor-${i}-${Date.now()}`,
          category: "Biryani",
          stallNumber: `T-0${i}`,
          vendorType: "FOOD",
          status: "ACTIVE",
        },
      });
      testFoodVendors.push(v);
    }

    // Create 1 lifestyle vendor
    testLifestyleVendor = await prisma.vendor.create({
      data: {
        eventId: testEvent.id,
        name: "Test Lifestyle Boutique",
        slug: `test-lifestyle-${Date.now()}`,
        category: "Apparel",
        stallNumber: "L-99",
        vendorType: "LIFESTYLE",
        status: "ACTIVE",
      },
    });

    // Create 1 inactive vendor
    testInactiveVendor = await prisma.vendor.create({
      data: {
        eventId: testEvent.id,
        name: "Test Inactive Stall",
        slug: `test-inactive-${Date.now()}`,
        category: "Desserts",
        stallNumber: "T-00",
        vendorType: "FOOD",
        status: "PAUSED",
      },
    });
  });

  afterAll(async () => {
    // Cleanup test data
    if (testEvent) {
      await prisma.rating.deleteMany({ where: { eventId: testEvent.id } });
      await prisma.attendeeSession.deleteMany({ where: { eventId: testEvent.id } });
      await prisma.vendor.deleteMany({ where: { eventId: testEvent.id } });
      await prisma.eventDay.deleteMany({ where: { eventId: testEvent.id } });
      await prisma.event.deleteMany({ where: { id: testEvent.id } });
    }
  });

  it("creates an anonymous session with valid pass format", async () => {
    const session = await getOrCreateAttendeeSession("PASS-TEST01", testDay1.id);
    expect(session).toBeDefined();
    expect(session.passToken).toBe("ATT-••••-ST01");
    expect(session.passHash).toBeDefined();
    expect(session.eventDayId).toBe(testDay1.id);
  });

  it("rejects invalid pass token format", async () => {
    await expect(getOrCreateAttendeeSession("!bad@pass#", testDay1.id)).rejects.toThrow(
      "Invalid pass format"
    );
  });

  it("submits a valid 1-5 star rating and persists it", async () => {
    const session = await getOrCreateAttendeeSession("PASS-TEST02", testDay1.id);
    const result = await submitRatings({
      sessionId: session.id,
      ratings: [{ vendorId: testFoodVendors[0].id, rating: 5 }],
    });

    expect(result.success).toBe(true);
    expect(result.ratingsRecorded).toBe(1);

    const status = await getSessionStatus(session.id);
    expect(status.limits.ratedCountToday).toBe(1);
    expect(status.limits.remainingQuotaToday).toBe(4);
    expect(status.ratedVendorsToday[0].rating).toBe(5);
  });

  it("rejects star rating outside 1-5 range", async () => {
    const session = await getOrCreateAttendeeSession("PASS-TEST03", testDay1.id);
    await expect(
      submitRatings({
        sessionId: session.id,
        ratings: [{ vendorId: testFoodVendors[0].id, rating: 6 }],
      })
    ).rejects.toThrow("Invalid star rating");

    await expect(
      submitRatings({
        sessionId: session.id,
        ratings: [{ vendorId: testFoodVendors[0].id, rating: 0 }],
      })
    ).rejects.toThrow("Invalid star rating");
  });

  it("updates (upserts) rating when attendee rates same vendor again on same day without duplicating", async () => {
    const session = await getOrCreateAttendeeSession("PASS-TEST04", testDay1.id);

    // Initial rating: 4 stars
    await submitRatings({
      sessionId: session.id,
      ratings: [{ vendorId: testFoodVendors[0].id, rating: 4 }],
    });

    let status = await getSessionStatus(session.id);
    expect(status.limits.ratedCountToday).toBe(1);
    expect(status.ratedVendorsToday[0].rating).toBe(4);

    // Resubmit same vendor on same day: 5 stars
    await submitRatings({
      sessionId: session.id,
      ratings: [{ vendorId: testFoodVendors[0].id, rating: 5 }],
    });

    status = await getSessionStatus(session.id);
    // Crucial rule: still 1 vendor rated, rating updated to 5
    expect(status.limits.ratedCountToday).toBe(1);
    expect(status.ratedVendorsToday[0].rating).toBe(5);
  });

  it("strictly enforces maximum 5 vendors per day and rejects sixth vendor", async () => {
    const session = await getOrCreateAttendeeSession("PASS-TEST05", testDay1.id);

    // Rate 5 distinct vendors (max quota)
    await submitRatings({
      sessionId: session.id,
      ratings: [
        { vendorId: testFoodVendors[0].id, rating: 5 },
        { vendorId: testFoodVendors[1].id, rating: 4 },
        { vendorId: testFoodVendors[2].id, rating: 5 },
        { vendorId: testFoodVendors[3].id, rating: 3 },
        { vendorId: testFoodVendors[4].id, rating: 4 },
      ],
    });

    const status = await getSessionStatus(session.id);
    expect(status.limits.ratedCountToday).toBe(5);
    expect(status.limits.remainingQuotaToday).toBe(0);

    // Attempting to rate a 6th vendor MUST be rejected
    await expect(
      submitRatings({
        sessionId: session.id,
        ratings: [{ vendorId: testFoodVendors[5].id, rating: 5 }],
      })
    ).rejects.toThrow(/rating limit/i);

    // But updating one of the existing 5 vendors should still succeed!
    const updateResult = await submitRatings({
      sessionId: session.id,
      ratings: [{ vendorId: testFoodVendors[0].id, rating: 3 }],
    });
    expect(updateResult.success).toBe(true);
  });

  it("allows attendee to rate vendors again on a different event day", async () => {
    // Same pass on Day 2
    const sessionDay2 = await getOrCreateAttendeeSession("PASS-TEST05", testDay2.id);
    expect(sessionDay2.eventDayId).toBe(testDay2.id);

    // Should have fresh quota of 5
    const statusDay2 = await getSessionStatus(sessionDay2.id);
    expect(statusDay2.limits.ratedCountToday).toBe(0);
    expect(statusDay2.limits.remainingQuotaToday).toBe(5);

    // Rating vendor 0 on Day 2 should succeed
    const result = await submitRatings({
      sessionId: sessionDay2.id,
      ratings: [{ vendorId: testFoodVendors[0].id, rating: 5 }],
    });
    expect(result.success).toBe(true);
  });

  it("rejects ratings for lifestyle vendors", async () => {
    const session = await getOrCreateAttendeeSession("PASS-TEST06", testDay1.id);
    await expect(
      submitRatings({
        sessionId: session.id,
        ratings: [{ vendorId: testLifestyleVendor.id, rating: 5 }],
      })
    ).rejects.toThrow(/lifestyle stall/i);
  });

  it("rejects ratings for inactive or paused vendors", async () => {
    const session = await getOrCreateAttendeeSession("PASS-TEST07", testDay1.id);
    await expect(
      submitRatings({
        sessionId: session.id,
        ratings: [{ vendorId: testInactiveVendor.id, rating: 5 }],
      })
    ).rejects.toThrow(/not currently accepting ratings/i);
  });

  it("calculates Bayesian confidence score properly", () => {
    // Vendor A: 2 ratings, average 5.0
    // Global average: 4.2, Threshold: 20
    const scoreA = calculateBayesianScore(2, 5.0, 4.2, 20);
    // ScoreA = (2/22)*5.0 + (20/22)*4.2 = 0.4545 + 3.8181 = 4.2727

    // Vendor B: 100 ratings, average 4.8
    const scoreB = calculateBayesianScore(100, 4.8, 4.2, 20);
    // ScoreB = (100/120)*4.8 + (20/120)*4.2 = 4.0 + 0.7 = 4.7000

    expect(scoreB).toBeGreaterThan(scoreA);
    expect(scoreA).toBeCloseTo(4.27, 1);
    expect(scoreB).toBeCloseTo(4.70, 1);
  });
});
