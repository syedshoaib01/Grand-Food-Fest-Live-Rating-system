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
      setSubmitError("You have reached today's 5-vendor rating limit.");
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
      setSubmitError("Please select at least one stall to rate.");
      return;
    }

    if (!allExplicitlyRated) {
      setSubmitError("Please select 1 to 5 stars for every stall before submitting.");
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
      {/* Page Header */}
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-bold text-stone-950 tracking-tight">
          Rate Food
        </h1>
        <p className="text-xs sm:text-sm text-stone-500">
          Rate up to 5 food stalls you tried today.
        </p>
      </div>

      {/* Minimal Success Screen */}
      {submissionSuccess ? (
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-stone-200/80 text-center space-y-5 shadow-xs">
          <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
            <Check className="w-6 h-6 stroke-[2.5]" />
          </div>

          <div className="space-y-1">
            <h2 className="text-xl font-bold text-stone-950">✓ Thanks for rating</h2>
            <p className="text-sm text-stone-500">Your ratings have been counted.</p>
            <p className="text-xs font-semibold text-stone-700 pt-1">
              You have {remainingQuota} rating{remainingQuota === 1 ? "" : "s"} left today.
            </p>
          </div>

          <div className="flex flex-col gap-2.5 pt-2 max-w-xs mx-auto">
            <Link
              href="/leaderboard"
              className="w-full flex items-center justify-center gap-2 h-11 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 active:scale-[0.98] text-white font-semibold text-sm transition"
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
              className="w-full h-11 rounded-xl bg-stone-100 hover:bg-stone-200 active:scale-[0.98] text-stone-700 font-medium text-xs transition"
            >
              Rate another stall
            </button>
          </div>
        </div>
      ) : !authenticated ? (
        /* Step 1: Attendee Identification */
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-stone-200/80 shadow-xs space-y-4">
          <div className="space-y-1">
            <h2 className="text-sm font-semibold text-stone-900 flex items-center gap-2">
              <Ticket className="w-4 h-4 text-amber-600" />
              <span>Enter festival pass</span>
            </h2>
            <p className="text-xs text-stone-500">
              Found on your wristband or entry pass. Anonymous and confidential.
            </p>
          </div>

          {passError && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{passError}</span>
            </div>
          )}

          <form onSubmit={handleVerifyPass} className="space-y-3">
            <input
              id="passInput"
              type="text"
              value={passInput}
              onChange={(e) => setPassInput(e.target.value.toUpperCase())}
              placeholder="e.g. PASS-000001"
              autoComplete="off"
              className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 font-mono text-sm tracking-wide uppercase placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition"
            />

            <button
              type="submit"
              disabled={isVerifyingPass}
              className="w-full h-11 rounded-xl font-semibold bg-amber-600 hover:bg-amber-700 active:scale-[0.98] text-white text-sm shadow-xs transition disabled:opacity-50"
            >
              {isVerifyingPass ? "Verifying..." : "Start rating"}
            </button>
          </form>

          {/* Development Quick Passes */}
          {isDevMode && (
            <div className="pt-3 border-t border-stone-100">
              <span className="text-[11px] text-stone-400 block mb-1.5 font-medium">
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
                      className="px-2 py-0.5 rounded text-xs font-mono bg-stone-100 hover:bg-amber-50 text-stone-600 hover:text-amber-900 border border-stone-200/70 transition"
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
          {/* Active Quota Header */}
          <div className="bg-stone-50 border border-stone-200/70 p-3.5 rounded-xl flex items-center justify-between text-xs">
            <div>
              <p className="font-semibold text-stone-900">
                {remainingQuota > 0
                  ? `${remainingQuota} rating${remainingQuota === 1 ? "" : "s"} left today`
                  : "You have used all 5 ratings today"}
              </p>
              <p className="text-[11px] text-stone-400">
                Pass: {passToken?.startsWith("ATT-") ? passToken : passToken ? `ATT-••••-${passToken.slice(-4)}` : "Verified"}
              </p>
            </div>

            <button
              type="button"
              onClick={async () => {
                await logout();
                setPassInput("");
                setSelectedVendors([]);
              }}
              className="text-xs text-stone-500 hover:text-stone-900 underline"
            >
              Switch Pass
            </button>
          </div>

          {submitError && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{submitError}</span>
            </div>
          )}

          {/* Section: Selected Stalls (with Star Controls) */}
          {selectedVendors.length > 0 && (
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200/80 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-1 border-b border-stone-100">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                  Selected stalls ({selectedVendors.length})
                </h2>
                {unratedCount > 0 && (
                  <span className="text-[11px] font-medium text-amber-700">
                    {unratedCount} need rating
                  </span>
                )}
              </div>

              <div className="space-y-3">
                {selectedVendors.map((item) => (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-xl bg-stone-50/70 border border-stone-200/80 space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-sm text-stone-950">{item.name}</span>
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono text-stone-500 bg-stone-200/70">
                            {item.stall}
                          </span>
                        </div>
                        {item.category && (
                          <span className="text-[11px] text-stone-400">{item.category}</span>
                        )}
                        {item.isUpdate && (
                          <span className="ml-2 text-[10px] font-medium text-emerald-700">
                            (Updating today&apos;s vote)
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => toggleVendor(item)}
                        className="text-stone-400 hover:text-stone-700 p-1"
                        aria-label={`Remove ${item.name}`}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="pt-1">
                      <p className="text-[11px] font-medium text-stone-500 mb-1">
                        How was it?
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
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200/80 shadow-xs space-y-3">
            <div>
              <h2 className="text-sm font-semibold text-stone-950">Who did you try?</h2>
              <p className="text-xs text-stone-400">
                Search stalls by name or stall number.
              </p>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={vendorSearch}
                onChange={(e) => setVendorSearch(e.target.value)}
                placeholder="Search stalls (e.g. Spice Route, A-12)..."
                className="w-full pl-9 pr-8 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition"
              />
              {vendorSearch && (
                <button
                  type="button"
                  onClick={() => setVendorSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 p-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* List of Vendors to Add */}
            <div className="max-h-60 overflow-y-auto divide-y divide-stone-100 border border-stone-200/70 rounded-xl bg-white">
              {filteredVendors.length === 0 ? (
                <div className="p-6 text-center text-xs text-stone-400">
                  No food stalls match &quot;{vendorSearch}&quot;
                </div>
              ) : (
                filteredVendors.slice(0, 30).map((v) => {
                  const isSelected = selectedVendors.some((s) => s.id === v.id);

                  return (
                    <div
                      key={v.id}
                      className={`p-3 flex items-center justify-between text-xs transition ${
                        isSelected ? "bg-amber-50/40" : "hover:bg-stone-50/70"
                      }`}
                    >
                      <div className="pr-2">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-stone-900">{v.name}</span>
                          <span className="font-mono text-[10px] text-stone-400 px-1 py-0.5 bg-stone-100 rounded">
                            {v.stallNumber}
                          </span>
                        </div>
                        <div className="text-[11px] text-stone-400 mt-0.5">
                          {v.category} {v.cuisine && `• ${v.cuisine}`}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => toggleVendor(v)}
                        className={`shrink-0 px-2.5 py-1 rounded-lg text-xs font-semibold transition active:scale-95 flex items-center gap-1 ${
                          isSelected
                            ? "bg-stone-900 text-white"
                            : "bg-stone-100 hover:bg-stone-200 text-stone-700"
                        }`}
                      >
                        {isSelected ? (
                          <>
                            <Check className="w-3 h-3 stroke-[2.5]" />
                            <span>Added</span>
                          </>
                        ) : (
                          <>
                            <Plus className="w-3 h-3" />
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
                className="w-full h-12 rounded-xl font-semibold text-sm bg-amber-600 hover:bg-amber-700 active:scale-[0.98] text-white shadow-xs transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isSubmitting
                  ? "Submitting..."
                  : !allExplicitlyRated
                  ? "Select stars for each stall"
                  : `Submit ${selectedVendors.length} rating${selectedVendors.length === 1 ? "" : "s"}`}
              </button>
              {!allExplicitlyRated && (
                <p className="text-[11px] text-center text-stone-400 mt-2">
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
        <div className="max-w-xl mx-auto px-4 py-12 text-center text-stone-400 text-xs">
          Loading voting portal...
        </div>
      }
    >
      <VoteContent />
    </Suspense>
  );
}
