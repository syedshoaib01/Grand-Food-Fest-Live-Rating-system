# TESTING SPECIFICATION — GRAND FOOD FEST

This document catalogs the automated test suites, testing commands, and verification criteria.

---

## 1. RUNNING TESTS

The project uses **Vitest** for unit and integration testing.

```bash
# Run all tests once
npm test

# Run tests in watch mode
npm run test:watch
```

---

## 2. AUTOMATED TEST COVERAGE

### `src/tests/api-security.test.ts`
* **HMAC Session Signing**: Verifies that tokens are signed with SHA-256 and decoded accurately.
* **Tampering Rejection**: Verifies that forged signatures or modified payloads are rejected.
* **Deterministic Pass Hashing**: Verifies that identical pass tokens produce identical hashes without exposing raw strings.
* **Bayesian Balance**: Verifies that established vendors with high volume outrank low-volume novelty vendors.

### `src/tests/voting-engine.test.ts`
* **Anonymous Session Creation**: Valid pass tokens create sessions linked to active event days.
* **Pass Format Validation**: Invalid regex formats are rejected.
* **Explicit 1–5 Star Rating**: Valid ratings persist and update quota.
* **Range Validation**: 0 and 6 star ratings are rejected.
* **Atomic Upsert (Duplicate Handling)**: Rating the same stall on the same day updates the score in-place without incrementing quota.
* **Daily Quota Enforcement**: 5 distinct stalls succeed; 6th stall is rejected.
* **Multi-Day Reset**: Quota resets on next event day.
* **Lifestyle Vendor Rejection**: Stalls marked `LIFESTYLE` cannot receive food votes.
* **Inactive Vendor Rejection**: Paused/closed stalls are rejected.
* **Bayesian Formula Accuracy**: Validates mathematical score values.

### `src/tests/hardening-and-security.test.ts`
* **Salted Password Hashing**: PBKDF2 generates unique salts and verifies matching passwords.
* **`requireAdmin()` Server Gate**:
  * Unauthenticated requests return `401 Unauthorized`.
  * Tampered tokens return `401 Unauthorized`.
  * Non-admin roles return `403 Forbidden`.
  * Valid admin sessions return `authorized: true`.
* **Pass Anonymization**: Validates `ATT-••••-XXXX` masking.
* **Closed Event Day Rejection**: Votes rejected when day is closed.
* **Truthful Rank Movement**: Validates `RankSnapshot` lookups and formats `↑ X`, `↓ Y`, `—`, and `NEW`.
