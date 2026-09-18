# DATABASE SPECIFICATION — GRAND FOOD FEST

This document details the database schema, models, constraints, and index strategies in `prisma/schema.prisma`.

---

## 1. DATA MODEL ENTITY RELATIONSHIPS

```mermaid
erDiagram
    Event ||--o{ EventDay : contains
    Event ||--o{ Vendor : hosts
    Event ||--o{ AttendeeSession : tracks
    Event ||--o{ Rating : records
    Event ||--o{ Award : offers
    Event ||--o{ RankSnapshot : captures

    EventDay ||--o{ AttendeeSession : scopes
    EventDay ||--o{ Rating : dates

    Vendor ||--o{ Rating : receives
    Vendor ||--o{ AwardNominee : nominated
    Vendor ||--o{ Award : wins
    Vendor ||--o{ RankSnapshot : snapshots

    AttendeeSession ||--o{ Rating : casts

    Award ||--o{ AwardNominee : lists
```

---

## 2. DETAILED MODEL DEFINITIONS

### `Event`
Represents the overarching 3-day festival.
* `id` (String, UUID, Primary Key)
* `name` (String, e.g. "Grand Food Fest Hyderabad 2026")
* `slug` (String, Unique)
* `startDate`, `endDate` (DateTime)
* `status` (String: `UPCOMING`, `LIVE`, `CLOSING`, `FINALIZED`)
* `ratingLimitPerAttendeePerDay` (Int, Default: 5)
* `minimumRatingsForLeaderboard` (Int, Default: 20)

### `EventDay`
Scopes voting quotas to calendar festival days.
* `id` (String, UUID, Primary Key)
* `eventId` (String, FK -> Event)
* `dayNumber` (Int, 1, 2, or 3)
* `date` (DateTime)
* `status` (String: `UPCOMING`, `LIVE`, `CLOSED`)

### `Vendor`
Represents participating festival stalls.
* `id` (String, UUID, Primary Key)
* `eventId` (String, FK -> Event)
* `name` (String, e.g. "Spice Route")
* `slug` (String)
* `description` (String, Optional)
* `category` (String, e.g. "Biryani & Pulao")
* `cuisine` (String, e.g. "Hyderabadi")
* `stallNumber` (String, e.g. "A-12")
* `vendorType` (String: `FOOD`, `LIFESTYLE`)
* `status` (String: `ACTIVE`, `PAUSED`, `CLOSED`)

### `AttendeeSession`
Tracks anonymous attendee identities per festival day.
* `id` (String, UUID, Primary Key)
* `eventId` (String, FK -> Event)
* `eventDayId` (String, FK -> EventDay)
* `passHash` (String, SHA-256 hash of normalized pass token)
* `passToken` (String, Original pass format e.g. `PASS-000001`)
* `lastSeenAt` (DateTime)
* **Unique Constraint**: `@@unique([passHash, eventDayId])`

### `Rating`
Core transactional rating record.
* `id` (String, UUID, Primary Key)
* `eventId` (String, FK -> Event)
* `eventDayId` (String, FK -> EventDay)
* `attendeeSessionId` (String, FK -> AttendeeSession)
* `vendorId` (String, FK -> Vendor)
* `rating` (Int, 1 to 5)
* `isValid` (Boolean, Default: true)
* `idempotencyKey` (String, Optional)
* `createdAt`, `updatedAt` (DateTime)
* **Unique Constraint**: `@@unique([attendeeSessionId, vendorId, eventDayId])`

### `RankSnapshot`
Historical rankings persisted periodically for truthful rank movement tracking.
* `id` (String, UUID, Primary Key)
* `eventId` (String, FK -> Event)
* `vendorId` (String, FK -> Vendor)
* `rank` (Int)
* `score` (Float)
* `ratingsCount` (Int)
* `snapshotAt` (DateTime, Default: now())
* **Indexes**: `@@index([eventId, snapshotAt])`, `@@index([vendorId, snapshotAt])`

### `Award` & `AwardNominee`
Official festival honors separated from live scoring.
* `status`: `DRAFT`, `NOMINEES_REVEALED`, `WINNER_ANNOUNCED`

### `AnomalyLog`
Audit logs for suspicious rating spikes.
* `type`: `VELOCITY_SPIKE`, `OFF_HOURS_BURST`, `MONO_RATING_CLUSTER`
* `severity`: `LOW`, `MEDIUM`, `HIGH`
* `resolved`: Boolean

### `AdminUser`
Organizers with management privileges.
* `passwordHash`: Salted PBKDF2/Argon2 string (`salt:hash`).
* `role`: `SUPERADMIN`, `ADMIN`, `MODERATOR`

---

## 3. PRODUCTION MIGRATION (POSTGRESQL / SUPABASE)

To migrate from local SQLite to PostgreSQL:
1. Update `prisma/schema.prisma`:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
2. Set `DATABASE_URL` in `.env`:
   ```env
   DATABASE_URL="postgresql://user:password@host:5432/grandfoodfest?sslmode=require"
   ```
3. Run `npx prisma db push` or `npx prisma migrate deploy`.
