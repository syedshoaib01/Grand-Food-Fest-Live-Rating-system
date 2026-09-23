import { NextRequest, NextResponse } from "next/server";
import { getOrCreateAttendeeSession, getSessionStatus } from "@/lib/voting-engine";
import { signSessionPayload } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const rawName = typeof body.name === "string" ? body.name.trim() : "";
    let passToken = body.passToken;
    const eventDayId = body.eventDayId;

    if (!passToken && rawName) {
      const sanitized = rawName.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
      passToken = `NAME-${sanitized.slice(0, 20) || "ATTENDEE"}`;
    }

    if (!passToken || typeof passToken !== "string") {
      return NextResponse.json(
        { error: "Please enter your name or a valid festival pass token." },
        { status: 400 }
      );
    }

    const session = await getOrCreateAttendeeSession(passToken, eventDayId);
    const sessionStatus = await getSessionStatus(session.id);

    // Create signed token with attendeeName if provided
    const token = signSessionPayload({
      sessionId: session.id,
      passToken: session.passToken,
      attendeeName: rawName || undefined,
      eventDayId: session.eventDayId,
      role: "ATTENDEE",
    });

    const response = NextResponse.json({
      success: true,
      message: "Session authenticated successfully.",
      attendeeName: rawName || undefined,
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

    return response;
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "This event pass could not be verified." },
      { status: 400 }
    );
  }
}
