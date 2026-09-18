# TROUBLESHOOTING SPECIFICATION — GRAND FOOD FEST

This guide diagnoses and resolves common operational, database, and authentication issues.

---

## 1. COMMON ISSUES & RESOLUTIONS

### Issue: "Active attendee session required. Please verify your event pass."
* **Cause**: Client attempted to submit ratings without an authenticated session cookie (`gff_session`).
* **Resolution**: Ensure user visits `/vote` and inputs a valid pass token (e.g. `PASS-000001`). Verify browser allows first-party cookies.

### Issue: "You have reached today's 5-vendor rating limit."
* **Cause**: Attendee has already rated 5 distinct food vendors on the current event day.
* **Resolution**: Explain that the daily limit is 5 stalls per day. Note that attendees can still re-rate/update any of their existing 5 rated stalls at any time today. Quota resets to 5 when the next event day opens.

### Issue: "Unauthorized. Administrator session required." (401)
* **Cause**: Attempting to access an `/api/admin/*` route without a valid `gff_admin` cookie or authorization header.
* **Resolution**: Log in via `/admin/login` to obtain a signed administrator cookie.

### Issue: "Invalid star rating (0)"
* **Cause**: Client submitted a rating with 0 stars.
* **Resolution**: The user must explicitly tap 1 to 5 stars before submitting.

### Issue: Leaderboard displays "—" for all vendors
* **Cause**: No historical `RankSnapshot` records exist for comparison yet.
* **Resolution**: Wait for the first snapshot interval or run `npx prisma db seed` to generate baseline snapshots.

### Issue: "Cannot find module './<chunk>.js'" on localhost:3000
* **Cause**: Running `npm run build` while `npm run dev` is active in the background overwrites development webpack chunks in `.next` with production artifacts.
* **Resolution**: Stop the dev server, purge the build cache, and restart:
  ```bash
  rm -rf .next
  npm run dev
  ```

