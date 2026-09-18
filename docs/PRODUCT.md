# PRODUCT SPECIFICATION — GRAND FOOD FEST HYDERABAD 2026

## 1. VISION & PURPOSE

Grand Food Fest (October 9–11, 2026, Gachibowli Stadium, Hyderabad) is South India's largest outdoor culinary festival. With over 160 food and lifestyle stalls, the festival needed an authentic, high-speed, live evaluation system that allows tens of thousands of attendees to vote for their favorite dishes while walking through the stadium.

The system replaces subjective paper ballots and biased social media polls with a **live, confidence-adjusted rating engine** and truthful real-time leaderboards.

---

## 2. CANONICAL PLATFORM PRIORITY: SMARTPHONES

The **primary consumer interface is mobile phones**. Attendees browse, taste, and vote while outdoors, walking through crowded stadium food zones, holding food or beverages in one hand.

### Key Mobile Design Principles:
* **One-handed thumb reach**: Essential CTAs and star rating controls are located within comfortable reach of the thumb.
* **Instant visual clarity**: No walls of text or complex dashboard panels.
* **Zero friction**: No mandatory passwords, email verification, or phone OTPs. Attendees identify using their event pass / wristband token (e.g. `PASS-000001`).
* **Instant feedback**: Votes register instantly with clear visual progress (`X of 5 votes left today`).
* **Bottom Navigation**: Mobile viewports feature a dedicated bottom navigation bar (`Top 10`, `Explore`, `Rate`, `Awards`).

---

## 3. CORE PRODUCT RULES

```text
EVENT:                  Grand Food Fest
LOCATION:               Gachibowli Stadium, Hyderabad
DATES:                  October 9–11, 2026 (3 Days)
PRIMARY ENTITY:         Food Vendors / Stalls (120+ stalls)
SECONDARY ENTITY:       Lifestyle Stalls (40+ stalls, not eligible for food rating)
RATING SCALE:           1 to 5 stars (integer)
DAILY VOTING QUOTA:     Maximum 5 distinct food vendors per attendee session per day
DUPLICATES:             One active rating per attendee + vendor + day (updates existing vote)
MULTI-DAY:              Daily quota resets automatically on each new festival day
IDENTITY MODEL:         Anonymous event-pass / session token (PASS-XXXXXX in dev)
LEADERBOARD:            Top 10 food vendors
MINIMUM THRESHOLD:      20 verified ratings required for official Top 10 eligibility
RANKING ALGORITHM:      Confidence-adjusted Bayesian scoring
TRENDING ENGINE:        Actual rating velocity in a rolling 30-minute window
AWARDS SUITE:           Configurable official festival honors separated from live leaderboard
EXPORTS:                CSV and JSON formats with anonymized attendee identifiers
```

---

## 4. PRODUCT LOOP

The central attendee loop during the festival is:

```text
   DISCOVER (Explore stalls by zone, cuisine, and stall number)
      ↓
     EAT (Sample authentic dishes at the stadium)
      ↓
     RATE (Tap 1–5 stars for up to 5 stalls per day)
      ↓
   SEE WHAT'S WINNING (Watch the live Top 10 recalculate)
      ↓
   DISCOVER AGAIN (Try the next trending dish)
```

---

## 5. KIOSK SCOPE (DEFERRED)

Kiosk hardware deployment is unconfirmed by organizers. The `/kiosk` route exists and functions, but kiosk-specific hardware optimization is treated as future scope. The product is strictly optimized around attendee smartphones.
