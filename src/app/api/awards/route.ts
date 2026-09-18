import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const awards = await prisma.award.findMany({
      where: {
        status: { in: ["NOMINEES_REVEALED", "WINNER_ANNOUNCED"] },
      },
      orderBy: { createdAt: "asc" },
      include: {
        winnerVendor: {
          select: { id: true, name: true, stallNumber: true, category: true, cuisine: true },
        },
        nominees: {
          include: {
            vendor: {
              select: { id: true, name: true, stallNumber: true, category: true, cuisine: true },
            },
          },
        },
      },
    });

    const formatted = awards.map((a: any) => ({
      id: a.id,
      name: a.name,
      category: a.category,
      description: a.description,
      status: a.status,
      winner: a.winnerVendor
        ? {
            id: a.winnerVendor.id,
            name: a.winnerVendor.name,
            stall: a.winnerVendor.stallNumber,
            category: a.winnerVendor.category,
          }
        : null,
      nominees: a.nominees.map((n: any) => ({
        id: n.vendor.id,
        name: n.vendor.name,
        stall: n.vendor.stallNumber,
        category: n.vendor.category,
        cuisine: n.vendor.cuisine,
      })),
    }));

    return NextResponse.json({ awards: formatted });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
