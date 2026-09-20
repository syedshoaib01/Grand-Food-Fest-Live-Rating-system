import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { NextRequest } from "next/server";
import {
  signSessionPayload,
  verifySessionPayload,
  requireAdmin,
  anonymizePassToken,
  ADMIN_SESSION_MAX_AGE_MS,
  ATTENDEE_SESSION_MAX_AGE_MS,
} from "../lib/auth";
import prisma from "../lib/prisma";
import { getOrCreateAttendeeSession, submitRatings } from "../lib/voting-engine";
import { getTrendingVendors } from "../lib/trending-engine";
import { GET as healthHandler } from "../app/api/health/route";
import { POST as anomalyHandler } from "../app/api/admin/anomalies/route";

describe("Grand Food Fest — Audit & P0/P1 Improvements Tests", () => {
  let testEvent: any;
  let testDay: any;
  let testVendors: any[] = [];
  let testAdmin: any;

  beforeAll(async () => {
    testEvent = await prisma.event.create({
      data: {
        name: "Audit Improvements Test Fest",
        slug: `audit-fest-${Date.now()}`,
        startDate: new Date(),
        endDate: new Date(),
        status: "LIVE",
        ratingLimitPerAttendeePerDay: 5,
        minimumRatingsForLeaderboard: 5,
      },
    });

    testDay = await prisma.eventDay.create({
      data: {
        eventId: testEvent.id,
        dayNumber: 1,
        date: new Date(),
        status: "LIVE",
      },
    });

    for (let i = 1; i <= 6; i++) {
      const v = await prisma.vendor.create({
        data: {
          eventId: testEvent.id,
          name: `Audit Food Vendor ${i}`,
          slug: `audit-vendor-${Date.now()}-${i}`,
          category: "Street Food",
          stallNumber: `A-${i}`,
          vendorType: "FOOD",
          status: "ACTIVE",
        },
      });
      testVendors.push(v);
    }

    testAdmin = await prisma.adminUser.create({
      data: {
        email: `audit-admin-${Date.now()}@grandfoodfest.com`,
        passwordHash: "salt:hash",
        name: "Audit Admin",
        role: "ADMIN",
      },
    });
  });

  afterAll(async () => {
    if (testEvent) {
      await prisma.anomalyLog.deleteMany({ where: { eventId: testEvent.id } });
      await prisma.rating.deleteMany({ where: { eventId: testEvent.id } });
      await prisma.attendeeSession.deleteMany({ where: { eventId: testEvent.id } });
      await prisma.vendor.deleteMany({ where: { eventId: testEvent.id } });
      await prisma.eventDay.deleteMany({ where: { eventId: testEvent.id } });
      await prisma.event.deleteMany({ where: { id: testEvent.id } });
    }
    if (testAdmin) {
      await prisma.adminUser.deleteMany({ where: { id: testAdmin.id } });
    }
  });

  describe("SEC-003: Server-side Token Expiration Validation", () => {
    it("accepts freshly created admin session token", () => {
      const token = signSessionPayload({ email: "admin@test.com", role: "ADMIN" });
      const verified = verifySessionPayload(token);
      expect(verified).not.toBeNull();
      expect(verified?.role).toBe("ADMIN");
    });

    it("rejects expired admin token exceeding 24 hour TTL", () => {
      // 25 hours in the past
      const pastTime = Date.now() - (25 * 60 * 60 * 1000);
      const expiredToken = signSessionPayload({
        email: "admin@test.com",
        role: "ADMIN",
        timestamp: pastTime,
      });

      const verified = verifySessionPayload(expiredToken);
      expect(verified).toBeNull();
    });

    it("rejects expired attendee token exceeding 72 hour TTL", () => {
      // 75 hours in the past
      const pastTime = Date.now() - (75 * 60 * 60 * 1000);
      const expiredToken = signSessionPayload({
        sessionId: "sess-abc",
        role: "ATTENDEE",
        timestamp: pastTime,
      });

      const verified = verifySessionPayload(expiredToken);
      expect(verified).toBeNull();
    });

    it("rejects token with excessive future timestamp clock skew (>5 min)", () => {
      const futureTime = Date.now() + (10 * 60 * 1000);
      const skewToken = signSessionPayload({
        email: "admin@test.com",
        role: "ADMIN",
        timestamp: futureTime,
      });

      const verified = verifySessionPayload(skewToken);
      expect(verified).toBeNull();
    });

    it("requireAdmin gate rejects expired admin session cookie", async () => {
      const expiredToken = signSessionPayload({
        email: "admin@test.com",
        role: "ADMIN",
        timestamp: Date.now() - (26 * 60 * 60 * 1000),
      });

      const req = new NextRequest("http://localhost:3000/api/admin/ratings", {
        headers: {
          cookie: `gff_admin=${expiredToken}`,
        },
      });

      const gate = await requireAdmin(req);
      expect(gate.authorized).toBe(false);
      if (!gate.authorized) {
        expect(gate.response.status).toBe(401);
      }
    });
  });

  describe("SEC-004: Pass Token Masking in Database and Anonymization", () => {
    it("stores only anonymized passToken in AttendeeSession record", async () => {
      const rawPass = "PASS-998877";
      const session = await getOrCreateAttendeeSession(rawPass, testDay.id);

      expect(session.passToken).toBe("ATT-••••-8877");
      expect(session.passToken).not.toContain("PASS-998877");

      // Verify directly from the database
      const dbRecord = await prisma.attendeeSession.findUnique({
        where: { id: session.id },
      });

      expect(dbRecord).not.toBeNull();
      expect(dbRecord?.passToken).toBe("ATT-••••-8877");
      expect(dbRecord?.passToken).not.toBe(rawPass);
    });

    it("anonymizePassToken is idempotent and formats consistently", () => {
      expect(anonymizePassToken("PASS-000123")).toBe("ATT-••••-0123");
      expect(anonymizePassToken("ATT-••••-0123")).toBe("ATT-••••-0123");
      expect(anonymizePassToken(null)).toBe("ATT-••••-ANON");
      expect(anonymizePassToken("AB")).toBe("ATT-••••");
    });
  });

  describe("API-001: Admin Anomaly Resolution Uses Authenticated Admin Email", () => {
    it("records authenticated admin email as resolvedBy in AnomalyLog", async () => {
      const anomaly = await prisma.anomalyLog.create({
        data: {
          eventId: testEvent.id,
          vendorId: testVendors[0].id,
          type: "VELOCITY_SPIKE",
          severity: "HIGH",
          details: JSON.stringify({ reason: "Unusual vote influx" }),
          resolved: false,
        },
      });

      const adminToken = signSessionPayload({
        email: testAdmin.email,
        role: "ADMIN",
        timestamp: Date.now(),
      });

      const req = new NextRequest("http://localhost:3000/api/admin/anomalies", {
        method: "POST",
        headers: {
          cookie: `gff_admin=${adminToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          anomalyId: anomaly.id,
          action: "DISMISS_ANOMALY",
        }),
      });

      const res = await anomalyHandler(req);
      expect(res.status).toBe(200);

      const updated = await prisma.anomalyLog.findUnique({
        where: { id: anomaly.id },
      });

      expect(updated?.resolved).toBe(true);
      expect(updated?.resolvedBy).toBe(`${testAdmin.email} (Dismissed as benign)`);
      expect(updated?.resolvedBy).not.toContain("admin@grandfoodfest.com");
    });
  });

  describe("TREND-001: Truthful Trending Fallback Velocity Labeling", () => {
    it("labels fallback historical ratings as recent festival reviews rather than rolling window", async () => {
      const trending = await getTrendingVendors({ windowMinutes: 30, limit: 3 });
      expect(Array.isArray(trending)).toBe(true);

      for (const item of trending) {
        expect(item.velocityLabel).toBeDefined();
        // Fallback or window should have consistent truthful structure
        if (item.velocityLabel.includes("recent ratings")) {
          expect(item.surgeReason).toContain("recent festival reviews");
          expect(item.velocityLabel).not.toContain("in 30 min");
        }
      }
    });
  });

  describe("OBS-002: System Health Check Endpoint", () => {
    it("reports healthy database connectivity and festival status", async () => {
      const res = await healthHandler();
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.status).toBe("ok");
      expect(data.database.status).toBe("connected");
      expect(typeof data.database.latencyMs).toBe("number");
      expect(data.database.latencyMs).toBeGreaterThanOrEqual(0);
      expect(data.timestamp).toBeDefined();
    });
  });

  describe("VOTE-001: Quota Transaction Serialization", () => {
    it("serializes concurrent ratings submissions and prevents exceeding 5-vendor limit", async () => {
      const concurrentPass = "PASS-RACE-01";
      const session = await getOrCreateAttendeeSession(concurrentPass, testDay.id);

      // Submit 3 vendors first
      await submitRatings({
        sessionId: session.id,
        eventDayId: testDay.id,
        ratings: [
          { vendorId: testVendors[0].id, rating: 5 },
          { vendorId: testVendors[1].id, rating: 4 },
          { vendorId: testVendors[2].id, rating: 5 },
        ],
      });

      // Now attempt 2 parallel submissions:
      // Request A tries to add vendors 3 and 4 (total 5: within quota)
      // Request B tries to add vendors 4 and 5 (total 6: exceeds quota)
      const subA = submitRatings({
        sessionId: session.id,
        eventDayId: testDay.id,
        ratings: [
          { vendorId: testVendors[3].id, rating: 5 },
          { vendorId: testVendors[4].id, rating: 4 },
        ],
      });

      const subB = submitRatings({
        sessionId: session.id,
        eventDayId: testDay.id,
        ratings: [
          { vendorId: testVendors[4].id, rating: 4 },
          { vendorId: testVendors[5].id, rating: 3 },
        ],
      });

      const results = await Promise.allSettled([subA, subB]);

      // Exactly one should succeed (reaching 5 vendors) and the other should be rejected for exceeding quota
      const fulfilled = results.filter((r) => r.status === "fulfilled");
      const rejected = results.filter((r) => r.status === "rejected");

      expect(fulfilled.length).toBe(1);
      expect(rejected.length).toBe(1);

      if (rejected[0].status === "rejected") {
        expect(rejected[0].reason.message).toContain("rating limit");
      }
    });
  });
});
