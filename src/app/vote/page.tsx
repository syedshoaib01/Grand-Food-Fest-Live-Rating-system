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
  Zap,
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
    loginWithName,
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
    fetch("/api/vendors?type=FOOD&limit=150")
      .then((res) => res.json())
      .then((data) => {
        setAvailableVendors(data.vendors || []);
      })
      .catch(() => {});
  }, []);

  // Handle preselected vendor from URL (?vendorId=...)
  useEffect(() => {
    if (preselectedVendorId && availableVendors.length > 0) {
      const found = availableVendors.find(
        (v) => v.id === preselectedVendorId || v.slug === preselectedVendorId
      );
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

  // Handle Name / Attendee Login
  const handleVerifyPass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passInput.trim()) {
      setPassError("Please enter your name to continue.");
      return;
    }
    setIsVerifyingPass(true);
    setPassError(null);

    const result = await loginWithName(passInput.trim());
    setIsVerifyingPass(false);

    if (!result.success) {
      setPassError(result.error || "Could not log in. Please try again.");
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
        <div className="inline-flex items-center gap-1.5 text-xs font-display font-black tracking-wider uppercase text-orange-600">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Official Tasting Ballot</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-display font-black text-slate-900 tracking-tight">
          Festival Tasting Passport
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Score up to 5 food stalls today. Your ratings directly determine the official Top 10.
        </p>
      </div>

      {/* Success View */}
      {submissionSuccess ? (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-emerald-200 text-center space-y-5 shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-200 shadow-2xs">
            <Check className="w-7 h-7 stroke-[2.5]" />
          </div>

          <div className="space-y-1.5">
            <span className="inline-block text-[11px] font-display font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              Ratings Recorded & Verified
            </span>
            <h2 className="text-xl font-display font-black text-slate-900">
              Tasting Ballot Stamped!
            </h2>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Your votes have been securely factored into the live Bayesian stadium leaderboard.
            </p>
          </div>

          <div className="flex flex-col gap-2.5 pt-3 max-w-xs mx-auto">
            <Link
              href="/leaderboard"
              className="w-full flex items-center justify-center gap-2 h-11 px-4 rounded-xl bg-orange-600 hover:bg-orange-700 active:scale-[0.98] text-white font-display font-bold text-xs tracking-wide shadow-xs transition"
            >
              <Trophy className="w-3.5 h-3.5 stroke-[2]" />
              <span>View Updated Top 10</span>
            </Link>
            <button
              type="button"
              onClick={() => {
                setSubmissionSuccess(false);
                setSelectedVendors([]);
              }}
              className="w-full h-11 rounded-xl bg-white hover:bg-slate-50 active:scale-[0.98] text-slate-700 font-display font-bold text-xs transition border border-slate-200"
            >
              Rate another stall
            </button>
          </div>
        </div>
      ) : !authenticated ? (
        /* Unauthenticated: Simple Attendee Name Entry */
        <div className="bg-white p-6 sm:p-7 rounded-3xl border border-orange-100 shadow-sm space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-600">
                <Utensils className="w-4 h-4 stroke-[2]" />
              </div>
              <div>
                <h2 className="font-display font-bold text-sm text-slate-900">
                  Enter Your Name
                </h2>
                <p className="text-[11px] text-slate-500">
                  Quick attendee check-in • Instant voting access
                </p>
              </div>
            </div>
            <span className="text-[10px] font-mono font-bold bg-orange-50 px-2.5 py-0.5 rounded-full border border-orange-200 text-orange-700">
              GACHIBOWLI
            </span>
          </div>

          <p className="text-xs text-slate-500 leading-relaxed">
            Enter your name to unlock your 5 daily tasting stamps and rate stalls across the stadium.
          </p>

          {passError && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2.5 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{passError}</span>
            </div>
          )}

          <form onSubmit={handleVerifyPass} className="space-y-3">
            <div>
              <label htmlFor="passInput" className="block text-[11px] font-display font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Your Name
              </label>
              <input
                id="passInput"
                type="text"
                value={passInput}
                onChange={(e) => setPassInput(e.target.value)}
                placeholder="Enter your name (e.g. Alex, Ruwaiz)..."
                autoComplete="name"
                className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-sans text-sm placeholder:text-slate-400 focus:outline-hidden focus:border-orange-500 focus:bg-white transition"
              />
            </div>

            <button
              type="submit"
              disabled={isVerifyingPass}
              className="w-full h-12 rounded-xl font-display font-black bg-gradient-to-r from-orange-500 to-amber-500 hover:opacity-95 active:scale-[0.98] text-white text-sm shadow-sm transition disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>{isVerifyingPass ? "Entering Food Fest..." : "Start Tasting Passport"}</span>
              <ChevronRight className="w-4 h-4 text-white stroke-[2.5]" />
            </button>
          </form>

          {/* Development Quick Pass Switcher */}
          {isDevMode && (
            <div className="pt-3 border-t border-slate-100">
              <span className="text-[10px] font-display font-bold uppercase tracking-wider text-slate-400 block mb-2">
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
                      className="px-2.5 py-1 rounded-lg text-[11px] font-mono bg-slate-50 hover:bg-orange-50 text-slate-700 hover:text-orange-600 border border-slate-200 transition active-press"
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
          <div className="bg-white p-5 sm:p-6 rounded-3xl border border-orange-100 shadow-sm space-y-4 relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-orange-500 via-amber-400 to-orange-400" />

            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-display font-bold uppercase tracking-wider text-orange-600">
                  OFFICIAL ATTENDEE PASSPORT
                </span>
                <h2 className="font-display font-black text-base text-slate-900">
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
                className="text-xs font-display font-semibold text-slate-500 hover:text-slate-900 px-3 py-1 rounded-full border border-slate-200 hover:bg-slate-50 transition active-press"
              >
                Switch Pass
              </button>
            </div>

            {/* 5 Tactile Punch Card Slots */}
            <div>
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="font-display font-bold text-slate-900">
                  Today&apos;s Tasting Stamps
                </span>
                <span className="font-display font-bold text-orange-600">
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
                      className={`h-16 rounded-2xl border flex flex-col items-center justify-center p-1 text-center transition-all ${
                        isFilled
                          ? "bg-orange-50 border-orange-300 text-orange-700 shadow-2xs"
                          : "bg-slate-50 border-dashed border-slate-200 text-slate-400"
                      }`}
                    >
                      {isFilled ? (
                        <>
                          <Star className="w-4 h-4 fill-amber-400 text-amber-500 stroke-[1.5]" />
                          <span className="text-[10px] font-display font-black leading-tight mt-0.5 truncate w-full text-slate-900">
                            {ratedItem?.rating}★
                          </span>
                          <span className="text-[8px] font-mono text-orange-700 font-bold truncate w-full">
                            {stallNum ? `Stall ${stallNum}` : "Rated"}
                          </span>
                        </>
                      ) : (
                        <>
                          <div className="w-3.5 h-3.5 rounded-full border border-dashed border-slate-300 mb-1" />
                          <span className="text-[9px] font-display font-semibold text-slate-400">
                            #{slotIdx + 1}
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
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2.5 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{submitError}</span>
            </div>
          )}

          {/* Section: Stalls Selected for Rating */}
          {selectedVendors.length > 0 && (
            <div className="bg-white p-5 sm:p-6 rounded-3xl border border-orange-100 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="font-display font-black text-sm text-slate-900 flex items-center gap-2">
                  <span>Review Stalls</span>
                  <span className="px-2 py-0.5 rounded-full bg-orange-100 text-[11px] font-bold text-orange-700">
                    {selectedVendors.length}
                  </span>
                </h3>
                {unratedCount > 0 && (
                  <span className="text-[11px] font-bold text-orange-700 bg-orange-50 px-2 py-0.5 rounded-md border border-orange-200">
                    {unratedCount} needs stars
                  </span>
                )}
              </div>

              <div className="space-y-3">
                {selectedVendors.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 rounded-2xl bg-orange-50/40 border border-orange-100 space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-display font-extrabold text-sm text-slate-900">
                            {item.name}
                          </span>
                          <span className="font-display text-[10px] font-bold text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                            Stall {item.stall}
                          </span>
                        </div>
                        {item.category && (
                          <span className="text-[11px] text-slate-500">
                            {item.category}
                          </span>
                        )}
                        {item.isUpdate && (
                          <span className="ml-2 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                            Updating today&apos;s score
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => toggleVendor(item)}
                        className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-white transition"
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
          <div className="bg-white p-5 sm:p-6 rounded-3xl border border-orange-100 shadow-sm space-y-4">
            <div>
              <h3 className="font-display font-extrabold text-base text-slate-900">
                Which Stalls Did You Taste?
              </h3>
              <p className="text-xs text-slate-500">
                Search stalls or tap below to add to your ballot.
              </p>
            </div>

            {/* Quick 1-Tap Add Flagship Restaurants for Testing */}
            <div className="p-3 bg-orange-50/70 border border-orange-200/80 rounded-2xl space-y-2">
              <span className="text-[10px] font-display font-bold uppercase tracking-wider text-orange-800 flex items-center gap-1">
                <Zap className="w-3 h-3 text-orange-600" />
                <span>Quick Add Stalls for Testing:</span>
              </span>
              <div className="flex flex-wrap gap-1.5">
                {availableVendors
                  .filter((v) =>
                    [
                      "paradise-biryani",
                      "shah-ghouse",
                      "cafe-niloufer",
                      "pista-house",
                      "karachi-bakery",
                      "bawarchi-restaurant",
                      "chutneys",
                    ].includes(v.slug)
                  )
                  .map((v) => {
                    const isAdded = selectedVendors.some((s) => s.id === v.id);
                    return (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => toggleVendor(v)}
                        className={`text-[11px] font-display font-bold px-2.5 py-1 rounded-xl transition active-press flex items-center gap-1 ${
                          isAdded
                            ? "bg-orange-500 text-white shadow-2xs"
                            : "bg-white text-slate-800 border border-orange-200 hover:border-orange-300"
                        }`}
                      >
                        <span>{isAdded ? "✓" : "+"}</span>
                        <span>{v.name}</span>
                      </button>
                    );
                  })}
              </div>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={vendorSearch}
                onChange={(e) => setVendorSearch(e.target.value)}
                placeholder="Search by stall name, number (e.g. Paradise, 042)..."
                className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-orange-500 focus:bg-white transition"
              />
              {vendorSearch && (
                <button
                  type="button"
                  onClick={() => setVendorSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
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
                  className={`px-3 py-1 rounded-xl text-xs font-display font-bold whitespace-nowrap transition active-press ${
                    selectedCategory === cat
                      ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-xs"
                      : "bg-slate-50 text-slate-600 hover:text-slate-900 border border-slate-200"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Vendor List */}
            <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-2xl bg-white">
              {filteredVendors.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400">
                  No food stalls found for &quot;{vendorSearch}&quot;
                </div>
              ) : (
                filteredVendors.slice(0, 35).map((v) => {
                  const isSelected = selectedVendors.some((s) => s.id === v.id);

                  return (
                    <div
                      key={v.id}
                      className={`p-3 sm:px-4 flex items-center justify-between text-xs transition ${
                        isSelected ? "bg-orange-50/70" : "hover:bg-slate-50"
                      }`}
                    >
                      <div className="pr-2 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-display font-bold text-slate-900 truncate">
                            {v.name}
                          </span>
                          <span className="font-display text-[10px] font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                            Stall {v.stallNumber}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5 truncate">
                          {v.cuisine ? `${v.cuisine} • ${v.category}` : v.category}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => toggleVendor(v)}
                        className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-display font-bold transition active-press flex items-center gap-1 ${
                          isSelected
                            ? "bg-orange-600 text-white font-black shadow-xs"
                            : "bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200"
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
                className="w-full h-14 rounded-2xl font-display font-black text-base bg-gradient-to-r from-orange-500 to-amber-500 hover:opacity-95 active:scale-[0.98] text-white shadow-md shadow-orange-500/20 transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
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
                <p className="text-[11px] font-medium text-center text-orange-600 mt-2 flex items-center justify-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Each stall must be explicitly scored 1 to 5 stars before submitting.</span>
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
        <div className="max-w-xl mx-auto px-4 py-12 text-center text-slate-500 text-xs font-display">
          Opening Festival Passport...
        </div>
      }
    >
      <VoteContent />
    </Suspense>
  );
}
