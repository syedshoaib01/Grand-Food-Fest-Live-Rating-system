# ASSUMPTIONS & DESIGN DECISIONS — GRAND FOOD FEST

This document records the architectural assumptions, trade-offs, and deliberate decisions made in V1 hardening.

---

## 1. CORE ASSUMPTIONS

1. **Mobile as Primary Consumer Form Factor**:
   * Assumption: Over 95% of festival attendee interactions will occur on smartphones outdoors in daytime lighting.
   * Consequence: The design strictly prioritizes light warm cream surfaces (`#FAF8F5`), high-contrast charcoal typography, large touch targets, and thumb reach over complex desktop dashboards.

2. **Anonymous Pass Model over Accounts**:
   * Assumption: Attendees will not tolerate complex registration forms, SMS verification, or passwords while waiting in stall queues.
   * Consequence: Authentication relies on single-token wristband entry (`PASS-XXXXXX`), validated and converted into signed session cookies.

3. **Deferred Kiosk Scope**:
   * Assumption: Physical touch kiosks at the venue are tentative and unconfirmed.
   * Consequence: Kiosk UI remains functional at `/kiosk`, but design and engineering effort was not expended on kiosk hardware optimization in this iteration.

4. **Database Strategy**:
   * Assumption: SQLite is optimal for fast, zero-config local development and testing; PostgreSQL is the required target for multi-instance production deployment.
   * Consequence: Prisma schema is kept fully ANSI SQL compliant with standard UUID primary keys and composite unique constraints.

5. **Truthful Telemetry over Simulated Engagement**:
   * Assumption: Organizers and food stall owners require absolute integrity in ranking movements and trending labels.
   * Consequence: Synthetic `↑ 7 positions` simulator was removed; all movements are calculated from `RankSnapshot` comparisons.
