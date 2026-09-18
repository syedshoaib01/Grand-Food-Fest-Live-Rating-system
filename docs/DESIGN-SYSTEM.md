# DESIGN SYSTEM SPECIFICATION — GRAND FOOD FEST

This document catalogs the design system tokens, typography scales, color palettes, global z-index stacking hierarchy, layout architecture, and reusable component patterns for **Grand Food Fest Hyderabad 2026**.

---

## 1. DESIGN PHILOSOPHY

> **Apple-like simplicity + food festival warmth**

* **Restraint**: Remove one visual element before adding one.
* **Clarity**: The attendee must understand the screen within 3 seconds.
* **Ergonomics**: 44×44px minimum touch targets, one-handed mobile reach, safe-area inset protection.
* **Calm Aesthetic**: Warm cream base, white surfaces, charcoal text, restrained saffron/amber accents, soft shadows, zero neon/glassmorphism bloat.

---

## 2. GLOBAL STACKING & Z-INDEX SYSTEM

To prevent overlapping, visual collisions, and text-bleed bugs, all layers adhere strictly to this documented z-index scale:

| Layer Token | Tailwind Utility | Z-Index | Usage & Description |
| :--- | :--- | :--- | :--- |
| `content` | `z-content` | `0` | Default document flow, in-page grids, cards, tables, copy |
| `sticky` | `z-sticky` | `10` | In-page sub-navigation, category filter bars |
| `bottomNav` | `z-bottomNav` | `20` | Fixed mobile bottom tab bar (`BottomNav.tsx`) |
| `header` | `z-header` | `30` | Global festival navbar (`Navbar.tsx`) & mobile admin header |
| `devTools` | `z-devTools` | `40` | Developer toolbar (`DevBar.tsx`) |
| `backdrop` | `z-backdrop` | `50` | Fullscreen dimmed overlay for drawers and modals |
| `drawer` | `z-drawer` | `60` | Slide-in navigation drawer (`AdminLayout`) |
| `modal` | `z-modal` | `70` | Interactive modal dialogs (create/edit stall, awards) |
| `toast` | `z-toast` | `80` | Floating transient alerts and notifications |

---

## 3. LAYOUT SHELL ARCHITECTURE

The application shell establishes a predictable vertical stacking order in JSX:

```text
┌────────────────────────────────────────────────────────┐
│ DevBar (Document Flow, z-devTools: 40)                 │  ← Collapsed 28px, expands in flow
├────────────────────────────────────────────────────────┤
│ Navbar (Sticky Top-0, z-header: 30)                    │  ← Predictable 56px height
├────────────────────────────────────────────────────────┤
│                                                        │
│ Main Content (<main className="z-content: 0">)         │  ← Scrollable, overflow-x-hidden
│                                                        │
├────────────────────────────────────────────────────────┤
│ BottomNav (Fixed Bottom-0, z-bottomNav: 20, pb-safe)   │  ← Mobile only
└────────────────────────────────────────────────────────┘
```

### Key Layout Invariants:
1. **Zero Header Collision**: `DevBar` renders in normal document flow above `Navbar`. When scrolling, `DevBar` scrolls off naturally while `Navbar` hits `top: 0` and sticks cleanly. Expanding `DevBar` pushes `Navbar` down without covering it.
2. **Zero Horizontal Page Overflow**: `body` and `main` enforce `overflow-x-hidden w-full max-w-full`. Filter chips scroll horizontally within bounded, dedicated containers (`overflow-x-auto no-scrollbar w-full`).
3. **Admin Drawer Isolation**: On mobile, the admin drawer renders at `z-drawer: 60` with a solid opaque dark background (`#1C1917`) over a full-screen backdrop (`z-backdrop: 50`, `bg-black/80`). The underlying page cannot bleed through, and body scroll is locked. On desktop, it renders as a persistent `w-64` sidebar.

---

## 4. DESIGN TOKENS

### Color Tokens

#### Public Theme (Default Light)
* **Background (`--background`)**: `#FAF8F5` (Warm Cream)
* **Surface (`--surface`)**: `#FFFFFF` (Crisp White)
* **Surface Muted (`--surface-muted`)**: `#F5F3EF` (Warm Gray-White)
* **Text Primary (`--text-primary`)**: `#1C1917` (Charcoal / Stone 900)
* **Text Secondary (`--text-secondary`)**: `#78716C` (Warm Gray / Stone 500)
* **Text Tertiary (`--text-tertiary`)**: `#A8A29E` (Muted Stone 400)
* **Border (`--border`)**: `#E7E5E4` (Stone 200)
* **Border Subtle**: `#F5F3EF`

#### Accent & Semantic
* **Accent Saffron (`--accent`)**: `#D97706` (Amber 600)
* **Accent Orange**: `#EA580C` (Orange 600)
* **Accent Soft (`--accent-soft`)**: `#FEF3C7` (Amber 100)
* **Live / Success (`--success`)**: `#16A34A` (Emerald 600)
* **Error / Anomaly (`--error`)**: `#DC2626` (Red 600)

#### Admin Theme (Default Dark)
* **Admin Background**: `#121110` (Deep Warm Black)
* **Admin Surface (Cards & Drawer)**: `#1C1917` (Solid Opaque Charcoal)
* **Admin Surface Hover**: `#292524` (Stone 800)
* **Admin Border**: `#292524`
* **Admin Text Primary**: `#F5F5F4` (Stone 100)
* **Admin Text Muted**: `#A8A29E` (Stone 400)

