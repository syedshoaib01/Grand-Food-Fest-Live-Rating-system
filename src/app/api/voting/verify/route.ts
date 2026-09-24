import { NextRequest, NextResponse } from "next/server";
import { getOrCreateAttendeeSession, getSessionStatus } from "@/lib/voting-engine";
import { signSessionPayload, verifySessionPayload } from "@/lib/auth";
import { checkRateLimit, getClientIp } from "@/lib/rate-limiter";
import logger from "@/lib/logger";
import prisma from "@/lib/prisma";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  // 1. Rate Limiting check (20 attempts per minute per IP)
  const clientIp = getClientIp(req);
  const rateResult = checkRateLimit(`verify:${clientIp}`, { limit: 20, windowMs: 60 * 1000 });

  if (!rateResult.success) {
    return NextResponse.json(
      {
        error: "Too many verification attempts. Please wait a moment before trying again.",
        code: "RATE_LIMIT_EXCEEDED",
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(rateResult.resetSeconds),
          "X-RateLimit-Limit": String(rateResult.limit),
          "X-RateLimit-Remaining": String(rateResult.remaining),
        },
      }
    );
  }

  try {
    const body = await req.json();
    
    // Accept either name or passToken seamlessly
    const rawInput =
      (typeof body.name === "string" ? body.name.trim() : "") ||
      (typeof body.passToken === "string" ? body.passToken.trim() : "");
    const eventDayId = body.eventDayId;

    if (!rawInput) {
      return NextResponse.json(
        { error: "Please enter your name to continue." },
        { status: 400 }
      );
    }

    let session: any = null;
    let displayName: string = rawInput;

    const isOrganizerPass = /^PASS-[A-Z0-9_-]{4,32}$/i.test(rawInput);

    if (isOrganizerPass) {
      // Structured organizer pass (e.g. PASS-VIP001)
      const passToken = rawInput.toUpperCase();
      displayName = passToken;
      session = await getOrCreateAttendeeSession(passToken, eventDayId);
    } else {
      // General attendee entering their display name
      displayName = rawInput;

      // Check if client already has a valid signed session cookie
      const cookie = req.cookies.get("gff_session")?.value;
      if (cookie) {
        const decoded = verifySessionPayload<{ sessionId: string; eventDayId?: string }>(cookie);
        if (decoded?.sessionId) {
          const existing = await prisma.attendeeSession.findUnique({
            where: { id: decoded.sessionId },
            include: { eventDay: true, event: true },
          });

          // Reuse session if it exists and matches the requested event day (or current active day)
          if (existing && (!eventDayId || existing.eventDayId === eventDayId)) {
            session = existing;
            await prisma.attendeeSession.update({
              where: { id: existing.id },
              data: { lastSeenAt: new Date() },
            });
          }
        }
      }

      // New visitor without an existing session cookie (or fresh session for a different event day):
      // Generate a cryptographically random unique session token so two people with the same name never collide!
      if (!session) {
        const randomToken = `ANON-${crypto.randomBytes(12).toString("hex").toUpperCase()}`;
        session = await getOrCreateAttendeeSession(randomToken, eventDayId);
      }
    }
    const sessionStatus = await getSessionStatus(session.id);

    // Create signed HMAC token with verified session, attendeeName, and 72-hour TTL
    const token = signSessionPayload({
      sessionId: session.id,
      passToken: session.passToken,
      attendeeName: displayName,
      eventDayId: session.eventDayId,
      role: "ATTENDEE",
      timestamp: Date.now(),
    });

    const response = NextResponse.json({
      success: true,
      authenticated: true,
      message: "Session authenticated successfully.",
      attendeeName: displayName,
      ...sessionStatus,
    });

    // Set cookie: only enable secure over HTTPS (allows mobile testing on LAN http://192.168.x.x)
    const isHttps =
      req.nextUrl.protocol === "https:" ||
      req.headers.get("x-forwarded-proto") === "https";

    response.cookies.set({
      name: "gff_session",
      value: token,
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      secure: isHttps,
      maxAge: 60 * 60 * 24 * 3, // 3 days
    });

    response.headers.set("X-RateLimit-Limit", String(rateResult.limit));
    response.headers.set("X-RateLimit-Remaining", String(rateResult.remaining));

    return response;
  } catch (error: any) {
    logger.warn("Pass verification failed", { error: error.message, clientIp });
    return NextResponse.json(
      { error: error.message || "Could not log in with this name. Please try again." },
      { status: 400 }
    );
  }
}
