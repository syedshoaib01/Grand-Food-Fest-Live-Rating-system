# REST API Specification — Grand Food Fest Live Rating Platform

All API routes are served under `/api/*` and return JSON payloads.

---

## 1. Event & Configuration
### `GET /api/event`
Returns active festival configuration, currently active event day, and all configured days.
- **Response `200 OK`**:
  ```json
  {
    "event": {
      "id": "cuid...",
      "name": "Grand Food Fest Hyderabad 2026",
      "slug": "grand-food-fest-hyd-2026",
      "status": "LIVE",
      "ratingLimitPerAttendeePerDay": 5,
      "minimumRatingsForLeaderboard": 20
    },
    "activeDay": {
      "id": "cuid...",
      "dayNumber": 1,
      "date": "2026-10-09T00:00:00.000Z",
      "status": "LIVE"
    },
    "days": [...]
  }
  ```

---

## 2. Vendors Directory
### `GET /api/vendors`
Search and filter participating stalls with aggregated rating metrics.
- **Query Parameters**:
  - `search`: string (vendor name, stall number, cuisine)
  - `category`: string (e.g. "Biryani & Pulao")
  - `type`: `"FOOD"` | `"LIFESTYLE"` | `"ALL"` (default: `"FOOD"`)
  - `status`: `"ACTIVE"` | `"ALL"` (default: `"ACTIVE"`)
  - `page`: integer (default: 1)
  - `limit`: integer (default: 60)
- **Response `200 OK`**:
  ```json
  {
    "vendors": [
      {
        "id": "cuid...",
        "name": "Spice Route",
        "slug": "spice-route",
        "stallNumber": "A-01",
        "category": "Biryani & Pulao",
        "cuisine": "Hyderabadi",
        "ratingCount": 82,
        "ratingAverage": 4.88,
        "status": "ACTIVE"
      }
    ],
    "pagination": { "page": 1, "limit": 60, "total": 124, "totalPages": 3 },
    "categories": ["Biryani & Pulao", "Kebabs & Tandoor", "Desserts & Ice Cream", ...]
  }
  ```

### `GET /api/vendors/[id]`
Returns full vendor profile, 5★ to 1★ rating distribution, live rank, and award nominations.
- **Response `200 OK`**:
  ```json
  {
    "vendor": { ... },
    "stats": {
      "totalRatings": 82,
      "averageRating": 4.88,
      "rank": 1,
      "trend": "↑ 2",
      "isEligibleForLeaderboard": true,
      "distribution": { "5": 64, "4": 14, "3": 4, "2": 0, "1": 0 },
      "percentages": { "5": 78, "4": 17, "3": 5, "2": 0, "1": 0 }
    },
    "nominations": [ ... ],
    "awardsWon": [ ... ]
  }
  ```

---

## 3. Voter Identification & Voting Engine

### `POST /api/voting/verify`
Validates an event pass (or wristband token) and creates an anonymous session. Sets an `httpOnly` cookie (`gff_session`).
- **Request Body**:
  ```json
  { "passToken": "PASS-000001", "eventDayId": "optional-day-id" }
  ```
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "session": { "id": "cuid...", "passToken": "PASS-000001", "dayNumber": 1 },
    "limits": { "maxPerDay": 5, "ratedCountToday": 2, "remainingQuotaToday": 3 },
    "ratedVendorsToday": [ ... ]
  }
  ```

### `GET /api/voting/session`
Returns current session status, remaining quota for today, and previously rated vendors.

### `POST /api/voting/ratings`
Submits single or batch ratings. Validates star range (1–5), vendor eligibility (FOOD, ACTIVE), event status (LIVE), and quota (≤ 5 distinct vendors per day).
- **Headers**:
  - `Idempotency-Key`: optional UUID
- **Request Body**:
  ```json
  {
    "ratings": [
      { "vendorId": "v1_id", "rating": 5 },
      { "vendorId": "v2_id", "rating": 4 }
    ]
  }
  ```
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "message": "Your ratings have been recorded successfully!",
    "ratingsRecorded": 2,
    "updatedStatus": { ... }
  }
  ```
- **Error `400 Bad Request`**:
  ```json
  { "error": "You've reached today's 5-vendor rating limit." }
  ```

---

## 4. Live Leaderboard & Trending

### `GET /api/leaderboard`
Returns official Top 10 food vendors ranked by Bayesian confidence score.
- **Cache**: `s-maxage=15, stale-while-revalidate=30`
- **Response `200 OK`**:
  ```json
  {
    "top10": [
      {
        "rank": 1,
        "vendorId": "...",
        "name": "Spice Route",
        "ratingAverage": 4.88,
        "ratingCount": 82,
        "rankingScore": 4.7451,
        "trendFormatted": "↑ 2",
        "rankChange": 2,
        "isTied": false
      }
    ],
    "totalVotesCounted": 1825,
    "totalFoodVendors": 124,
    "festivalAverage": 4.41,
    "minimumRatingsThreshold": 20
  }
  ```

### `GET /api/trending`
Returns vendors with surging rating velocity over a rolling window (default 60 minutes).
- **Query Parameters**: `window` (minutes, default 60), `limit` (default 6)

---

## 5. Admin API

### `POST /api/admin/auth`
Logs in administrator. Sets secure `gff_admin` cookie.

### `GET /api/admin/analytics`
Telemetry: voter sessions today, ratings today, hourly velocity, #1 and #10 vendors, fastest rising, most rated.

### `GET & PATCH /api/admin/ratings`
Inspect raw rating telemetry and toggle `isValid` for suspicious records.

### `GET & POST /api/admin/anomalies`
Scan active ratings for velocity spikes; resolve or invalidate batches.

### `GET & POST /api/admin/awards`
Manage award categories, assign nominees, and declare winners.

### `GET /api/admin/exports/[type]?format=csv|json`
Downloads data exports for `leaderboard`, `vendors`, `ratings`, or `summary`.

### `PUT /api/admin/settings`
Updates active event day, festival status (`LIVE`, `CLOSING`, `FINALIZED`), and leaderboard thresholds.
