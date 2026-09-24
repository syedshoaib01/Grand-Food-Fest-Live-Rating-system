import { NextRequest, NextResponse } from "next/server";
import { getOrCreateAttendeeSession, getSessionStatus } from "@/lib/voting-engine";
import { signSessionPayload } from "@/lib/auth";
import { checkRateLimit, getClientIp } from "@/lib/rate-limiter";
import logger from "@/lib/logger";

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
    const passToken = body.passToken;
    const eventDayId = body.eventDayId;

    if (!passToken || typeof passToken !== "string") {
      return NextResponse.json(
        { error: "Please provide a valid event pass token (e.g. PASS-000001)." },
        { status: 400 }
      );
    }

    const session = await getOrCreateAttendeeSession(passToken, eventDayId);
    const sessionStatus = await getSessionStatus(session.id);

    // Create signed token (72-hour TTL)
    const token = signSessionPayload({
      sessionId: session.id,
      passToken: session.passToken,
      eventDayId: session.eventDayId,
      role: "ATTENDEE",
      timestamp: Date.now(),
    });

    const response = NextResponse.json({
      success: true,
      message: "Event pass verified successfully.",
      ...sessionStatus,
    });

    // Set HTTP-only cookie with secure flag in production
    response.cookies.set({
      name: "gff_session",
      value: token,
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 3, // 3 days
    });

    response.headers.set("X-RateLimit-Limit", String(rateResult.limit));
    response.headers.set("X-RateLimit-Remaining", String(rateResult.remaining));

    return response;
  } catch (error: any) {
    logger.warn("Pass verification failed", { error: error.message, clientIp });
    return NextResponse.json(
      { error: error.message || "This event pass could not be verified." },
      { status: 400 }
    );
  }
}
