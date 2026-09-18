# API SPECIFICATION — GRAND FOOD FEST

This document catalogs all endpoints, parameters, authentication requirements, and response structures.

---

## 1. PUBLIC CONSUMER APIS

### `GET /api/event`
Returns active festival details and current day status.
* **Auth**: None
* **Response `200 OK`**:
  ```json
  {
    "event": {
      "id": "uuid",
      "name": "Grand Food Fest Hyderabad 2026",
      "status": "LIVE",
      "ratingLimitPerAttendeePerDay": 5,
      "minimumRatingsForLeaderboard": 20
    },
    "activeDay": {
      "id": "uuid",
      "dayNumber": 1,
      "date": "2026-10-09T00:00:00.000Z",
      "status": "LIVE"
    }
  }
  ```

### `GET /api/leaderboard`
Returns the real-time official Top 10 food leaderboard and full ranked list.
* **Auth**: None
* **Response `200 OK`**:
  ```json
  {
    "top10": [
      {
        "rank": 1,
        "vendorId": "uuid",
        "name": "Spice Route",
        "slug": "spice-route",
        "category": "Biryani & Pulao",
        "cuisine": "Hyderabadi",
        "stallNumber": "A-12",
        "ratingAverage": 4.82,
        "ratingCount": 642,
        "rankingScore": 4.795,
        "rankChange": 2,
        "trendFormatted": "↑ 2",
        "isTied": false,
        "isEligibleForLeaderboard": true
      }
    ],
    "totalVotesCounted": 1866,
    "festivalAverage": 4.62
  }
  ```

### `GET /api/trending?window=30&limit=6`
Returns food stalls experiencing the highest rating velocity in the last 30 minutes.
* **Auth**: None
* **Parameters**: `window` (minutes, default 30), `limit` (count, default 6)
* **Response `200 OK`**:
  ```json
  {
    "trending": [
      {
        "vendorId": "uuid",
        "name": "Spice Route",
        "recentRatingCount": 42,
        "recentAverage": 4.8,
        "velocityLabel": "+42 ratings in 30 min",
        "surgeReason": "+42 ratings in last 30 min (avg 4.8★)"
      }
    ]
  }
  ```

### `GET /api/vendors`
Paginated stall directory with category, cuisine, and search filtering.
* **Parameters**: `search`, `category`, `cuisine`, `type` (`FOOD` / `LIFESTYLE`), `page`, `limit`

### `GET /api/vendors/[id]`
Returns stall profile, average rating, rating count, live rank, and 5★ to 1★ rating distribution percentages.

### `GET /api/awards`
Returns festival honors with status `NOMINEES_REVEALED` or `WINNER_ANNOUNCED`.

### `POST /api/voting/verify`
Identifies attendee using festival wristband/ticket token.
* **Request Body**: `{ "passToken": "PASS-000001" }`
* **Response `200 OK`**: Sets `gff_session` HTTP-only signed cookie.

### `GET /api/voting/session`
Returns authenticated attendee's remaining daily quota and stalls rated today.
* **Auth**: Signed `gff_session` cookie required.

### `POST /api/voting/ratings`
Records 1 to 5 star ratings.
* **Auth**: Signed `gff_session` cookie or valid `passToken` in body.
* **Request Body**:
  ```json
  {
    "ratings": [
      { "vendorId": "uuid-1", "rating": 5 },
      { "vendorId": "uuid-2", "rating": 4 }
    ]
  }
  ```
* **Status**: `200 OK` on success, `400 Bad Request` if quota exceeded or invalid stars, `401 Unauthorized` if session missing.

---

## 2. PROTECTED ADMIN APIS

Every `/api/admin/*` endpoint enforces `requireAdmin(req)`. Unauthorized requests receive `401 Unauthorized` or `403 Forbidden`.

* `POST /api/admin/auth`: Verifies salted PBKDF2 password, sets `gff_admin` cookie.
* `GET /api/admin/auth`: Returns admin session status.
* `DELETE /api/admin/auth`: Logs out admin, clears cookie.
* `GET /api/admin/analytics`: Real-time organizer telemetry and metrics.
* `GET /api/admin/settings`: Festival operational settings.
* `PUT /api/admin/settings`: Updates thresholds, switches active day, or finalizes event.
* `GET /api/admin/ratings`: Rating logs with attendee pass tokens anonymized (`ATT-••••-XXXX`).
* `PATCH /api/admin/ratings`: Toggles rating validity.
* `GET /api/admin/anomalies`: Flags velocity spikes and suspicious voting clusters.
* `POST /api/admin/anomalies`: Dismisses or invalidates suspicious batches.
* `POST /api/admin/awards`: Creates awards, reveals nominees, or announces winners.
* `GET /api/admin/exports/[type]`: Exports CSV or JSON for `leaderboard`, `vendors`, `ratings`, or `summary`.
* `POST /api/vendors`: Creates a new vendor.
* `PUT/PATCH /api/vendors/[id]`: Modifies vendor profile or toggles status (`ACTIVE`, `PAUSED`, `CLOSED`).
