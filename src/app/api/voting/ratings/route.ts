import { NextRequest, NextResponse } from "next/server";
import { submitRatings, getSessionStatus } from "@/lib/voting-engine";
import { verifySessionPayload } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const cookie = req.cookies.get("gff_session")?.value;
    const headerSessionId = req.headers.get("x-session-id");
    const idempotencyKey =
      req.headers.get("Idempotency-Key") || req.headers.get("idempotency-key") || body.idempotencyKey;

    let sessionId: string | undefined = undefined;

    if (cookie) {
      const decoded = verifySessionPayload<{ sessionId: string }>(cookie);
      if (decoded?.sessionId) {
        sessionId = decoded.sessionId;
      }
    }

    if (!sessionId && headerSessionId) {
      sessionId = headerSessionId;
    }

    if (!sessionId && body.sessionId) {
      sessionId = body.sessionId;
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

    const result = await submitRatings({
      passToken: body.passToken,
      sessionId,
      eventDayId: body.eventDayId,
      ratings,
      idempotencyKey,
    });

    // Fetch updated session status
    const updatedStatus = await getSessionStatus(result.sessionId);

    return NextResponse.json({
      success: true,
      message: result.message,
      ratingsRecorded: result.ratingsRecorded,
      updatedStatus,
    });
  } catch (error: any) {
    const status = error.message.includes("limit reached") ? 400 : 400;
    return NextResponse.json(
      { error: error.message || "Failed to submit ratings." },
      { status }
    );
  }
}
