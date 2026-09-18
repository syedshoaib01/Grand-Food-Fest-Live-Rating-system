# Database Schema & Migration Guide — Grand Food Fest

## 1. Relational Model Overview
The database uses a clean, relational architecture designed to support high concurrent voting volume, prevent duplicate ratings, and partition operations by festival day.

```
┌──────────┐        1:N        ┌───────────┐
│  Event   │───────────────────┤ EventDay  │
└────┬─────┘                   └─────┬─────┘
     │ 1:N                           │ 1:N
     ├─────────────────┐             │
     │                 │             │
┌────┴─────┐     ┌─────┴───────────┐ │
│  Vendor  │     │ AttendeeSession │─┘
└────┬─────┘     └─────────┬───────┘
     │ 1:N                 │ 1:N
┌────┴─────────────────────┴───────┐
│              Rating              │
│ (attendeeSession, vendor, day)   │
└──────────────────────────────────┘
```

---

## 2. Table Specifications

### `Event`
Stores festival-wide configuration and global status.
- `id` (String, PK, CUID)
- `name` (String): e.g. `"Grand Food Fest Hyderabad 2026"`
- `slug` (String, Unique): e.g. `"grand-food-fest-hyd-2026"`
- `startDate` (DateTime) & `endDate` (DateTime)
- `status` (String): `UPCOMING`, `LIVE`, `CLOSING`, `FINALIZED`
- `ratingLimitPerAttendeePerDay` (Int, default 5)
- `minimumRatingsForLeaderboard` (Int, default 20)

### `EventDay`
Explicitly tracks individual festival days (Oct 9, 10, 11).
- `id` (String, PK)
- `eventId` (String, FK -> Event)
- `dayNumber` (Int): 1, 2, 3
- `date` (DateTime): e.g. `2026-10-09`
- `status` (String): `UPCOMING`, `LIVE`, `CLOSED`
- **Constraint**: `@@unique([eventId, date])`

### `Vendor`
All participating stalls (Food and Lifestyle).
- `id` (String, PK)
- `eventId` (String, FK -> Event)
- `name` (String): Stall brand name
- `slug` (String, Unique)
- `stallNumber` (String): e.g. `A-01`
- `category` (String): e.g. `"Biryani & Pulao"`, `"Desserts & Ice Cream"`
- `cuisine` (String?): e.g. `"Hyderabadi"`, `"Mughlai"`
- `vendorType` (String): `"FOOD"` or `"LIFESTYLE"`
- `status` (String): `ACTIVE`, `PAUSED`, `CLOSED`, `WITHDRAWN`

### `AttendeeSession`
Anonymous identification tied to an event day. No PII is stored.
- `id` (String, PK)
- `eventId` (String, FK -> Event)
- `eventDayId` (String, FK -> EventDay)
- `passHash` (String): SHA-256 hash of ticket pass + festival salt
- `passToken` (String): Masked or dev token (e.g. `PASS-000001`)
- **Constraint**: `@@unique([passHash, eventDayId])`

### `Rating`
The core atomic voting record.
- `id` (String, PK)
- `eventId` (String, FK -> Event)
- `eventDayId` (String, FK -> EventDay)
- `attendeeSessionId` (String, FK -> AttendeeSession)
- `vendorId` (String, FK -> Vendor)
- `rating` (Int): 1 to 5 stars
- `isValid` (Boolean, default true): Supports soft invalidation / fraud flags
- `idempotencyKey` (String?): Prevents duplicate submissions on network retries
- **Constraint**: `@@unique([attendeeSessionId, vendorId, eventDayId])`
  - Guarantees: `One attendee + One vendor + One event day = One active rating`.

### `Award` & `AwardNominee`
Configurable Oscars-style award honors.
- `Award`: `id`, `name`, `category`, `description`, `status` (`DRAFT`, `NOMINEES_REVEALED`, `WINNER_ANNOUNCED`), `winnerVendorId`.
- `AwardNominee`: `id`, `awardId`, `vendorId`. `@@unique([awardId, vendorId])`.

### `AnomalyLog`
Audit records of detected velocity spikes or suspicious patterns.
- `id`, `vendorId`, `type` (`VELOCITY_SPIKE`), `severity`, `details`, `resolved`, `resolvedAt`, `resolvedBy`.

---

## 3. Database Indexes & Query Optimization
Indexes added to optimize frequent queries under high crowd traffic:
- `Rating`: `@@index([eventId])`, `@@index([eventDayId])`, `@@index([vendorId])`, `@@index([createdAt])`, `@@index([isValid])`
- `AttendeeSession`: `@@index([eventId])`, `@@index([eventDayId])`
- `Vendor`: `@@index([eventId])`, `@@index([vendorType])`, `@@index([status])`, `@@index([category])`

---

## 4. Production PostgreSQL / Supabase Migration
To switch from SQLite to PostgreSQL or Supabase in production:
1. In `prisma/schema.prisma`, update the datasource:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
2. In `.env`, set:
   ```env
   DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT].supabase.co:5432/postgres"
   ```
3. Run:
   ```bash
   npx prisma db push
   npm run db:seed
   ```
