"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSession } from "@/lib/SessionContext";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Ticket,
  AlertCircle,
  Trophy,
  Search,
  X,
  Plus,
  Check,
  Star,
  Sparkles,
  Utensils,
  ChevronRight,
  Stamp,
} from "lucide-react";
import StarRating from "@/components/StarRating";

interface SelectedVendorItem {
  id: string;
  name: string;
  stall: string;
  category?: string;
  rating: number; // 0 = unrated, 1-5 = explicit rating
  isUpdate?: boolean;
}

function VoteContent() {
  const searchParams = useSearchParams();
  const preselectedVendorId = searchParams.get("vendorId");

  const {
    authenticated,
    passToken,
    remainingQuota,
    ratedCount,
    ratedVendors,
    loginWithPass,
    logout,
    refreshSession,
  } = useSession();

  // Pass verification state
  const [passInput, setPassInput] = useState(passToken || "");
  const [passError, setPassError] = useState<string | null>(null);
  const [isVerifyingPass, setIsVerifyingPass] = useState(false);

  // Vendor selection & rating state
  const [availableVendors, setAvailableVendors] = useState<any[]>([]);
  const [vendorSearch, setVendorSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedVendors, setSelectedVendors] = useState<SelectedVendorItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const isDevMode = process.env.NEXT_PUBLIC_DEV_MODE === "true";

  // Load available food vendors
  useEffect(() => {
    fetch("/api/vendors?type=FOOD&limit=120")
      .then((res) => res.json())
      .then((data) => {
        setAvailableVendors(data.vendors || []);
      })
      .catch(() => {});
  }, []);

  // Handle preselected vendor from URL (?vendorId=...)
  useEffect(() => {
    if (preselectedVendorId && availableVendors.length > 0) {
      const found = availableVendors.find((v) => v.id === preselectedVendorId);
      if (found) {
        setSelectedVendors((prev) => {
          if (prev.some((s) => s.id === found.id)) return prev;
          const prevRating = ratedVendors.find((r) => r.vendorId === found.id)?.rating || 0;
          return [
            {
              id: found.id,
              name: found.name,
              stall: found.stallNumber,
              category: found.category,
              rating: prevRating,
              isUpdate: prevRating > 0,
            },
          ];
        });
      }
    }
  }, [preselectedVendorId, availableVendors, ratedVendors]);

  // Handle Pass Verification
  const handleVerifyPass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passInput.trim()) {
      setPassError("Please enter your festival pass or wristband code.");
      return;
    }
    setIsVerifyingPass(true);
    setPassError(null);

    const result = await loginWithPass(passInput.trim());
    setIsVerifyingPass(false);

    if (!result.success) {
      setPassError(result.error || "This event pass could not be verified.");
    }
  };

  // Toggle Vendor Selection
  const toggleVendor = (v: any) => {
    if (selectedVendors.some((s) => s.id === v.id)) {
      setSelectedVendors(selectedVendors.filter((s) => s.id !== v.id));
      return;
    }

    const existingRatedIds = new Set(ratedVendors.map((r) => r.vendorId));
    const isNew = !existingRatedIds.has(v.id);
    const newVendorsInBatch = selectedVendors.filter((s) => !existingRatedIds.has(s.id)).length;

    if (isNew && ratedCount + newVendorsInBatch >= 5) {
      setSubmitError("You have used all 5 tasting stamps on your daily passport.");
      return;
    }

    setSubmitError(null);
    const prevScore = ratedVendors.find((r) => r.vendorId === v.id)?.rating || 0;

    setSelectedVendors([
      ...selectedVendors,
      {
        id: v.id,
        name: v.name,
        stall: v.stallNumber,
        category: v.category,
        rating: prevScore,
        isUpdate: prevScore > 0,
      },
    ]);
  };

  const handleRatingChange = (vendorId: string, stars: number) => {
    setSelectedVendors((prev) =>
      prev.map((s) => (s.id === vendorId ? { ...s, rating: stars } : s))
    );
  };

  const allExplicitlyRated =
    selectedVendors.length > 0 &&
    selectedVendors.every((s) => s.rating >= 1 && s.rating <= 5);

  const unratedCount = selectedVendors.filter((s) => s.rating === 0).length;

  const handleSubmitRatings = async () => {
    if (selectedVendors.length === 0) {
      setSubmitError("Please pick at least one stall to rate.");
      return;
    }

    if (!allExplicitlyRated) {
      setSubmitError("Please select 1 to 5 stars for every stall before stamping.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    const idempotencyKey =
      typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : `sub-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

    try {
      const res = await fetch("/api/voting/ratings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": idempotencyKey,
        },
        body: JSON.stringify({
          idempotencyKey,
          ratings: selectedVendors.map((s) => ({
            vendorId: s.id,
            rating: s.rating,
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to record ratings.");
      }

      setSubmissionSuccess(true);
      await refreshSession();
    } catch (e: any) {
      setSubmitError(e.message || "Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Categories extracted from vendors
  const availableCategories = ["All", ...Array.from(new Set(availableVendors.map((v) => v.category).filter(Boolean)))];

  const filteredVendors = availableVendors.filter((v) => {
    const matchesCat = selectedCategory === "All" || v.category === selectedCategory;
    const q = vendorSearch.trim().toLowerCase();
    if (!matchesCat) return false;
    if (!q) return true;
    return (
      v.name.toLowerCase().includes(q) ||
      v.stallNumber.toLowerCase().includes(q) ||
      (v.category && v.category.toLowerCase().includes(q)) ||
      (v.cuisine && v.cuisine.toLowerCase().includes(q))
    );
  });

  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Page Header */}
      <div className="space-y-1">
        <div className="inline-flex items-center gap-1 text-xs font-display font-black tracking-wider uppercase text-fest-terracotta">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Official Tasting Ballot</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-display font-black text-fest-charcoal tracking-tight">
          Festival Tasting Passport
        </h1>
        <p className="text-xs sm:text-sm text-fest-charcoalMuted">
          Score up to 5 food stalls today. Your ratings directly determine the official Top 10.
        </p>
      </div>

      {/* Success View */}
      {submissionSuccess ? (
        <div className="ticket-stub p-6 sm:p-8 border border-fest-border text-center space-y-5 shadow-card">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto border border-emerald-200 shadow-2xs">
            <Check className="w-7 h-7 stroke-[3]" />
          </div>

          <div className="space-y-1.5">
            <span className="stamp-badge text-emerald-800 border-emerald-800 text-xs">
              BALLOT STAMPED & VERIFIED
            </span>
            <h2 className="text-2xl font-display font-black text-fest-charcoal pt-2">
              Tasting Ratings Recorded!
            </h2>
            <p className="text-xs sm:text-sm text-fest-charcoalMuted max-w-sm mx-auto">
              Your votes have updated the festival live standings in real-time.
            </p>
            <p className="text-xs font-display font-extrabold text-fest-terracotta pt-2">
              {remainingQuota} of 5 tasting stamps remaining today
            </p>
          </div>

          <div className="flex flex-col gap-2.5 pt-3 max-w-xs mx-auto">
            <Link
              href="/leaderboard"
              className="w-full flex items-center justify-center gap-2 h-12 px-4 rounded-xl bg-gradient-to-r from-fest-terracotta to-fest-ember active:scale-[0.98] text-white font-display font-extrabold text-sm shadow-xs transition"
            >
              <Trophy className="w-4 h-4" />
              <span>View Updated Top 10</span>
            </Link>
            <button
              type="button"
              onClick={() => {
                setSubmissionSuccess(false);
                setSelectedVendors([]);
              }}
              className="w-full h-11 rounded-xl bg-fest-parchment hover:bg-fest-linen active:scale-[0.98] text-fest-charcoal font-display font-bold text-xs transition border border-fest-border"
            >
              Rate another stall
            </button>
          </div>
        </div>
      ) : !authenticated ? (
        /* Unauthenticated: Physical Wristband Pass Card */
        <div className="ticket-stub p-6 sm:p-7 border border-fest-border shadow-ticket space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-fest-parchment">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-fest-terracottaLight flex items-center justify-center text-fest-terracotta">
                <Ticket className="w-4 h-4" />
              </div>
              <div>
                <h2 className="font-display font-black text-sm text-fest-charcoal">
                  Connect Your Wristband
                </h2>
                <p className="text-[11px] text-fest-charcoalMuted">
                  Anonymous attendee pass • 100% private
                </p>
              </div>
            </div>
            <span className="text-[10px] font-mono font-bold bg-fest-parchment px-2 py-0.5 rounded border border-fest-border text-fest-charcoal">
              VENUE PASS
            </span>
          </div>

          <p className="text-xs text-fest-charcoalMuted leading-relaxed">
            Enter the 10-character code printed on your festival wristband or digital ticket token to unlock your 5 daily rating stamps.
          </p>

          {passError && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span className="font-medium">{passError}</span>
            </div>
          )}

          <form onSubmit={handleVerifyPass} className="space-y-3">
            <div>
              <label htmlFor="passInput" className="block text-[11px] font-display font-bold uppercase tracking-wider text-fest-charcoalMuted mb-1.5">
                Wristband / Ticket Code
              </label>
              <input
                id="passInput"
                type="text"
                value={passInput}
                onChange={(e) => setPassInput(e.target.value.toUpperCase())}
                placeholder="e.g. PASS-000001"
                autoComplete="off"
                className="w-full px-4 py-3 rounded-xl bg-fest-parchment/70 border border-fest-border text-fest-charcoal font-mono text-sm tracking-wider uppercase placeholder:text-fest-charcoalTertiary focus:outline-hidden focus:ring-2 focus:ring-fest-saffron focus:bg-white transition"
              />
            </div>

            <button
              type="submit"
              disabled={isVerifyingPass}
              className="w-full h-12 rounded-xl font-display font-extrabold bg-gradient-to-r from-fest-terracotta to-fest-ember hover:opacity-95 active:scale-[0.98] text-white text-sm shadow-xs transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <span>{isVerifyingPass ? "Checking Pass..." : "Unlock Tasting Passport"}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </form>

          {/* Development Quick Pass Switcher */}
          {isDevMode && (
            <div className="pt-3 border-t border-fest-parchment">
              <span className="text-[10px] font-display font-bold uppercase tracking-wider text-fest-charcoalTertiary block mb-2">
                Organizer Demo Passes (Click to test):
              </span>
              <div className="flex flex-wrap gap-1.5">
                {["PASS-000001", "PASS-000002", "PASS-000003", "PASS-000004", "PASS-000005"].map(
                  (demo) => (
                    <button
                      key={demo}
                      type="button"
                      onClick={() => {
                        setPassInput(demo);
                        loginWithPass(demo);
                      }}
                      className="px-2.5 py-1 rounded-lg text-[11px] font-mono bg-fest-parchment hover:bg-fest-saffronLight text-fest-charcoal hover:text-fest-saffronDark border border-fest-border transition active-press"
                    >
                      {demo}
                    </button>
                  )
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Authenticated: Tasting Passport Experience */
        <div className="space-y-5">
          {/* Physical Tasting Passport Card with 5 Punch Slots */}
          <div className="ticket-stub p-5 sm:p-6 border border-fest-border shadow-card space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-fest-parchment">
              <div>
                <span className="text-[10px] font-display font-black uppercase tracking-wider text-fest-terracotta">
                  OFFICIAL ATTENDEE PASSPORT
                </span>
                <h2 className="font-display font-extrabold text-base text-fest-charcoal">
                  {passToken?.startsWith("ATT-")
                    ? passToken
                    : passToken
                    ? `ATT-••••-${passToken.slice(-4)}`
                    : "Verified Attendee"}
                </h2>
              </div>

              <button
                type="button"
                onClick={async () => {
                  await logout();
                  setPassInput("");
                  setSelectedVendors([]);
                }}
                className="text-xs font-display font-bold text-fest-charcoalMuted hover:text-fest-charcoal px-2.5 py-1 rounded-lg bg-fest-parchment border border-fest-border transition active-press"
              >
                Switch Pass
              </button>
            </div>

            {/* 5 Tactile Punch Card Slots */}
            <div>
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="font-display font-bold text-fest-charcoal">
                  Today's Tasting Stamps
                </span>
                <span className="font-display font-extrabold text-fest-terracotta">
                  {ratedCount}/5 Used
                </span>
              </div>

              <div className="grid grid-cols-5 gap-2">
                {[0, 1, 2, 3, 4].map((slotIdx) => {
                  const ratedItem = ratedVendors[slotIdx];
                  const isFilled = slotIdx < ratedCount;
                  const stallNum = availableVendors.find((v) => v.id === ratedItem?.vendorId)?.stallNumber;

                  return (
                    <div
                      key={slotIdx}
                      className={`h-16 rounded-xl border-2 flex flex-col items-center justify-center p-1 text-center transition-all ${
                        isFilled
                          ? "bg-fest-saffronLight/70 border-fest-saffron text-fest-saffronDark shadow-2xs"
                          : "bg-fest-parchment/40 border-dashed border-fest-border text-fest-charcoalTertiary"
                      }`}
                    >
                      {isFilled ? (
                        <>
                          <Star className="w-4 h-4 fill-fest-turmeric text-fest-saffron" />
                          <span className="text-[10px] font-display font-black leading-tight mt-0.5 truncate w-full">
                            {ratedItem?.rating}★
                          </span>
                          <span className="text-[8px] font-mono text-fest-charcoalMuted truncate w-full">
                            {stallNum ? `Stall ${stallNum}` : ratedItem?.vendorName || "Rated"}
                          </span>
                        </>
                      ) : (
                        <>
                          <div className="w-5 h-5 rounded-full border border-dashed border-fest-border flex items-center justify-center text-[10px] font-mono">
                            {slotIdx + 1}
                          </div>
                          <span className="text-[9px] font-display font-semibold mt-0.5">
                            Open
                          </span>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {submitError && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span className="font-medium">{submitError}</span>
            </div>
          )}

          {/* Section: Stalls Selected for Rating */}
          {selectedVendors.length > 0 && (
            <div className="bg-white p-5 rounded-2xl border border-fest-border shadow-card space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-fest-parchment">
                <h3 className="font-display font-extrabold text-sm text-fest-charcoal flex items-center gap-2">
                  <span>Review Stalls</span>
                  <span className="px-2 py-0.5 rounded-full bg-fest-parchment text-[11px] font-bold text-fest-terracotta">
                    {selectedVendors.length}
                  </span>
                </h3>
                {unratedCount > 0 && (
                  <span className="text-[11px] font-bold text-fest-terracotta bg-fest-terracottaLight px-2 py-0.5 rounded-md">
                    {unratedCount} needs stars
                  </span>
                )}
              </div>

              <div className="space-y-3">
                {selectedVendors.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 rounded-xl bg-fest-parchment/60 border border-fest-border space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-display font-extrabold text-sm text-fest-charcoal">
                            {item.name}
                          </span>
                          <span className="font-display text-[10px] font-black text-fest-charcoal bg-white px-2 py-0.5 rounded border border-fest-border">
                            Stall {item.stall}
                          </span>
                        </div>
                        {item.category && (
                          <span className="text-[11px] text-fest-charcoalMuted">
                            {item.category}
                          </span>
                        )}
                        {item.isUpdate && (
                          <span className="ml-2 text-[10px] font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                            Updating today&apos;s score
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => toggleVendor(item)}
                        className="text-fest-charcoalTertiary hover:text-fest-charcoal p-1 rounded-lg hover:bg-white transition"
                        aria-label={`Remove ${item.name}`}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="pt-1">
                      <StarRating
                        value={item.rating}
                        size="md"
                        showLabel
                        onChange={(star) => handleRatingChange(item.id, star)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section: Stall Search & Picker */}
          <div className="bg-white p-5 rounded-2xl border border-fest-border shadow-card space-y-4">
            <div>
              <h3 className="font-display font-extrabold text-base text-fest-charcoal">
                Which Stalls Did You Taste?
              </h3>
              <p className="text-xs text-fest-charcoalMuted">
                Search stalls across stadium food zones to add to your ballot.
              </p>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-fest-charcoalTertiary absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={vendorSearch}
                onChange={(e) => setVendorSearch(e.target.value)}
                placeholder="Search by stall name, number (e.g. Spice Route, 042)..."
                className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-fest-parchment/60 border border-fest-border text-xs text-fest-charcoal placeholder:text-fest-charcoalTertiary focus:outline-hidden focus:ring-2 focus:ring-fest-saffron focus:bg-white transition"
              />
              {vendorSearch && (
                <button
                  type="button"
                  onClick={() => setVendorSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-fest-charcoalTertiary hover:text-fest-charcoal p-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Category Filter Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
              {availableCategories.slice(0, 8).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1 rounded-lg text-xs font-display font-bold whitespace-nowrap transition active-press ${
                    selectedCategory === cat
                      ? "bg-fest-charcoal text-white shadow-2xs"
                      : "bg-fest-parchment text-fest-charcoalMuted hover:text-fest-charcoal border border-fest-border"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Vendor List */}
            <div className="max-h-64 overflow-y-auto divide-y divide-fest-parchment border border-fest-border rounded-xl bg-white">
              {filteredVendors.length === 0 ? (
                <div className="p-6 text-center text-xs text-fest-charcoalMuted">
                  No food stalls found for &quot;{vendorSearch}&quot;
                </div>
              ) : (
                filteredVendors.slice(0, 35).map((v) => {
                  const isSelected = selectedVendors.some((s) => s.id === v.id);

                  return (
                    <div
                      key={v.id}
                      className={`p-3 sm:px-4 flex items-center justify-between text-xs transition ${
                        isSelected ? "bg-fest-saffronLight/40" : "hover:bg-fest-cream/60"
                      }`}
                    >
                      <div className="pr-2 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-display font-bold text-fest-charcoal truncate">
                            {v.name}
                          </span>
                          <span className="font-display text-[10px] font-black text-fest-charcoal bg-fest-parchment px-1.5 py-0.5 rounded border border-fest-border">
                            Stall {v.stallNumber}
                          </span>
                        </div>
                        <div className="text-[11px] text-fest-charcoalMuted mt-0.5 truncate">
                          {v.cuisine ? `${v.cuisine} • ${v.category}` : v.category}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => toggleVendor(v)}
                        className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-display font-bold transition active-press flex items-center gap-1 ${
                          isSelected
                            ? "bg-fest-charcoal text-white"
                            : "bg-fest-parchment hover:bg-fest-linen text-fest-charcoal border border-fest-border"
                        }`}
                      >
                        {isSelected ? (
                          <>
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                            <span>Added</span>
                          </>
                        ) : (
                          <>
                            <Plus className="w-3.5 h-3.5" />
                            <span>Add</span>
                          </>
                        )}
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Submit Action */}
          {selectedVendors.length > 0 && (
            <div className="pt-2">
              <button
                type="button"
                disabled={isSubmitting || !allExplicitlyRated}
                onClick={handleSubmitRatings}
                className="w-full h-13 rounded-2xl font-display font-black text-base bg-gradient-to-r from-fest-terracotta to-fest-ember hover:opacity-95 active:scale-[0.98] text-white shadow-ticket transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Stamp className="w-5 h-5" />
                <span>
                  {isSubmitting
                    ? "Stamping Ballot..."
                    : !allExplicitlyRated
                    ? "Select stars for each stall"
                    : `Stamp & Submit ${selectedVendors.length} Rating${selectedVendors.length === 1 ? "" : "s"}`}
                </span>
              </button>
              {!allExplicitlyRated && (
                <p className="text-[11px] font-medium text-center text-fest-terracotta mt-2">
                  ⚠️ Each stall must be explicitly scored 1 to 5 stars before stamping.
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function VotePage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-xl mx-auto px-4 py-12 text-center text-fest-charcoalMuted text-xs font-display">
          Opening Festival Passport...
        </div>
      }
    >
      <VoteContent />
    </Suspense>
  );
}
