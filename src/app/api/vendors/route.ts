import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const category = searchParams.get("category") || "";
    const cuisine = searchParams.get("cuisine") || "";
    const vendorType = searchParams.get("type") || "FOOD";
    const status = searchParams.get("status") || "ACTIVE";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "60", 10);
    const skip = (page - 1) * limit;

    const where: any = {};

    if (vendorType !== "ALL") {
      where.vendorType = vendorType;
    }

    if (status !== "ALL") {
      where.status = status;
    }

    if (category && category !== "All") {
      where.category = category;
    }

    if (cuisine && cuisine !== "All") {
      where.cuisine = cuisine;
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
        { category: { contains: search } },
        { cuisine: { contains: search } },
        { stallNumber: { contains: search } },
      ];
    }

    const [total, vendors] = await Promise.all([
      prisma.vendor.count({ where }),
      prisma.vendor.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ stallNumber: "asc" }, { name: "asc" }],
      }),
    ]);

    const vendorIds = vendors.map((v: any) => v.id);
    const ratingAggs = vendorIds.length > 0
      ? await prisma.rating.groupBy({
          by: ["vendorId"],
          where: {
            vendorId: { in: vendorIds },
            isValid: true,
          },
          _count: { rating: true },
          _sum: { rating: true },
        })
      : [];

    const ratingMap = new Map<string, { count: number; sum: number }>();
    for (const a of ratingAggs) {
      ratingMap.set(a.vendorId, {
        count: a._count.rating || 0,
        sum: a._sum.rating || 0,
      });
    }

    // Format vendors with rating summary
    const formatted = vendors.map((v: any) => {
      const stats = ratingMap.get(v.id) || { count: 0, sum: 0 };
      const avg = stats.count > 0 ? Number((stats.sum / stats.count).toFixed(2)) : 0;

      return {
        id: v.id,
        name: v.name,
        slug: v.slug,
        description: v.description,
        category: v.category,
        cuisine: v.cuisine,
        stallNumber: v.stallNumber,
        vendorType: v.vendorType,
        status: v.status,
        ratingCount: stats.count,
        ratingAverage: avg,
      };
    });

    // Extract unique categories and cuisines for filter pills
    const allCategories = await prisma.vendor.findMany({
      where: { vendorType: vendorType !== "ALL" ? vendorType : undefined },
      select: { category: true, cuisine: true },
      distinct: ["category"],
    });

    const categories = Array.from(new Set(allCategories.map((c: { category: string }) => c.category))).filter(Boolean);

    return NextResponse.json({
      vendors: formatted,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      categories,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.authorized) {
    return auth.response;
  }

  try {
    const body = await req.json();
    const event = await prisma.event.findFirst();
    if (!event) return NextResponse.json({ error: "No event found" }, { status: 400 });

    const slug = body.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    const vendor = await prisma.vendor.create({
      data: {
        eventId: event.id,
        name: body.name,
        slug,
        description: body.description || null,
        category: body.category,
        cuisine: body.cuisine || null,
        stallNumber: body.stallNumber,
        vendorType: body.vendorType || "FOOD",
        status: body.status || "ACTIVE",
        logoUrl: body.logoUrl || null,
      },
    });

    return NextResponse.json({ vendor }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
