import { NextRequest, NextResponse } from "next/server";
import { submitRatings, getSessionStatus } from "@/lib/voting-engine";
import { verifySessionPayload, signSessionPayload } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const cookie = req.cookies.get("gff_session")?.value;
    const idempotencyKey =
      req.headers.get("Idempotency-Key") || req.headers.get("idempotency-key") || body.idempotencyKey;

    let sessionId: string | undefined = undefined;

    if (cookie) {
      const decoded = verifySessionPayload<{ sessionId: string }>(cookie);
      if (decoded?.sessionId) {
        sessionId = decoded.sessionId;
      }
    }

    // Never trust client-provided sessionId or x-session-id header directly!
    // Must be either verified session cookie or valid passToken
    if (!sessionId && !body.passToken) {
      return NextResponse.json(
        { error: "Active attendee session required. Please verify your event pass." },
        { status: 401 }
      );
    }

    // Prepare ratings array: supports either body.ratings = [{ vendorId, rating }] or single body: { vendorId, rating }
    let ratings = body.ratings;
    if (!ratings && body.vendorId && body.rating) {
      ratings = [{ vendorId: body.vendorId, rating: body.rating }];
    }

    if (!ratings || !Array.isArray(ratings) || ratings.length === 0) {
      return NextResponse.json(
        { error: "Please select at least one vendor to rate." },
        { status: 400 }
      );
    }

    // Explicit star validation
    for (const r of ratings) {
      if (!r.rating || r.rating < 1 || r.rating > 5) {
        return NextResponse.json(
          { error: "Please provide an explicit rating between 1 and 5 stars for all selected stalls." },
          { status: 400 }
        );
      }
    }

    const result = await submitRatings({
      passToken: body.passToken,
      sessionId,
      eventDayId: body.eventDayId,
      ratings,
      idempotencyKey,
    });

    // Fetch updated session status
    const updatedStatus = await getSessionStatus(result.sessionId);

    const response = NextResponse.json({
      success: true,
      message: result.message,
      ratingsRecorded: result.ratingsRecorded,
      updatedStatus,
    });

    // If session was created via passToken without cookie, set cookie now
    if (!cookie && result.sessionId) {
      const token = signSessionPayload({
        sessionId: result.sessionId,
      });
      response.cookies.set({
        name: "gff_session",
        value: token,
        httpOnly: true,
        path: "/",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 3,
      });
    }

    return response;
  } catch (error: any) {
    const isLimit = error.message.includes("limit reached") || error.message.includes("quota");
    return NextResponse.json(
      { error: error.message || "Failed to submit ratings." },
      { status: isLimit ? 400 : 400 }
    );
  }
}
