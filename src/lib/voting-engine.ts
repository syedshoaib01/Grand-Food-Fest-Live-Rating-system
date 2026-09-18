import prisma from "./prisma";
import { hashPassToken } from "./auth";

export interface RatingInput {
  vendorId: string;
  rating: number; // 1 to 5
}

export interface SubmitRatingsParams {
  passToken?: string;
  sessionId?: string;
  eventDayId?: string; // Optional: defaults to currently active event day
  ratings: RatingInput[];
  idempotencyKey?: string;
}

export interface AttendeeSessionStatus {
  session: {
    id: string;
    passToken: string;
    eventDayId: string;
    dayNumber: number;
    dayDate: string;
  };
  limits: {
    maxPerDay: number;
    ratedCountToday: number;
    remainingQuotaToday: number;
  };
  ratedVendorsToday: Array<{
    ratingId: string;
    vendorId: string;
    vendorName: string;
    rating: number;
    updatedAt: string;
  }>;
}

/**
 * Validates an event pass (or creates an anonymous session if valid)
 * for the currently active event day.
 */
export async function getOrCreateAttendeeSession(
  passToken: string,
  targetEventDayId?: string
) {
  const normalizedPass = passToken.trim().toUpperCase();
  if (!normalizedPass.match(/^[A-Z0-9_-]{4,32}$/)) {
    throw new Error("Invalid pass format. Please enter a valid event pass (e.g. PASS-000001).");
  }

  // Get active event day
  let eventDay;
  if (targetEventDayId) {
    eventDay = await prisma.eventDay.findUnique({
      where: { id: targetEventDayId },
      include: { event: true },
    });
  } else {
    eventDay = await prisma.eventDay.findFirst({
      where: { status: "LIVE" },
      include: { event: true },
      orderBy: { dayNumber: "asc" },
    });
  }

  if (!eventDay) {
    // If no day is explicitly LIVE, fallback to Day 1 or throw
    eventDay = await prisma.eventDay.findFirst({
      include: { event: true },
      orderBy: { dayNumber: "asc" },
    });
  }

  if (!eventDay) {
    throw new Error("No festival event days configured.");
  }

  const passHash = hashPassToken(normalizedPass);

  // Upsert anonymous session for this pass on this event day
  const session = await prisma.attendeeSession.upsert({
    where: {
      passHash_eventDayId: {
        passHash,
        eventDayId: eventDay.id,
      },
    },
    update: {
      lastSeenAt: new Date(),
    },
    create: {
      eventId: eventDay.eventId,
      eventDayId: eventDay.id,
      passHash,
      passToken: normalizedPass,
    },
    include: {
      eventDay: true,
      event: true,
    },
  });

  return session;
}

/**
 * Retrieve session status, rated vendors today, and remaining quota
 */
export async function getSessionStatus(sessionId: string): Promise<AttendeeSessionStatus> {
  const session = await prisma.attendeeSession.findUnique({
    where: { id: sessionId },
    include: {
      eventDay: true,
      event: true,
      ratings: {
        where: { isValid: true },
        include: { vendor: true },
        orderBy: { updatedAt: "desc" },
      },
    },
  });

  if (!session) {
    throw new Error("Session not found. Please verify your event pass.");
  }

  const maxPerDay = session.event.ratingLimitPerAttendeePerDay;
  const ratedCountToday = session.ratings.length;
  const remainingQuotaToday = Math.max(0, maxPerDay - ratedCountToday);

  return {
    session: {
      id: session.id,
      passToken: session.passToken,
      eventDayId: session.eventDayId,
      dayNumber: session.eventDay.dayNumber,
      dayDate: session.eventDay.date.toISOString(),
    },
    limits: {
      maxPerDay,
      ratedCountToday,
      remainingQuotaToday,
    },
    ratedVendorsToday: session.ratings.map((r) => ({
      ratingId: r.id,
      vendorId: r.vendorId,
      vendorName: r.vendor.name,
      rating: r.rating,
      updatedAt: r.updatedAt.toISOString(),
    })),
  };
}

/**
 * Submit one or more ratings with atomic transaction & strict rule validation
 */
