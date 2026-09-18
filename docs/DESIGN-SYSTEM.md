# DESIGN SYSTEM SPECIFICATION — GRAND FOOD FEST

This document catalogs the design system tokens, typography scales, color palettes, and reusable component patterns.

---

## 1. TYPOGRAPHY SYSTEM

* **Primary Font**: **Inter** via `next/font/google` (`--font-inter`).
* **Weights**:
  * `400 Regular` (Body copy)
  * `500 Medium` (Secondary text, metadata)
  * `600 Semibold` (Buttons, navigation, card labels)
  * `700 Bold` (Card titles, section headings)
  * `800/900 Extrabold` (Hero titles, rank numbers)

### Mobile Scale:
* **Body**: `14px / 20px` to `16px / 24px`
* **Metadata & Secondary**: `11px–12px / 16px`
* **Card Titles**: `16px / 22px`
* **Section Headings**: `20px–24px / 28px–32px`
* **Hero Headline**: `30px–36px / 38px–44px`
* **Leaderboard Rank**: `16px–24px` (monospaced)
* **Leaderboard Score**: `16px–20px` (monospaced)

---

## 2. COLOR PALETTE

### Base Palette (Warm Festival Consumer Theme)
* **Background (Cream)**: `#FAF8F5`
* **Surface (White)**: `#FFFFFF`
* **Surface Muted**: `#F5F3EF`
* **Border Default**: `#E7E5E4` (Stone 200)
* **Border Focus**: `#D6D3D1` (Stone 300)
* **Text Primary (Charcoal)**: `#1C1917` (Stone 900)
* **Text Secondary**: `#78716C` (Stone 500)

### Accents & Brand Moments
* **Saffron / Amber**: `#D97706` (Amber 600)
* **Warm Gold**: `#F59E0B` (Amber 500)
* **Gold Light**: `#FEF3C7` (Amber 100)
* **Warm Orange**: `#EA580C` (Orange 600)

### Semantic Colors
* **Live / Success**: `#16A34A` (Emerald 600) / Background: `#DCFCE7` (Emerald 100)
* **Warning / Anomaly**: `#D97706` (Amber 600) / Background: `#FEF3C7`
* **Error / Closed**: `#DC2626` (Red 600) / Background: `#FEE2E2`

---

## 3. SPACING & ELEVATION

* **Spacing Grid**: 4 / 8-based spacing system (`4px`, `8px`, `12px`, `16px`, `24px`, `32px`, `48px`, `64px`).
* **Card Radius**: `12px–16px` (`rounded-xl` or `rounded-2xl`).
* **Shadows**:
  * Card: `0 1px 3px 0 rgba(0, 0, 0, 0.05)`
  * Elevated: `0 4px 6px -1px rgba(0, 0, 0, 0.07)`
  * Bottom Nav: `0 -4px 12px rgba(0, 0, 0, 0.04)`

---

## 4. CORE COMPONENT PATTERNS

### Buttons
* **Primary**: `bg-amber-600 hover:bg-amber-700 text-white font-bold py-3.5 px-6 rounded-xl active:scale-[0.98]`
* **Secondary**: `bg-white hover:bg-stone-50 border border-stone-300 text-stone-800 font-semibold py-3.5 px-6 rounded-xl`
* **Micro-Action (+ Add)**: `px-3 py-1.5 rounded-lg text-xs font-bold bg-stone-100 hover:bg-stone-200 text-stone-800`

### Rating Control (`StarRating`)
* 5 large star buttons with minimum **44×44px touch targets**.
* Unselected state: `☆ ☆ ☆ ☆ ☆` with label `"No rating selected"`.
* Selected state: Filled saffron/gold stars with descriptive labels (`1 • Poor`, `2 • Fair`, `3 • Good`, `4 • Very Good`, `5 • Excellent!`).

### Bottom Navigation (`BottomNav`)
* Fixed to mobile bottom (`md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-stone-200 pb-safe`).
* 4 navigation destinations: `Top 10`, `Explore`, `Rate` (primary center CTA with quota badge), `Awards`.

### Leaderboard Rows (`LeaderboardTable`)
* Mobile scanning hierarchy:
  1. Rank (01, 02...) with distinct gold crown badge for #1.
  2. Stall name & stall number pill.
  3. Star score (e.g. ⭐ 4.82) & rating count.
  4. Movement indicator (`↑ 2`, `↓ 1`, `—`, `NEW`).
