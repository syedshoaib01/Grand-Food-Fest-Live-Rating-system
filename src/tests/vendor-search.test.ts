import { describe, it, expect, beforeAll } from "vitest";
import prisma from "@/lib/prisma";

describe("PostgreSQL Case-Insensitive Vendor Search", () => {
  let testVendor: any;

  beforeAll(async () => {
    // Ensure we have "Spice Route" in database
    testVendor = await prisma.vendor.findFirst({
      where: { name: { contains: "Spice Route", mode: "insensitive" } },
    });

    if (!testVendor) {
      const event = await prisma.event.findFirst();
      testVendor = await prisma.vendor.create({
        data: {
          eventId: event!.id,
          name: "Spice Route",
          slug: "test-spice-route-search",
          stallNumber: "SR-99",
          category: "Biryani & Pulao",
          cuisine: "Hyderabadi",
          vendorType: "FOOD",
          status: "ACTIVE",
        },
      });
    }
  });

  it("matches lowercase 'spice' against 'Spice Route'", async () => {
    const results = await prisma.vendor.findMany({
      where: {
        name: { contains: "spice", mode: "insensitive" },
      },
    });

    expect(results.length).toBeGreaterThan(0);
    expect(results.some((v) => v.name.includes("Spice"))).toBe(true);
  });

  it("matches uppercase 'SPICE' against 'Spice Route'", async () => {
    const results = await prisma.vendor.findMany({
      where: {
        name: { contains: "SPICE", mode: "insensitive" },
      },
    });

    expect(results.length).toBeGreaterThan(0);
    expect(results.some((v) => v.name.includes("Spice"))).toBe(true);
  });

  it("matches mixed-case 'SpIcE' against 'Spice Route'", async () => {
    const results = await prisma.vendor.findMany({
      where: {
        name: { contains: "SpIcE", mode: "insensitive" },
      },
    });

    expect(results.length).toBeGreaterThan(0);
    expect(results.some((v) => v.name.includes("Spice"))).toBe(true);
  });

  it("matches partial strings across description and category", async () => {
    const results = await prisma.vendor.findMany({
      where: {
        OR: [
          { name: { contains: "biryani", mode: "insensitive" } },
          { category: { contains: "biryani", mode: "insensitive" } },
          { cuisine: { contains: "hyderabadi", mode: "insensitive" } },
        ],
      },
    });

    expect(results.length).toBeGreaterThan(0);
  });
});
