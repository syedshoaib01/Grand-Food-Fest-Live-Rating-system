# UI QA & RESPONSIVE AUDIT — GRAND FOOD FEST

This document details the responsive design standards, mobile viewport audit, and touch target verification.

---

## 1. TARGET MOBILE VIEWPORTS

The public consumer experience was audited and designed for the following mobile viewports:

| Device Viewport | Dimensions (px) | Primary Form Factor |
| :--- | :--- | :--- |
| **Compact Android** | `360 × 800` | Budget / Compact Android phones |
| **iPhone SE / Small iOS** | `375 × 812` | iPhone Mini, iPhone SE |
| **iPhone Standard** | `390 × 844` | iPhone 12, 13, 14, 15 |
| **Modern Pixel** | `393 × 873` | Google Pixel 7, 8 |
| **Large Android** | `412 × 915` | Samsung Galaxy S22+, S23+, Pixel Pro |
| **Large iPhone** | `430 × 932` | iPhone 14 Pro Max, 15 Pro Max |

---

## 2. RESPONSIVE DESIGN CHECKLIST

* [x] **No Horizontal Overflow**: All pages have `overflow-x: hidden` and flexible fluid grid/flex layouts.
* [x] **Touch Target Sizes**: All interactive buttons, star rating buttons, and navigation links have a minimum touch target of **44×44px**.
* [x] **Thumb-Friendly Bottom Navigation**: Fixed bottom bar (`Top 10`, `Explore`, `Rate`, `Awards`) positioned comfortably within thumb reach.
* [x] **Safe-Area Insets**: Uses `pb-safe` and `pb-20` on body to prevent content from being clipped by mobile home indicator bars or device notches.
* [x] **Readable Mobile Typography**:
  * Body: 14–16px (1.5 line-height)
  * Headings: 20–32px
  * Micro-labels: 10–12px with high contrast
* [x] **WCAG AA Contrast**: High-contrast charcoal text (`#1C1917`) on warm cream background (`#FAF8F5`) and crisp white surfaces.
