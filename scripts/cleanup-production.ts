import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("==================================================");
  console.log("PHASE 3 & 4: DATABASE AUDIT, CLEANUP & EVENT RESET");
  console.log("==================================================");

  // 1. Inspect before counts
  const [
    eventsBefore,
    daysBefore,
    vendorsBefore,
    awardsBefore,
    awardNomineesBefore,
    adminUsersBefore,
    sessionsBefore,
    ratingsBefore,
    snapshotsBefore,
    anomaliesBefore,
  ] = await Promise.all([
    prisma.event.count(),
    prisma.eventDay.count(),
    prisma.vendor.count(),
    prisma.award.count(),
    prisma.awardNominee.count(),
    prisma.adminUser.count(),
    prisma.attendeeSession.count(),
    prisma.rating.count(),
    prisma.rankSnapshot.count(),
    prisma.anomalyLog.count(),
  ]);

  console.log("BEFORE CLEANUP COUNTS:");
  console.log(`- events: ${eventsBefore}`);
  console.log(`- eventDays: ${daysBefore}`);
  console.log(`- vendors: ${vendorsBefore}`);
  console.log(`- awards: ${awardsBefore}`);
  console.log(`- awardNominees: ${awardNomineesBefore}`);
  console.log(`- adminUsers: ${adminUsersBefore}`);
  console.log(`- attendeeSessions (to clean): ${sessionsBefore}`);
  console.log(`- ratings (to clean): ${ratingsBefore}`);
  console.log(`- rankSnapshots (to clean): ${snapshotsBefore}`);
  console.log(`- anomalyLogs (to clean): ${anomaliesBefore}`);

  // Fetch production event
  const prodEvent = await prisma.event.findFirst({
    include: { days: { orderBy: { dayNumber: "asc" } } },
  });

  if (!prodEvent) {
    throw new Error("No production event found in database.");
  }

  console.log(`\nFound Production Event: "${prodEvent.name}" (Current Status: ${prodEvent.status})`);
  prodEvent.days.forEach((d) => {
    console.log(`  Day ${d.dayNumber} (${d.date.toISOString().slice(0, 10)}): Current Status = ${d.status}`);
  });

  console.log("\nExecuting atomic transactional cleanup and status reset...");

  await prisma.$transaction(async (tx) => {
    // 1. Delete all ratings (dependency leaf)
    const deletedRatings = await tx.rating.deleteMany();
    console.log(`  ✓ Deleted ${deletedRatings.count} temporary ratings.`);

    // 2. Delete all attendee sessions
    const deletedSessions = await tx.attendeeSession.deleteMany();
    console.log(`  ✓ Deleted ${deletedSessions.count} temporary attendee sessions.`);

    // 3. Delete any rank snapshots
    const deletedSnapshots = await tx.rankSnapshot.deleteMany();
    console.log(`  ✓ Deleted ${deletedSnapshots.count} test rank snapshots.`);

    // 4. Delete any anomaly logs
    const deletedAnomalies = await tx.anomalyLog.deleteMany();
    console.log(`  ✓ Deleted ${deletedAnomalies.count} test anomaly logs.`);

    // 5. Reset Event status to UPCOMING (today is Sept 24, fest is Oct 9-11)
    await tx.event.update({
      where: { id: prodEvent.id },
      data: { status: "UPCOMING" },
    });
    console.log(`  ✓ Reset Event "${prodEvent.name}" status to UPCOMING.`);

    // 6. Reset all EventDays to UPCOMING
    const updatedDays = await tx.eventDay.updateMany({
      where: { eventId: prodEvent.id },
      data: { status: "UPCOMING" },
    });
    console.log(`  ✓ Reset ${updatedDays.count} EventDays to UPCOMING.`);
  });

  // 2. Inspect after counts
  const [
    eventsAfter,
    daysAfter,
    vendorsAfter,
    awardsAfter,
    awardNomineesAfter,
    adminUsersAfter,
    sessionsAfter,
    ratingsAfter,
    snapshotsAfter,
    anomaliesAfter,
  ] = await Promise.all([
    prisma.event.count(),
    prisma.eventDay.count(),
    prisma.vendor.count(),
    prisma.award.count(),
    prisma.awardNominee.count(),
    prisma.adminUser.count(),
    prisma.attendeeSession.count(),
    prisma.rating.count(),
    prisma.rankSnapshot.count(),
    prisma.anomalyLog.count(),
  ]);

  const updatedEvent = await prisma.event.findFirst({
    include: { days: { orderBy: { dayNumber: "asc" } } },
  });

  console.log("\nAFTER CLEANUP COUNTS:");
  console.log(`- events: ${eventsAfter} (Expected: 1)`);
  console.log(`- eventDays: ${daysAfter} (Expected: 3)`);
  console.log(`- vendors: ${vendorsAfter} (Expected: 164)`);
  console.log(`- awards: ${awardsAfter} (Expected: 5)`);
  console.log(`- awardNominees: ${awardNomineesAfter} (Expected: 0)`);
  console.log(`- adminUsers: ${adminUsersAfter} (Expected: 1)`);
  console.log(`- attendeeSessions: ${sessionsAfter} (Expected: 0)`);
  console.log(`- ratings: ${ratingsAfter} (Expected: 0)`);
  console.log(`- rankSnapshots: ${snapshotsAfter} (Expected: 0)`);
  console.log(`- anomalyLogs: ${anomaliesAfter} (Expected: 0)`);

  console.log(`\nUpdated Event Status: ${updatedEvent?.status}`);
  updatedEvent?.days.forEach((d) => {
    console.log(`  Day ${d.dayNumber} (${d.date.toISOString().slice(0, 10)}): Status = ${d.status}`);
  });

  // Assert clean state
  if (
    vendorsAfter !== 164 ||
    eventsAfter !== 1 ||
    daysAfter !== 3 ||
    adminUsersAfter !== 1 ||
    sessionsAfter !== 0 ||
    ratingsAfter !== 0 ||
    snapshotsAfter !== 0 ||
    anomaliesAfter !== 0 ||
    updatedEvent?.status !== "UPCOMING" ||
    updatedEvent.days.some((d) => d.status !== "UPCOMING")
  ) {
    throw new Error("Database state verification failed after cleanup!");
  }

  console.log("\n✨ DATABASE CLEANUP AND EVENT STATUS RESET COMPLETE & VERIFIED CLEAN!");
}

main()
  .catch((e) => {
    console.error("Cleanup error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
