# DATABASE SPECIFICATION — GRAND FOOD FEST

> **Authoritative Production Database**: **PostgreSQL hosted by Supabase** (PostgreSQL 17+ via Prisma ORM v5.22.0).  
> Schema Location: `prisma/schema.prisma`  
> Checked-in Migrations: `prisma/migrations/20260922104355_init/migration.sql`  
> Production Seed: `npm run db:seed:prod` (`prisma/seed-production.ts`)


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
* `id` (String, cuid, Primary Key)
* `name` (String, e.g. "Grand Food Fest Hyderabad 2026")
* `slug` (String, Unique index)
* `startDate`, `endDate` (DateTime)
* `status` (String: `UPCOMING`, `LIVE`, `CLOSING`, `FINALIZED`)
* `ratingLimitPerAttendeePerDay` (Int, Default: 5)
* `minimumRatingsForLeaderboard` (Int, Default: 20)

### `EventDay`
Scopes voting quotas to calendar festival days.
* `id` (String, cuid, Primary Key)
* `eventId` (String, FK -> Event, Cascade)
* `dayNumber` (Int: 1, 2, or 3)
* `date` (DateTime)
* `status` (String: `UPCOMING`, `LIVE`, `CLOSED`)
* **Constraints**: `@@unique([eventId, date])`
* **Indexes**: `@@index([eventId])`, `@@index([status])`

### `Vendor`
Represents participating festival stalls.
* `id` (String, cuid, Primary Key)
* `eventId` (String, FK -> Event, Cascade)
* `name` (String, e.g. "Spice Route")
* `slug` (String, Unique index)
* `description` (String, Nullable)
* `category` (String, e.g. "Biryani & Pulao", indexed)
* `cuisine` (String, Nullable, e.g. "Hyderabadi")
* `stallNumber` (String, e.g. "A-12")
* `vendorType` (String: `FOOD`, `LIFESTYLE`, indexed)
* `status` (String: `ACTIVE`, `PAUSED`, `CLOSED`, indexed)
* **Search Strategy**: Uses PostgreSQL `mode: "insensitive"` for case-insensitive keyword matching across all text fields.

### `AttendeeSession`
Tracks anonymous attendee identities per festival day.
* `id` (String, cuid, Primary Key)
* `eventId` (String, FK -> Event, Cascade)
* `eventDayId` (String, FK -> EventDay, Cascade)
* `passHash` (String, SHA-256 hash of normalized pass token + PASS_SALT)
* `passToken` (String, Stored strictly as masked identifier e.g. `ATT-••••-0001`)
* `lastSeenAt` (DateTime, used as serialization row-lock target)
* **Constraints**: `@@unique([passHash, eventDayId])`
* **Indexes**: `@@index([eventId])`, `@@index([eventDayId])`

### `Rating`
Core transactional rating record.
* `id` (String, cuid, Primary Key)
* `eventId` (String, FK -> Event, Cascade)
* `eventDayId` (String, FK -> EventDay, Cascade)
* `attendeeSessionId` (String, FK -> AttendeeSession, Cascade)
* `vendorId` (String, FK -> Vendor, Cascade)
* `rating` (Int, strictly 1 to 5)
* `isValid` (Boolean, Default: true, indexed)
* `idempotencyKey` (String, Nullable, indexed by session)
* `createdAt`, `updatedAt` (DateTime)
* **Constraints**: `@@unique([attendeeSessionId, vendorId, eventDayId])` (enforces 1 rating per attendee per vendor per day)
* **Indexes**: `@@index([eventId])`, `@@index([eventDayId])`, `@@index([vendorId])`, `@@index([createdAt])`, `@@index([isValid])`

### `RankSnapshot`
Historical rankings persisted periodically for truthful rank movement tracking.
* `id` (String, cuid, Primary Key)
* `eventId` (String, FK -> Event, Cascade)
* `vendorId` (String, FK -> Vendor, Cascade)
* `rank` (Int)
* `score` (Float, Bayesian weighted score)
* `ratingsCount` (Int)
* `snapshotAt` (DateTime, Default: now())
* **Indexes**: `@@index([eventId, snapshotAt])`, `@@index([vendorId, snapshotAt])`

