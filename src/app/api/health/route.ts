import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import logger from "@/lib/logger";

export const dynamic = "force-dynamic";

const startTime = Date.now();

export async function GET() {
  const start = performance.now();

  try {
    // Probe database connectivity and fetch current event status
    const event = await prisma.event.findFirst({
      select: {
        id: true,
        name: true,
        status: true,
      },
    });

    const latencyMs = Math.round((performance.now() - start) * 10) / 10;
    const uptimeSeconds = Math.round((Date.now() - startTime) / 1000);

    return NextResponse.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      uptimeSeconds,
      database: {
        status: "connected",
        latencyMs,
      },
      event: event
        ? {
            name: event.name,
            status: event.status,
          }
        : null,
    });
  } catch (error: any) {
    const latencyMs = Math.round((performance.now() - start) * 10) / 10;
    logger.error("Health check failed", error, { latencyMs });

    return NextResponse.json(
      {
        status: "error",
        timestamp: new Date().toISOString(),
        database: {
          status: "disconnected",
          latencyMs,
          error: "Database connection unavailable",
        },
      },
      { status: 503 }
    );
  }
}
