import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { NextRequest } from "next/server";
import prisma from "../lib/prisma";
import { POST as verifyHandler } from "../app/api/voting/verify/route";
import { POST as ratingsHandler } from "../app/api/voting/ratings/route";
import { verifySessionPayload } from "../lib/auth";

describe("Attendee Session Identity Decoupling & Quota Tests", () => {
  let testEvent: any;
  let testDay1: any;
  let testDay2: any;
  let testVendors: any[] = [];

  beforeAll(async () => {
    testEvent = await prisma.event.create({
      data: {
        name: "Identity Decoupling Test Fest",
        slug: `identity-fest-${Date.now()}`,
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
        date: new Date(),
        status: "LIVE",
      },
    });

    testDay2 = await prisma.eventDay.create({
      data: {
        eventId: testEvent.id,
        dayNumber: 2,
        date: new Date(Date.now() + 86400000),
        status: "LIVE",
      },
    });

    for (let i = 1; i <= 6; i++) {
      const v = await prisma.vendor.create({
        data: {
          eventId: testEvent.id,
          name: `Identity Food Vendor ${i}`,
          slug: `identity-vendor-${Date.now()}-${i}`,
          category: "Biryani",
          stallNumber: `ID-${i}`,
          vendorType: "FOOD",
          status: "ACTIVE",
        },
      });
      testVendors.push(v);
    }
  });

  afterAll(async () => {
    // Clean up test data created in this test suite
    if (testEvent) {
      await prisma.rating.deleteMany({
        where: { eventDay: { eventId: testEvent.id } },
      });
      await prisma.attendeeSession.deleteMany({
        where: { eventId: testEvent.id },
      });
      await prisma.vendor.deleteMany({
        where: { eventId: testEvent.id },
      });
      await prisma.eventDay.deleteMany({
        where: { eventId: testEvent.id },
      });
      await prisma.event.delete({
        where: { id: testEvent.id },
      });
    }
  });

  it("A. Two users with the same name receive distinct sessions and independent quotas", async () => {
    // User A enters "Rahul"
    const reqA = new NextRequest("http://localhost:3000/api/voting/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Rahul", eventDayId: testDay1.id }),
    });
    const resA = await verifyHandler(reqA);
    const dataA = await resA.json();
    const cookieA = resA.cookies.get("gff_session")?.value;

    expect(resA.status).toBe(200);
    expect(dataA.authenticated).toBe(true);
    expect(dataA.attendeeName).toBe("Rahul");
    expect(cookieA).toBeDefined();

    // User B enters "Rahul" from another device (no cookie)
    const reqB = new NextRequest("http://localhost:3000/api/voting/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Rahul", eventDayId: testDay1.id }),
    });
    const resB = await verifyHandler(reqB);
    const dataB = await resB.json();
    const cookieB = resB.cookies.get("gff_session")?.value;

    expect(resB.status).toBe(200);
    expect(dataB.authenticated).toBe(true);
    expect(dataB.attendeeName).toBe("Rahul");
    expect(cookieB).toBeDefined();

    // Assert: Different session identities and different database records
    expect(dataA.session.id).not.toBe(dataB.session.id);
    expect(cookieA).not.toBe(cookieB);

    const sessionCount = await prisma.attendeeSession.count({
      where: { id: { in: [dataA.session.id, dataB.session.id] } },
    });
    expect(sessionCount).toBe(2);

    // User A submits 5 ratings to exhaust quota
    const ratingsReqA = new NextRequest("http://localhost:3000/api/voting/ratings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: `gff_session=${cookieA}`,
      },
      body: JSON.stringify({
        ratings: testVendors.slice(0, 5).map((v) => ({ vendorId: v.id, rating: 5 })),
        eventDayId: testDay1.id,
      }),
    });
    const ratingsResA = await ratingsHandler(ratingsReqA);
    const ratingsDataA = await ratingsResA.json();
    expect(ratingsResA.status).toBe(200);
    expect(ratingsDataA.updatedStatus.limits.remainingQuotaToday).toBe(0);

    // User A attempts a 6th vendor: must be rejected with QUOTA_EXCEEDED
    const ratingsReqA6 = new NextRequest("http://localhost:3000/api/voting/ratings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: `gff_session=${cookieA}`,
      },
      body: JSON.stringify({
        ratings: [{ vendorId: testVendors[5].id, rating: 5 }],
        eventDayId: testDay1.id,
      }),
    });
    const ratingsResA6 = await ratingsHandler(ratingsReqA6);
    expect(ratingsResA6.status).toBe(400);

    // User B still has their full independent 5-vendor quota!
    const ratingsReqB = new NextRequest("http://localhost:3000/api/voting/ratings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: `gff_session=${cookieB}`,
      },
      body: JSON.stringify({
        ratings: [{ vendorId: testVendors[0].id, rating: 4 }],
        eventDayId: testDay1.id,
      }),
    });
    const ratingsResB = await ratingsHandler(ratingsReqB);
    const ratingsDataB = await ratingsResB.json();
    expect(ratingsResB.status).toBe(200);
    expect(ratingsDataB.updatedStatus.limits.remainingQuotaToday).toBe(4);
    expect(ratingsDataB.updatedStatus.limits.ratedCountToday).toBe(1);
  });

  it("B. Same user with existing valid cookie reuses existing session without duplicate creation", async () => {
    // 1. Initial check-in
    const req1 = new NextRequest("http://localhost:3000/api/voting/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "SameUserTest", eventDayId: testDay1.id }),
    });
    const res1 = await verifyHandler(req1);
    const data1 = await res1.json();
    const cookie1 = res1.cookies.get("gff_session")?.value;
    const initialSessionId = data1.session.id;

    // Rate 1 vendor
    await ratingsHandler(
      new NextRequest("http://localhost:3000/api/voting/ratings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `gff_session=${cookie1}`,
        },
        body: JSON.stringify({
          ratings: [{ vendorId: testVendors[1].id, rating: 5 }],
          eventDayId: testDay1.id,
        }),
      })
    );

    // 2. User returns and enters their name again with valid cookie attached
    const req2 = new NextRequest("http://localhost:3000/api/voting/verify", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: `gff_session=${cookie1}`,
      },
      body: JSON.stringify({ name: "SameUserTest Updated", eventDayId: testDay1.id }),
    });
    const res2 = await verifyHandler(req2);
    const data2 = await res2.json();

    expect(res2.status).toBe(200);
    expect(data2.session.id).toBe(initialSessionId);
    expect(data2.attendeeName).toBe("SameUserTest Updated");
    // Limits preserved!
    expect(data2.limits.ratedCountToday).toBe(1);
    expect(data2.limits.remainingQuotaToday).toBe(4);
  });

  it("C. Same-day re-rating updates existing rating without consuming extra quota", async () => {
    const req = new NextRequest("http://localhost:3000/api/voting/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "UpsertUser", eventDayId: testDay1.id }),
    });
    const res = await verifyHandler(req);
    const cookie = res.cookies.get("gff_session")?.value;

    // Initial rating: 5 stars
    const rate1 = await ratingsHandler(
      new NextRequest("http://localhost:3000/api/voting/ratings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `gff_session=${cookie}`,
        },
        body: JSON.stringify({
          ratings: [{ vendorId: testVendors[2].id, rating: 5 }],
          eventDayId: testDay1.id,
        }),
      })
    );
    const data1 = await rate1.json();
    expect(data1.updatedStatus.limits.remainingQuotaToday).toBe(4);

    // Same-day update: 3 stars for same vendor
    const rate2 = await ratingsHandler(
      new NextRequest("http://localhost:3000/api/voting/ratings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `gff_session=${cookie}`,
        },
        body: JSON.stringify({
          ratings: [{ vendorId: testVendors[2].id, rating: 3 }],
          eventDayId: testDay1.id,
        }),
      })
    );
    const data2 = await rate2.json();
    // Still 4 remaining (0 extra slots consumed)
    expect(data2.updatedStatus.limits.remainingQuotaToday).toBe(4);
    expect(data2.updatedStatus.ratedVendorsToday[0].rating).toBe(3);
  });

  it("D. Different event day provides a fresh daily quota", async () => {
    // Session on Day 1
    const reqDay1 = new NextRequest("http://localhost:3000/api/voting/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "MultiDayUser", eventDayId: testDay1.id }),
    });
    const resDay1 = await verifyHandler(reqDay1);
    const cookieDay1 = resDay1.cookies.get("gff_session")?.value;

    // Exhaust Day 1 quota
    await ratingsHandler(
      new NextRequest("http://localhost:3000/api/voting/ratings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `gff_session=${cookieDay1}`,
        },
        body: JSON.stringify({
          ratings: testVendors.slice(0, 5).map((v) => ({ vendorId: v.id, rating: 5 })),
          eventDayId: testDay1.id,
        }),
      })
    );

    // User visits on Day 2
    const reqDay2 = new NextRequest("http://localhost:3000/api/voting/verify", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: `gff_session=${cookieDay1}`,
      },
      body: JSON.stringify({ name: "MultiDayUser", eventDayId: testDay2.id }),
    });
    const resDay2 = await verifyHandler(reqDay2);
    const dataDay2 = await resDay2.json();

    expect(resDay2.status).toBe(200);
    // Fresh daily quota of 5 stalls!
    expect(dataDay2.limits.remainingQuotaToday).toBe(5);
    expect(dataDay2.limits.ratedCountToday).toBe(0);
  });

  it("E. Tampered or forged session cookies cannot impersonate another session", async () => {
    // Genuine session
    const genuineReq = new NextRequest("http://localhost:3000/api/voting/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "GenuineUser", eventDayId: testDay1.id }),
    });
    const genuineRes = await verifyHandler(genuineReq);
    const genuineCookie = genuineRes.cookies.get("gff_session")?.value!;

    // Tampered signature
    const parts = genuineCookie.split(".");
    const forgedCookie = `${parts[0]}.forged_signature_here`;

    // Attempting to use forged cookie with ratings endpoint
    const attackReq = new NextRequest("http://localhost:3000/api/voting/ratings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: `gff_session=${forgedCookie}`,
      },
      body: JSON.stringify({
        ratings: [{ vendorId: testVendors[0].id, rating: 5 }],
      }),
    });
    const attackRes = await ratingsHandler(attackReq);
    expect(attackRes.status).toBe(401);
  });

  it("F. Zero-verification UX remains completely unchanged for attendee", async () => {
    // Only display name provided, zero tickets or verification
    const req = new NextRequest("http://localhost:3000/api/voting/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "ZeroFrictionAttendee", eventDayId: testDay1.id }),
    });
    const res = await verifyHandler(req);
    const data = await res.json();
    const cookie = res.cookies.get("gff_session")?.value;

    expect(res.status).toBe(200);
    expect(data.authenticated).toBe(true);
    expect(data.attendeeName).toBe("ZeroFrictionAttendee");
    expect(data.limits.remainingQuotaToday).toBe(5);
    expect(cookie).toBeDefined();

    // Verify token can be decoded by server
    const payload = verifySessionPayload(cookie!);
    expect(payload).toBeDefined();
    expect(payload?.attendeeName).toBe("ZeroFrictionAttendee");
    expect(payload?.role).toBe("ATTENDEE");
  });
});