### `Award` & `AwardNominee`
Official festival honors separated from live scoring.
* `Award.status`: `DRAFT`, `NOMINEES_REVEALED`, `WINNER_ANNOUNCED`
* `AwardNominee`: `@@unique([awardId, vendorId])`

### `AnomalyLog`
Audit logs for suspicious rating spikes.
* `type`: `VELOCITY_SPIKE`, `OFF_HOURS_BURST`, `MONO_RATING_CLUSTER`
* `severity`: `LOW`, `MEDIUM`, `HIGH`
* `resolved`: Boolean (indexed)
* `resolvedBy`: Authenticated admin email (e.g. `lead-organizer@grandfoodfest.com`)

### `AdminUser`
Organizers with management privileges.
* `passwordHash`: Salted PBKDF2 string (`salt:hash`, 100k rounds SHA-512)
* `role`: `SUPERADMIN`, `ADMIN`

---

## 3. PRISMA MIGRATION WORKFLOW

### Checked-in Migrations
The repository tracks all schema evolutions in version-controlled SQL files:
```text
prisma/migrations/
└── 20260922104355_init/
    └── migration.sql
```

### Commands:
* **Apply Migrations to Staging/Production**:
  ```bash
  npm run db:migrate
  # Executes: npx prisma migrate deploy
  ```
* **Generate New Migration during Development**:
  ```bash
  npm run db:migrate:dev -- --name change_description
  # Executes: npx prisma migrate dev
  ```
* **Reset Database (Dev Only)**:
  ```bash
  npm run db:reset
  # Recreates clean database, applies all migrations, and runs seed
  ```

---

## 4. CONCURRENCY & ROW-LEVEL LOCKING ARCHITECTURE

To strictly guarantee that an attendee cannot exceed 5 distinct food vendor ratings per day under parallel requests:
1. Every rating submission executes inside an interactive transaction: `prisma.$transaction(async (tx) => { ... })`.
2. The transaction initiates with a row-level update on the attendee's session record:
   ```typescript
   await tx.attendeeSession.update({
     where: { id: session.id },
     data: { lastSeenAt: new Date() },
   });
   ```
3. In PostgreSQL (default `Read Committed` isolation level), this statement acquires an exclusive row write lock (`FOR UPDATE` equivalent).
4. Any concurrent rating requests arriving for the same attendee session block and wait for the first transaction to complete.
5. Upon acquiring the lock, the second transaction reads the committed rating count and immediately rejects the 6th vendor submission with `QUOTA_EXCEEDED (400)`.
6. Verified under stress testing in `src/tests/concurrency-quota.test.ts`.

---

## 5. CONNECTION STRATEGY & POOLING

### Environment Variables:
```env
# Runtime connection string (supports connection poolers like PgBouncer / Supabase pooler)
DATABASE_URL="postgresql://user:password@host:6543/grandfoodfest?pgbouncer=true&connection_limit=40"

# Direct connection string (required for Prisma migrations and schema operations)
DIRECT_URL="postgresql://user:password@host:5432/grandfoodfest?sslmode=require"
```

### Connection Limits:
* Set `connection_limit=40` and `pool_timeout=15` in `DATABASE_URL` for high-throughput Next.js deployment.
* Next.js serverless instances reuse connections through the shared global Prisma Client singleton in `src/lib/prisma.ts`.

---

## 6. BACKUP & DISASTER RECOVERY

* **Daily Snapshot**: Execute before event gates open (12:00 PM IST):
  ```bash
  pg_dump -h $DB_HOST -U $DB_USER -d grandfoodfest -Fc > gff_backup_$(date +%Y%m%d).dump
  ```
* **Continuous WAL Archiving**: Recommended via AWS RDS Point-in-Time Recovery or Supabase PITR.
* **Restore Command**:
  ```bash
  pg_restore -h $DB_HOST -U $DB_USER -d grandfoodfest -c gff_backup_YYYYMMDD.dump
  ```

---

## 7. LOCAL DEVELOPMENT ALTERNATIVE (SQLITE)

For lightweight offline local development without a local PostgreSQL daemon:
* The SQLite schema is archived at `prisma/schema.sqlite.prisma`.
* Standard development runs against local PostgreSQL 16 on `localhost:5432`.
