"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSession } from "@/lib/SessionContext";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Ticket,
  CheckCircle2,
  AlertCircle,
  Star,
  Trophy,
  ArrowRight,
  Search,
  UtensilsCrossed,
  X,
  Plus,
  QrCode,
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
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedVendorId = searchParams.get("vendorId");

  const {
    authenticated,
    passToken,
    remainingQuota,
    ratedCount,
    ratedVendors,
    loginWithPass,
    refreshSession,
  } = useSession();

  // Pass verification state
  const [passInput, setPassInput] = useState(passToken || "");
  const [passError, setPassError] = useState<string | null>(null);
  const [isVerifyingPass, setIsVerifyingPass] = useState(false);

  // Vendor selection & rating state
  const [availableVendors, setAvailableVendors] = useState<any[]>([]);
  const [vendorSearch, setVendorSearch] = useState("");
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
      if (found && !selectedVendors.some((s) => s.id === found.id)) {
        // Never default to 5 stars! If previously rated, show it; otherwise 0.
        const prevRating = ratedVendors.find((r) => r.vendorId === found.id)?.rating || 0;
        setSelectedVendors([
          {
            id: found.id,
            name: found.name,
            stall: found.stallNumber,
            category: found.category,
            rating: prevRating,
            isUpdate: prevRating > 0,
          },
        ]);
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

    // Check daily quota constraint: max 5 distinct vendors per day
    const existingRatedIds = new Set(ratedVendors.map((r) => r.vendorId));
    const isNew = !existingRatedIds.has(v.id);
    const newVendorsInBatch = selectedVendors.filter((s) => !existingRatedIds.has(s.id)).length;

    if (isNew && ratedCount + newVendorsInBatch >= 5) {
      setSubmitError("You have reached today's 5-vendor rating limit.");
      return;
    }

    setSubmitError(null);
    // Never default to 5! If attendee previously rated this vendor today, preserve it; otherwise 0
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

  // Update Rating for a selected vendor
  const handleRatingChange = (vendorId: string, stars: number) => {
    setSelectedVendors((prev) =>
      prev.map((s) => (s.id === vendorId ? { ...s, rating: stars } : s))
    );
  };

  // Validation: Every selected stall must have an explicit 1–5 star rating
  const allExplicitlyRated =
    selectedVendors.length > 0 &&
    selectedVendors.every((s) => s.rating >= 1 && s.rating <= 5);

  const unratedCount = selectedVendors.filter((s) => s.rating === 0).length;

  // Submit Ratings
  const handleSubmitRatings = async () => {
    if (selectedVendors.length === 0) {
      setSubmitError("Please select at least one stall to rate.");
      return;
    }

    if (!allExplicitlyRated) {
      setSubmitError("Please tap 1 to 5 stars for every stall before submitting.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const res = await fetch("/api/voting/ratings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
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

  // Filter available vendors based on search input
  const filteredVendors = availableVendors.filter((v) => {
    const q = vendorSearch.trim().toLowerCase();
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
      {/* Mobile Page Header */}
      <div className="space-y-1">
        <p className="text-xs font-bold uppercase tracking-wider text-amber-700">
          Grand Food Fest • Live Voting
        </p>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
          Rate Food Stalls
        </h1>
        <p className="text-xs sm:text-sm text-stone-600">
          Up to 5 food stalls per day. Your ratings power the live Top 10 rankings.
        </p>
      </div>

      {/* Submission Success State */}
      {submissionSuccess ? (
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-stone-200 text-center space-y-5 shadow-sm animate-fadeIn">
          <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div className="space-y-1.5">
            <h2 className="text-2xl font-extrabold text-stone-900">✓ Thanks for rating!</h2>
            <p className="text-sm text-stone-600">Your ratings are counted.</p>
            <p className="text-xs font-semibold text-amber-800 bg-amber-50 py-1 px-3 rounded-full inline-block border border-amber-200/60 mt-1">
              You have {remainingQuota} rating{remainingQuota === 1 ? "" : "s"} left today.
            </p>
          </div>

          <div className="flex flex-col gap-2 pt-2">
            <Link
              href="/leaderboard"
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-amber-600 hover:bg-amber-700 active:scale-[0.98] text-white font-bold text-sm shadow-sm transition"
            >
              <Trophy className="w-4 h-4" />
              <span>See live rankings</span>
            </Link>
            <button
              type="button"
              onClick={() => {
                setSubmissionSuccess(false);
                setSelectedVendors([]);
              }}
              className="w-full py-3 rounded-xl bg-stone-100 hover:bg-stone-200 active:scale-[0.98] text-stone-700 font-semibold text-xs transition"
            >
              Rate another stall
            </button>
          </div>
        </div>
      ) : !authenticated ? (
        /* Step 1: Attendee Identification */
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-stone-200 shadow-sm space-y-4">
          <div className="space-y-1">
            <h2 className="text-base font-bold text-stone-900 flex items-center gap-2">
              <Ticket className="w-4 h-4 text-amber-600" />
              <span>Enter Festival Pass</span>
            </h2>
            <p className="text-xs text-stone-500">
              Found on your wristband or entry ticket. Keeps voting authentic and anonymous.
            </p>
          </div>

          {passError && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{passError}</span>
            </div>
          )}

          <form onSubmit={handleVerifyPass} className="space-y-3">
            <div>
              <label htmlFor="passInput" className="sr-only">
                Event Pass Number
              </label>
              <input
                id="passInput"
                type="text"
                value={passInput}
                onChange={(e) => setPassInput(e.target.value.toUpperCase())}
                placeholder="e.g. PASS-000001"
                autoComplete="off"
                className="w-full px-4 py-3 rounded-xl bg-stone-50 border border-stone-300 text-stone-900 font-mono text-base tracking-wide uppercase placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
              />
            </div>

            <button
              type="submit"
              disabled={isVerifyingPass}
              className="w-full py-3.5 rounded-xl font-bold bg-amber-600 hover:bg-amber-700 active:scale-[0.98] text-white text-sm shadow-sm transition disabled:opacity-50"
            >
              {isVerifyingPass ? "Verifying..." : "Start Rating Food"}
            </button>
          </form>

          {/* Development Quick Passes */}
          {isDevMode && (
            <div className="pt-3 border-t border-stone-100">
              <span className="text-[11px] text-stone-500 block mb-1.5 font-medium">
                Demo Passes (Development Only):
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
                      className="px-2.5 py-1 rounded-lg text-xs font-mono bg-stone-100 hover:bg-amber-100 text-stone-700 hover:text-amber-900 border border-stone-200 transition"
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
        /* Authenticated Voting Flow */
        <div className="space-y-4">
          {/* Active Quota Pill Banner */}
          <div className="bg-amber-50/80 border border-amber-200/80 p-3.5 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-600 text-white flex items-center justify-center font-bold text-xs">
                {remainingQuota}
              </div>
              <div>
                <p className="text-xs font-bold text-stone-900">
                  {remainingQuota > 0
                    ? `You have ${remainingQuota} rating${remainingQuota === 1 ? "" : "s"} left today`
                    : "You have used all 5 ratings today"}
                </p>
                <p className="text-[11px] text-stone-500 font-mono">
                  Pass: {passToken} • {ratedCount} submitted
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => loginWithPass("PASS-" + Math.floor(Math.random() * 900000 + 100000))}
              className="text-xs font-medium text-stone-500 hover:text-stone-800 underline ml-2"
            >
              Switch Pass
            </button>
          </div>

          {submitError && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{submitError}</span>
            </div>
          )}

          {/* Section: Selected Stalls (with Star Controls) */}
          {selectedVendors.length > 0 && (
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between pb-1 border-b border-stone-100">
                <h2 className="text-sm font-bold text-stone-900">
                  Your Selected Stalls ({selectedVendors.length})
                </h2>
                {unratedCount > 0 && (
                  <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/60">
                    {unratedCount} stall{unratedCount === 1 ? "" : "s"} need rating
                  </span>
                )}
              </div>

              <div className="space-y-3">
                {selectedVendors.map((item) => (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-xl bg-stone-50/80 border border-stone-200 space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-stone-900">{item.name}</span>
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-stone-200 text-stone-800">
                            {item.stall}
                          </span>
                        </div>
                        {item.category && (
                          <span className="text-[11px] text-stone-500">{item.category}</span>
                        )}
                        {item.isUpdate && (
                          <span className="ml-2 text-[10px] font-medium text-emerald-700">
                            (Updating prior vote)
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => toggleVendor(item)}
                        className="text-stone-400 hover:text-red-600 p-1 -mr-1"
                        aria-label={`Remove ${item.name}`}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Explicit Rating Control: Starts empty (0 stars) if new! */}
                    <div className="pt-1">
                      <p className="text-[11px] font-medium text-stone-500 mb-1">
                        How was your experience?
                      </p>
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
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-sm space-y-3">
            <div>
              <h2 className="text-sm font-bold text-stone-900">Who did you try?</h2>
              <p className="text-xs text-stone-500">
                Search stalls by name, stall number (e.g. A-12), or cuisine.
              </p>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={vendorSearch}
                onChange={(e) => setVendorSearch(e.target.value)}
                placeholder="Search food stalls (e.g. Spice Route, A-12)..."
                className="w-full pl-9 pr-8 py-2.5 rounded-xl bg-stone-50 border border-stone-300 text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
              />
              {vendorSearch && (
                <button
                  type="button"
                  onClick={() => setVendorSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* List of Vendors to Add */}
            <div className="max-h-64 overflow-y-auto divide-y divide-stone-100 border border-stone-200 rounded-xl bg-white">
              {filteredVendors.length === 0 ? (
                <div className="p-6 text-center text-xs text-stone-500">
                  No food stalls match &quot;{vendorSearch}&quot;
                </div>
              ) : (
                filteredVendors.slice(0, 30).map((v) => {
                  const isSelected = selectedVendors.some((s) => s.id === v.id);
                  const isAlreadyRated = ratedVendors.some((r) => r.vendorId === v.id);

                  return (
                    <div
                      key={v.id}
                      className={`p-3 flex items-center justify-between text-xs transition ${
                        isSelected ? "bg-amber-50/50" : "hover:bg-stone-50"
                      }`}
                    >
                      <div className="pr-2">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-stone-900">{v.name}</span>
                          <span className="font-mono text-[10px] text-stone-500 px-1 py-0.5 bg-stone-100 rounded">
                            {v.stallNumber}
                          </span>
                        </div>
                        <div className="text-[11px] text-stone-500 mt-0.5">
                          {v.category} {v.cuisine && `• ${v.cuisine}`}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => toggleVendor(v)}
                        className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold transition active:scale-95 flex items-center gap-1 ${
                          isSelected
                            ? "bg-amber-600 text-white"
                            : "bg-stone-100 hover:bg-stone-200 text-stone-800"
                        }`}
                      >
                        {isSelected ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" />
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

          {/* Bottom Submit Action */}
          {selectedVendors.length > 0 && (
            <div className="pt-2">
              <button
                type="button"
                disabled={isSubmitting || !allExplicitlyRated}
                onClick={handleSubmitRatings}
                className="w-full py-4 rounded-xl font-bold text-base bg-amber-600 hover:bg-amber-700 active:scale-[0.98] text-white shadow-md transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isSubmitting
                  ? "Submitting Ratings..."
                  : !allExplicitlyRated
                  ? "Tap Stars for Each Stall to Submit"
                  : `Submit ${selectedVendors.length} Rating${selectedVendors.length === 1 ? "" : "s"}`}
              </button>
              {!allExplicitlyRated && (
                <p className="text-[11px] text-center text-stone-500 mt-2">
                  Every selected stall requires an explicit 1 to 5 star rating.
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
        <div className="max-w-xl mx-auto px-4 py-12 text-center text-stone-500 text-xs">
          Loading voting portal...
        </div>
      }
    >
      <VoteContent />
    </Suspense>
  );
}
