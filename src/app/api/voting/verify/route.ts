import { NextRequest, NextResponse } from "next/server";
import { getOrCreateAttendeeSession, getSessionStatus } from "@/lib/voting-engine";
import { signSessionPayload } from "@/lib/auth";
import crypto from "crypto";

export async function POST(req: NextRequest) {
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

    let passToken: string;
    let displayName: string;

    // Check if input is a structured organizer pass (e.g. PASS-000001)
    if (/^PASS-[A-Z0-9_-]{4,32}$/i.test(rawInput)) {
      passToken = rawInput.toUpperCase();
      displayName = rawInput.toUpperCase();
    } else {
      // Normal attendee entering their name (e.g. "Ruwaiz", "Ruwaiz Khan", "John", "Ali")
      displayName = rawInput;
      const cleanSlug = rawInput.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
      if (cleanSlug.length >= 2) {
        passToken = `NAME-${cleanSlug.slice(0, 24)}`;
      } else {
        // Fallback for single character or special symbols
        const hash = crypto.createHash("sha256").update(rawInput).digest("hex").slice(0, 8).toUpperCase();
        passToken = `NAME-${cleanSlug || "GUEST"}-${hash}`;
      }
    }

    const session = await getOrCreateAttendeeSession(passToken, eventDayId);
    const sessionStatus = await getSessionStatus(session.id);

    // Create signed HMAC token with verified session and attendeeName
    const token = signSessionPayload({
      sessionId: session.id,
      passToken: session.passToken,
      attendeeName: displayName,
      eventDayId: session.eventDayId,
      role: "ATTENDEE",
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

    return response;
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Could not log in with this name. Please try again." },
      { status: 400 }
    );
  }
}