export async function submitRatings(params: SubmitRatingsParams) {
  const { passToken, sessionId, eventDayId, ratings, idempotencyKey } = params;

  if (!ratings || ratings.length === 0) {
    throw new Error("No ratings provided. Please select at least one vendor to rate.");
  }

  // 1. Resolve Session
  let session;
  if (sessionId) {
    session = await prisma.attendeeSession.findUnique({
      where: { id: sessionId },
      include: { eventDay: true, event: true },
    });
  } else if (passToken) {
    session = await getOrCreateAttendeeSession(passToken, eventDayId);
  }

  if (!session) {
    throw new Error("This event pass could not be verified.");
  }

  // 2. Validate Event Day Status
  const currentDay = await prisma.eventDay.findUnique({
    where: { id: session.eventDayId },
    include: { event: true },
  });

  if (!currentDay) {
    throw new Error("Event day not found.");
  }

  if (currentDay.status === "CLOSED" || currentDay.event.status === "FINALIZED") {
    throw new Error("Voting is closed for today.");
  }

  // 3. Validate Rating Inputs
  for (const item of ratings) {
    if (!Number.isInteger(item.rating) || item.rating < 1 || item.rating > 5) {
      throw new Error(`Invalid star rating (${item.rating}). Rating must be an integer between 1 and 5.`);
    }
  }

  // Deduplicate inputs by vendorId within the submission batch (take last rating)
  const dedupedMap = new Map<string, number>();
  for (const item of ratings) {
    dedupedMap.set(item.vendorId, item.rating);
  }
  const cleanRatings = Array.from(dedupedMap.entries()).map(([vendorId, rating]) => ({
    vendorId,
    rating,
  }));

  // 4. Validate Vendors existence and eligibility
  const vendorIds = cleanRatings.map((r) => r.vendorId);
  const vendors = await prisma.vendor.findMany({
    where: {
      id: { in: vendorIds },
      eventId: session.eventId,
    },
  });

  if (vendors.length !== vendorIds.length) {
    throw new Error("One or more selected vendors could not be found.");
  }

  for (const vendor of vendors) {
    if (vendor.vendorType !== "FOOD") {
      throw new Error(`'${vendor.name}' is a lifestyle stall and is not eligible for food ratings.`);
    }
    if (vendor.status !== "ACTIVE") {
      throw new Error(`'${vendor.name}' is not currently accepting ratings.`);
    }
  }

  // 5. Atomic Transaction: Check Quota & Upsert Ratings
  return await prisma.$transaction(async (tx) => {
    // Check idempotency if key is supplied
    if (idempotencyKey) {
      const existingWithKey = await tx.rating.findFirst({
        where: {
          attendeeSessionId: session.id,
          idempotencyKey,
        },
      });
      if (existingWithKey) {
        // Return already processed state
        return {
          success: true,
          message: "Ratings recorded successfully (idempotent replay).",
          sessionId: session.id,
          recordedCount: cleanRatings.length,
        };
      }
    }

    // Get current active ratings for this attendee on this day
    const existingRatings = await tx.rating.findMany({
      where: {
        attendeeSessionId: session.id,
        eventDayId: session.eventDayId,
        isValid: true,
      },
    });

    const existingVendorIdSet = new Set(existingRatings.map((r) => r.vendorId));

    // Calculate how many NEW distinct vendors are being introduced
    let newVendorsCount = 0;
    for (const r of cleanRatings) {
      if (!existingVendorIdSet.has(r.vendorId)) {
        newVendorsCount++;
      }
    }

    const maxLimit = session.event.ratingLimitPerAttendeePerDay || 5;
    const projectedTotalVendors = existingVendorIdSet.size + newVendorsCount;

    if (projectedTotalVendors > maxLimit) {
      throw new Error(
        `You've reached today's ${maxLimit}-vendor rating limit. You already rated ${existingVendorIdSet.size} vendors and cannot add ${newVendorsCount} more.`
      );
    }

    // Upsert each rating: One attendee + one vendor + one event day = one active rating
    const results = [];
    for (const r of cleanRatings) {
      const saved = await tx.rating.upsert({
        where: {
          attendeeSessionId_vendorId_eventDayId: {
            attendeeSessionId: session.id,
            vendorId: r.vendorId,
            eventDayId: session.eventDayId,
          },
        },
        update: {
          rating: r.rating,
          isValid: true,
          idempotencyKey: idempotencyKey || null,
          updatedAt: new Date(),
        },
        create: {
          eventId: session.eventId,
          eventDayId: session.eventDayId,
          attendeeSessionId: session.id,
          vendorId: r.vendorId,
          rating: r.rating,
          isValid: true,
          idempotencyKey: idempotencyKey || null,
        },
      });
      results.push(saved);
    }

    return {
      success: true,
      message: "Your ratings have been recorded successfully!",
      sessionId: session.id,
      eventDayId: session.eventDayId,
      ratingsRecorded: results.length,
    };
  });
}
