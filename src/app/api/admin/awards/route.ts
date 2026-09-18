import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const awards = await prisma.award.findMany({
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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    const event = await prisma.event.findFirst();
    if (!event) return NextResponse.json({ error: "No event found" }, { status: 400 });

    if (action === "CREATE_AWARD") {
      const { name, category, description, nomineeVendorIds } = body;
      const award = await prisma.award.create({
        data: {
          eventId: event.id,
          name,
          category,
          description,
          status: "DRAFT",
        },
      });

      if (nomineeVendorIds && Array.isArray(nomineeVendorIds)) {
        for (const vId of nomineeVendorIds) {
          await prisma.awardNominee.create({
            data: { awardId: award.id, vendorId: vId },
          });
        }
      }

      return NextResponse.json({ success: true, award }, { status: 201 });
    } else if (action === "UPDATE_STATUS") {
      const { awardId, status, winnerVendorId } = body;
      const updated = await prisma.award.update({
        where: { id: awardId },
        data: {
          status,
          winnerVendorId: winnerVendorId || undefined,
        },
      });

      return NextResponse.json({ success: true, award: updated });
    } else if (action === "SET_NOMINEES") {
      const { awardId, nomineeVendorIds } = body;
      await prisma.awardNominee.deleteMany({ where: { awardId } });
      for (const vId of nomineeVendorIds) {
        await prisma.awardNominee.create({
          data: { awardId, vendorId: vId },
        });
      }
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
