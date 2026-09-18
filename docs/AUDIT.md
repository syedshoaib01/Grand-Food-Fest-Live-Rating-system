# Technical Audit — Grand Food Fest Live Rating Platform

This audit document evaluates the codebase of the Grand Food Fest Live Rating Platform V1, identifying architectural strengths, security vulnerabilities, business logic bugs, UX limitations, and remediation actions.

---

## 1. System Overview & Architecture Strengths
- **Tech Stack**: Next.js 14 App Router, TypeScript, Tailwind CSS, Prisma ORM, Vitest.
- **Relational Integrity**: Strong relational data model with composite unique constraints on `(attendeeSessionId, vendorId, eventDayId)`.
- **Stateless Anonymous Voter Model**: Pass tokens are salted and hashed (SHA-256) into anonymous sessions without storing attendee PII (no names, phones, or emails).
- **Quota Transactionality**: Server-side Prisma transactions enforce the 5-vendor daily limit and same-day upsert logic.
- **Confidence-Adjusted Scoring**: Bayesian average prevents low-volume stalls with 5.0 averages from dominating stalls with hundreds of authentic votes.

---

## 2. Identified Vulnerabilities & Correctness Bugs

### A. Critical Security Flaws: Unprotected Admin Endpoints
- **Issue**: `/api/admin/analytics`, `/api/admin/settings`, `/api/admin/ratings`, `/api/admin/anomalies`, `/api/admin/awards`, `/api/admin/exports/[type]`, as well as `POST /api/vendors` and `PUT/PATCH /api/vendors/[id]` lacked server-side admin authentication checks. An attacker could curl `/api/admin/analytics` or trigger exports anonymously.
- **Remediation**: Implement a unified, reusable `requireAdmin(req: NextRequest)` helper and enforce it across all admin and vendor modification handlers.

### B. Admin Password Security & Hardcoded Secrets
- **Issue**: Admin authentication accepted a hardcoded `admin123` fallback, compared plaintext strings, and pre-filled credentials on `/admin/login`.
- **Remediation**: Implement salted PBKDF2/scrypt cryptographic password hashing and verification. Require explicit environment variables for admin setup. Remove pre-filled credentials from login UI.

### C. Client Session Impersonation Risk
- **Issue**: In `POST /api/voting/ratings`:
  ```typescript
  if (!sessionId && body.sessionId) {
    sessionId = body.sessionId;
  }
  ```
  Allowing untrusted request-body `sessionId` enables an attacker to submit ratings on behalf of another attendee session.
- **Remediation**: Session identity must strictly be resolved from the cryptographically verified HMAC session token (`gff_session` cookie or validated header), never from an unverified body payload.

### D. Raw Ticket Pass Token Exposure
- **Issue**: Admin ratings inspector and raw exports exposed unmasked `passToken` values (e.g. `PASS-000123`).
- **Remediation**: Sanitize and anonymize pass tokens for display and export (e.g. `ATT-••••-3F91`) while keeping raw tokens exclusively within development mode.

### E. Simulated / Fake Rank Movement
- **Issue**: `src/lib/ranking-engine.ts` generated synthetic rank deltas based on recent vote counts rather than actual historical rank movement.
- **Remediation**: Introduce a `RankSnapshot` database model to store periodic/rolling leaderboard positions. Compute real rank deltas (`↑ 3`, `↓ 2`, `—`, `NEW`) by comparing current rankings against previous real snapshots.

### F. Rating Default Bug (Voting UX)
- **Issue**: When selecting a new unrated vendor, the UI defaulted to 5 stars instead of requiring an explicit attendee choice.
- **Remediation**: Initialize new vendors with `0` stars (`no rating selected`). Disable the submit action until every selected stall has received an explicit 1–5 star rating.

### G. Visual Aesthetic & Mobile Ergonomics
- **Issue**: Dark, dense glassmorphic styling was oriented toward a desktop SaaS dashboard rather than an outdoor mobile festival attendee. Technical jargon like "Bayesian score" and "telemetry" was exposed to visitors.
- **Remediation**: Redesign with a warm festival palette (cream, white cards, warm amber, saffron, charcoal text), Inter typography, thumb-friendly mobile bottom navigation, and accessible, simple language.

---

## 3. Remediation Roadmap

| Category | Action | Priority | Status |
|---|---|---|---|
| Security | Enforce `requireAdmin()` on all admin APIs | CRITICAL | In Progress |
| Security | Salted cryptographic password hashing | CRITICAL | In Progress |
| Security | Reject client-forged session IDs | HIGH | In Progress |
| Privacy | Mask pass tokens in admin views & exports | HIGH | In Progress |
| Correctness | Implement `RankSnapshot` for real rank movement | HIGH | In Progress |
| Correctness | Fix 5-star default bug; enforce explicit star ratings | HIGH | In Progress |
| Mobile UX | Warm festival color system & Inter typography | HIGH | In Progress |
| Mobile UX | Thumb-friendly bottom nav & simplified hero | HIGH | In Progress |
| Testing | Expand security and ranking test suites | MEDIUM | In Progress |
| Documentation | Create `context.md`, `AGENTS.md`, and 21 `docs/` | HIGH | In Progress |