---

### Typography Tokens (Inter)

| Token | Size / Line-Height | Weight | Usage |
| :--- | :--- | :--- | :--- |
| `display` | `36px–48px / 44px–56px` | `700 Bold` | Hero display headlines |
| `heading` | `24px / 32px` | `700 Bold` | Section headings (`How it works`, Leaderboard) |
| `title` | `18px / 24px` | `600 Semibold` | Vendor card titles, category headers |
| `title-sm` | `15px–16px / 22px` | `600 Semibold` | Sub-titles, table headers |
| `body-lg` | `16px / 24px` | `400 Regular` | Primary hero descriptions |
| `body` | `14px / 20px` | `400 Regular` | Standard descriptions and instructions |
| `body-sm` | `13px / 18px` | `400 Regular` | Compact metadata, input fields |
| `caption` | `11px–12px / 16px` | `500 Medium` | Badges, pills, stall numbers, timestamps |
| `mono` | `12px–14px / 18px` | `700 Bold` | Pass tokens (`PASS-000001`), stall codes (`A-12`) |

---

### Spacing Scale
Based on a strict 4/8-pixel grid:
`4px` (1), `8px` (2), `12px` (3), `16px` (4), `24px` (6), `32px` (8), `48px` (12), `64px` (16).

---

### Radius Scale
* `sm`: `8px` (Buttons, inputs, micro-pills)
* `md`: `12px` (Standard vendor cards, filter containers)
* `lg`: `16px` (Modals, hero cards, large surface cards)
* `full`: `9999px` (Status badges, avatar circles)

---

### Shadow Tokens
* `subtle` (`shadow-subtle`): `0 1px 2px 0 rgba(0, 0, 0, 0.03)` (Card resting state)
* `medium` (`shadow-medium`): `0 2px 8px -1px rgba(0, 0, 0, 0.05)` (Hover cards, active dropdowns)
* `overlay` (`shadow-overlay`): `0 20px 25px -5px rgba(0, 0, 0, 0.25)` (Modals)
* `drawer` (`shadow-drawer`): `0 25px 50px -12px rgba(0, 0, 0, 0.4)` (Mobile slide-in drawer)

---

## 5. INTERACTION STATES

All interactive components implement clear visual feedback across all states:

1. **Default**: Clean surface, high-contrast text, subtle border.
2. **Hover**: Border darkens slightly (`hover:border-stone-300`), text shifts to accent, subtle shadow lift.
3. **Pressed (Active)**: Micro-scale feedback (`active:scale-[0.98]`).
4. **Selected**: Saffron/amber highlight, solid background or border accent.
5. **Focus**: Visible accessible focus ring (`focus-visible:ring-2 focus-visible:ring-amber-500`).
6. **Disabled**: Reduced opacity (`opacity-40`), cursor not allowed (`cursor-not-allowed`).
7. **Loading**: Smooth spinner animation or pulsing skeleton placeholder.
8. **Success**: Emerald pill with checkmark icon (`#16A34A`).
9. **Error**: Red alert box with warning icon (`#DC2626`).

---

## 6. COMPONENT SPECIFICATIONS

### Star Rating (`StarRating.tsx`)
* **Touch Targets**: Minimum **44×44px** per star button.
* **Initial State**: Newly selected unrated stalls start at **0 stars** (`no rating selected`).
* **Selected State**: Warm filled stars with explicit labels (`1 Poor`, `2 Fair`, `3 Good`, `4 Very Good`, `5 Excellent`).

### Mobile Bottom Navigation (`BottomNav.tsx`)
* **Height**: `h-14` (56px) + `pb-safe`.
* **Stacking**: `fixed bottom-0 left-0 right-0 z-bottomNav` (z-20).
* **4 Tabs**: `Top 10`, `Explore`, `Rate`, `Awards`.
* **Active Style**: Saffron text & icon highlight; quiet inactive stone gray.

### Global Header (`Navbar.tsx`)
* **Height**: Predictable `h-14` (56px).
* **Stacking**: `sticky top-0 z-header` (z-30).
* **Content**: Monogram / Logo, `GRAND FOOD FEST HYDERABAD 2026`, live day badge, attendee pass & quota badge.

### Developer Toolbar (`DevBar.tsx`)
* **Stacking**: Normal document flow at top of layout (`relative z-devTools: 40`).
* **Appearance**: Dark technical styling (`bg-stone-900 border-b border-stone-800 text-stone-300`).
* **Collapsed**: 28px thin strip with summary and expand toggle.
* **Expanded**: Document flow accordion that cleanly pushes header down without overlap.
* **Production**: Completely absent when `NEXT_PUBLIC_DEV_MODE="false"`.

### Admin Mobile Drawer (`AdminLayout`)
* **Stacking**: Backdrop at `z-backdrop: 50`, Drawer at `z-drawer: 60`.
* **Surface**: Solid opaque `#1C1917` with `shadow-2xl`.
* **Dismissal**: Backdrop tap, `✕` button, `Escape` key.
* **Scroll Lock**: Body scroll locked while open.

---

## 7. MOBILE VIEWPORT CERTIFICATION

The design system has been calibrated and verified against all standard smartphone viewports:
* `360 × 800` (Small Android)
* `375 × 812` (iPhone X / mini)
* `390 × 844` (iPhone 12 / 13 / 14)
* `393 × 873` (Pixel 7)
* `412 × 915` (Samsung Galaxy S22+)
* `430 × 932` (iPhone 14 / 15 Pro Max)
