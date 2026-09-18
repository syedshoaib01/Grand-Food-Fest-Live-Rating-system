import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { NextRequest } from "next/server";
import {
  hashPassword,
  verifyPassword,
  requireAdmin,
  anonymizePassToken,
  signSessionPayload,
} from "../lib/auth";
import { calculateBayesianScore, getLiveLeaderboard, createRankSnapshot } from "../lib/ranking-engine";
import prisma from "../lib/prisma";
import { submitRatings, getOrCreateAttendeeSession } from "../lib/voting-engine";

describe("Grand Food Fest — Security Hardening & Truthful Analytics Tests", () => {
  let testEvent: any;
  let closedDay: any;
  let foodVendor: any;

  beforeAll(async () => {
    testEvent = await prisma.event.create({
      data: {
        name: "Security Test Fest 2026",
        slug: `security-fest-${Date.now()}`,
        startDate: new Date(),
        endDate: new Date(),
        status: "LIVE",
        ratingLimitPerAttendeePerDay: 5,
        minimumRatingsForLeaderboard: 20,
      },
    });

    closedDay = await prisma.eventDay.create({
      data: {
        eventId: testEvent.id,
        dayNumber: 99,
        date: new Date("2026-10-31"),
        status: "CLOSED",
      },
    });

    foodVendor = await prisma.vendor.create({
      data: {
        eventId: testEvent.id,
        name: "Security Test Biryani",
        slug: `sec-biryani-${Date.now()}`,
        category: "Biryani",
        stallNumber: "S-01",
        vendorType: "FOOD",
        status: "ACTIVE",
      },
    });
  });

  afterAll(async () => {
    if (testEvent) {
      await prisma.rankSnapshot.deleteMany({ where: { eventId: testEvent.id } });
      await prisma.rating.deleteMany({ where: { eventId: testEvent.id } });
      await prisma.attendeeSession.deleteMany({ where: { eventId: testEvent.id } });
      await prisma.vendor.deleteMany({ where: { eventId: testEvent.id } });
      await prisma.eventDay.deleteMany({ where: { eventId: testEvent.id } });
      await prisma.event.deleteMany({ where: { id: testEvent.id } });
    }
  });

  describe("1. Password Hashing & Verification (Argon2/PBKDF2 Salted)", () => {
    it("hashes password with a random unique salt each time", () => {
      const hash1 = hashPassword("secretFest2026");
      const hash2 = hashPassword("secretFest2026");

      expect(hash1).not.toBe(hash2); // salts differ
      expect(hash1).toContain(":"); // contains salt:hash
      expect(hash2).toContain(":");
    });

    it("verifies correct password against stored salt:hash", () => {
      const stored = hashPassword("CorrectAdminPass!");
      expect(verifyPassword("CorrectAdminPass!", stored)).toBe(true);
      expect(verifyPassword("WrongPass123", stored)).toBe(false);
      expect(verifyPassword("", stored)).toBe(false);
    });
  });

  describe("2. requireAdmin() Server-Side API Protection", () => {
    it("rejects unauthenticated requests with 401", async () => {
      const req = new NextRequest("http://localhost:3000/api/admin/analytics");
      const auth = await requireAdmin(req);

      expect(auth.authorized).toBe(false);
      if (!auth.authorized) {
        expect(auth.response.status).toBe(401);
      }
    });

    it("rejects invalid or forged admin cookie with 401", async () => {
      const req = new NextRequest("http://localhost:3000/api/admin/settings", {
        headers: {
          cookie: "gff_admin=fake.forged.signature",
        },
      });
      const auth = await requireAdmin(req);

      expect(auth.authorized).toBe(false);
      if (!auth.authorized) {
        expect(auth.response.status).toBe(401);
      }
    });

    it("rejects non-admin role token with 403", async () => {
      const attendeeToken = signSessionPayload({
        sessionId: "sess-999",
        role: "ATTENDEE",
      });

      const req = new NextRequest("http://localhost:3000/api/admin/ratings", {
        headers: {
          cookie: `gff_admin=${attendeeToken}`,
        },
      });
      const auth = await requireAdmin(req);

      expect(auth.authorized).toBe(false);
      if (!auth.authorized) {
        expect(auth.response.status).toBe(403);
      }
    });

    it("authorizes valid admin token with 200", async () => {
      const adminToken = signSessionPayload({
        email: "admin@grandfoodfest.com",
        role: "ADMIN",
        timestamp: Date.now(),
      });

      const req = new NextRequest("http://localhost:3000/api/admin/analytics", {
        headers: {
          cookie: `gff_admin=${adminToken}`,
        },
      });
      const auth = await requireAdmin(req);

      expect(auth.authorized).toBe(true);
      if (auth.authorized) {
        expect(auth.user.role).toBe("ADMIN");
        expect(auth.user.email).toBe("admin@grandfoodfest.com");
      }
    });
  });

  describe("3. Attendee Pass Privacy & Anonymization", () => {
    it("anonymizes pass tokens into ATT-••••-XXXX format", () => {
      expect(anonymizePassToken("PASS-000123")).toBe("ATT-••••-0123");
      expect(anonymizePassToken("PASS-884931")).toBe("ATT-••••-4931");
      expect(anonymizePassToken("DEV-99")).toBe("ATT-••••-V-99");
    });
  });

  describe("4. Voting Lifecycle & Closed State Enforcement", () => {
    it("strictly rejects votes when event day is closed", async () => {
      const session = await getOrCreateAttendeeSession("PASS-CLOSED-TEST", closedDay.id);

      await expect(
        submitRatings({
          sessionId: session.id,
          ratings: [{ vendorId: foodVendor.id, rating: 5 }],
        })
      ).rejects.toThrow(/closed/i);
    });
  });

  describe("5. Truthful Rank Movement & Historical Snapshots", () => {
    it("accurately records and reflects historical rank movement from RankSnapshot", async () => {
      // 1. Create a snapshot where foodVendor is at rank 3
      const pastTime = new Date(Date.now() - 30 * 60 * 1000);
      await prisma.rankSnapshot.create({
        data: {
          eventId: testEvent.id,
          vendorId: foodVendor.id,
          rank: 3,
          score: 4.5,
          ratingsCount: 25,
          snapshotAt: pastTime,
        },
      });

      // 2. Fetch leaderboard for this event
      const leaderboard = await getLiveLeaderboard({ eventId: testEvent.id });
      const found = leaderboard.allRanked.find((v) => v.vendorId === foodVendor.id);

      expect(found).toBeDefined();
      if (found) {
        // If current rank is 1 and previous was 3, climbed: prev - current = 3 - 1 = +2 (↑ 2)
        const expectedDiff = 3 - found.rank;
        expect(found.rankChange).toBe(expectedDiff);
        if (expectedDiff > 0) {
          expect(found.trendFormatted).toBe(`↑ ${expectedDiff}`);
        } else if (expectedDiff < 0) {
          expect(found.trendFormatted).toBe(`↓ ${Math.abs(expectedDiff)}`);
        } else {
          expect(found.trendFormatted).toBe("—");
        }
      }
    });

    it("new eligible vendor without previous snapshot is labeled NEW", async () => {
      // Create a new vendor without prior snapshot
      const newVendor = await prisma.vendor.create({
        data: {
          eventId: testEvent.id,
          name: "Fresh Entrant Vendor",
          slug: `fresh-${Date.now()}`,
          category: "Dessert",
          stallNumber: "F-01",
          vendorType: "FOOD",
          status: "ACTIVE",
        },
      });

      // Add 20 ratings to make it eligible
      for (let i = 0; i < 20; i++) {
        const session = await prisma.attendeeSession.create({
          data: {
            eventId: testEvent.id,
            eventDayId: closedDay.id,
            passHash: `hash-${Date.now()}-${i}`,
            passToken: `PASS-NEW-${i}`,
          },
        });
        await prisma.rating.create({
          data: {
            eventId: testEvent.id,
            eventDayId: closedDay.id,
            attendeeSessionId: session.id,
            vendorId: newVendor.id,
            rating: 5,
            isValid: true,
          },
        });
      }

      const leaderboard = await getLiveLeaderboard({ eventId: testEvent.id });
      const found = leaderboard.allRanked.find((v) => v.vendorId === newVendor.id);

      expect(found).toBeDefined();
      expect(found?.isEligibleForLeaderboard).toBe(true);
      expect(found?.trendFormatted).toBe("NEW");
    });
  });
});
