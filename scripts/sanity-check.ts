import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("==================================================");
  console.log("PHASE 5: READ-ONLY PRODUCTION DATABASE SANITY CHECK");
  console.log("==================================================");

  const event = await prisma.event.findFirst({
    include: {
      days: { orderBy: { dayNumber: "asc" } },
      awards: true,
    },
  });

  if (!event) {
    throw new Error("No event found");
  }

  const [
    foodVendorsCount,
    lifestyleVendorsCount,
    otherVendorsCount,
    totalVendorsCount,
    adminCount,
    sessionCount,
    ratingCount,
    snapshotCount,
    anomalyCount,
  ] = await Promise.all([
    prisma.vendor.count({ where: { vendorType: "FOOD" } }),
    prisma.vendor.count({ where: { vendorType: "LIFESTYLE" } }),
    prisma.vendor.count({ where: { vendorType: { notIn: ["FOOD", "LIFESTYLE"] } } }),
    prisma.vendor.count(),
    prisma.adminUser.count(),
    prisma.attendeeSession.count(),
    prisma.rating.count(),
    prisma.rankSnapshot.count(),
    prisma.anomalyLog.count(),
  ]);

  console.log("\n1. EVENT CONFIGURATION:");
  console.log(`- Event Name: ${event.name}`);
  console.log(`- Event Slug: ${event.slug}`);
  console.log(`- Event Status: ${event.status}`);
  console.log(`- Start Date: ${event.startDate.toISOString()}`);
  console.log(`- End Date: ${event.endDate.toISOString()}`);
  console.log(`- Rating Limit Per Attendee Per Day: ${event.ratingLimitPerAttendeePerDay}`);
  console.log(`- Minimum Ratings For Leaderboard: ${event.minimumRatingsForLeaderboard}`);

  console.log("\n2. EVENT DAYS:");
  event.days.forEach((day) => {
    console.log(`- Day ${day.dayNumber}: Date = ${day.date.toISOString().slice(0, 10)}, Status = ${day.status}`);
  });

  console.log("\n3. VENDOR CATALOG:");
  console.log(`- Food Stalls (competing): ${foodVendorsCount}`);
  console.log(`- Lifestyle Stalls (non-competing): ${lifestyleVendorsCount}`);
  console.log(`- Other Stalls: ${otherVendorsCount}`);
  console.log(`- Total Official Vendors: ${totalVendorsCount}`);

  console.log("\n4. FESTIVAL AWARDS:");
  console.log(`- Total Awards Configured: ${event.awards.length}`);
  event.awards.forEach((award) => {
    console.log(`  • "${award.name}" [Category: ${award.category}] — Status: ${award.status}`);
  });

  console.log("\n5. SYSTEM ACCOUNTS & SESSIONS:");
  console.log(`- Admin Users: ${adminCount}`);
  console.log(`- Attendee Sessions: ${sessionCount}`);
  console.log(`- Ratings / Votes: ${ratingCount}`);
  console.log(`- Rank Snapshots: ${snapshotCount}`);
  console.log(`- Anomaly Logs: ${anomalyCount}`);

  console.log("\n6. VERIFICATION SUMMARY:");
  const isHealthy =
    event.status === "UPCOMING" &&
    event.days.every((d) => d.status === "UPCOMING") &&
    foodVendorsCount === 124 &&
    lifestyleVendorsCount === 40 &&
    totalVendorsCount === 164 &&
    adminCount === 1 &&
    sessionCount === 0 &&
    ratingCount === 0 &&
    snapshotCount === 0 &&
    anomalyCount === 0;

  console.log(`Database Pre-Launch Sanity: ${isHealthy ? "✅ PASSED (Pristine Pre-Event State)" : "❌ FAILED"}`);
  if (!isHealthy) {
    throw new Error("Sanity checks failed!");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
