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
  Sparkles,
  QrCode,
  X,
} from "lucide-react";
import StarRating from "@/components/StarRating";

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

  // State
  const [passInput, setPassInput] = useState(passToken || "");
  const [passError, setPassError] = useState<string | null>(null);
  const [isVerifyingPass, setIsVerifyingPass] = useState(false);

  // Vendor selection state
  const [availableVendors, setAvailableVendors] = useState<any[]>([]);
  const [vendorSearch, setVendorSearch] = useState("");
  const [selectedVendors, setSelectedVendors] = useState<Array<{ id: string; name: string; stall: string; rating: number }>>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Load available food vendors
  useEffect(() => {
    fetch("/api/vendors?type=FOOD&limit=120")
      .then((res) => res.json())
      .then((data) => {
        setAvailableVendors(data.vendors || []);
      })
      .catch(() => {});
  }, []);

  // Handle preselected vendor
  useEffect(() => {
    if (preselectedVendorId && availableVendors.length > 0) {
      const found = availableVendors.find((v) => v.id === preselectedVendorId);
      if (found && !selectedVendors.some((s) => s.id === found.id)) {
        const existingRating = ratedVendors.find((r) => r.vendorId === found.id)?.rating || 5;
        setSelectedVendors([{ id: found.id, name: found.name, stall: found.stallNumber, rating: existingRating }]);
      }
    }
  }, [preselectedVendorId, availableVendors]);

  // Handle Pass Verification
  const handleVerifyPass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passInput.trim()) {
      setPassError("Please enter your festival pass token.");
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

    // Check if adding this would exceed quota
    // Count how many of selectedVendors are NOT already in ratedVendors
    const existingRatedIds = new Set(ratedVendors.map((r) => r.vendorId));
    const isNew = !existingRatedIds.has(v.id);
    const newVendorsSelected = selectedVendors.filter((s) => !existingRatedIds.has(s.id)).length;

    if (isNew && ratedCount + newVendorsSelected >= 5) {
      setSubmitError("You've reached today's 5-vendor rating limit.");
      return;
    }

    setSubmitError(null);
    const prevScore = ratedVendors.find((r) => r.vendorId === v.id)?.rating || 5;
    setSelectedVendors([
      ...selectedVendors,
      { id: v.id, name: v.name, stall: v.stallNumber, rating: prevScore },
    ]);
  };

  // Update Rating for a selected vendor
  const handleRatingChange = (vendorId: string, stars: number) => {
    setSelectedVendors(
      selectedVendors.map((s) => (s.id === vendorId ? { ...s, rating: stars } : s))
    );
  };

  // Submit All Ratings
  const handleSubmitRatings = async () => {
    if (selectedVendors.length === 0) {
      setSubmitError("Please select at least one vendor to rate.");
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
        throw new Error(data.error || "Failed to submit ratings.");
      }

      setSubmissionSuccess(true);
      await refreshSession();
    } catch (e: any) {
      setSubmitError(e.message || "Network error. Please retry.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter available vendors based on search input
  const filteredVendors = availableVendors.filter(
    (v) =>
      v.name.toLowerCase().includes(vendorSearch.toLowerCase()) ||
      v.stallNumber.toLowerCase().includes(vendorSearch.toLowerCase()) ||
      (v.category && v.category.toLowerCase().includes(vendorSearch.toLowerCase())) ||
      (v.cuisine && v.cuisine.toLowerCase().includes(vendorSearch.toLowerCase()))
  );

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Title */}
      <div className="text-center space-y-2 border-b border-fest-border pb-6">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-fest-gold border border-amber-500/20">
          <Ticket className="w-3.5 h-3.5" />
          <span>Live Festival Voting</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-white">
          Rate Your <span className="gold-gradient-text">Food Experience</span>
        </h1>
        <p className="text-xs sm:text-sm text-gray-400 max-w-lg mx-auto">
          Vote for up to 5 food stalls each festival day. Your ratings power the live leaderboard.
        </p>
      </div>

      {/* Success State */}
      {submissionSuccess ? (
        <div className="glass-panel p-8 sm:p-10 rounded-3xl border border-fest-border text-center space-y-6 animate-fadeIn">
          <div className="w-16 h-16 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center mx-auto shadow-lg shadow-green-500/20">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-black text-white">✓ Ratings Recorded!</h2>
            <p className="text-sm text-gray-300">
              Your votes have been securely counted toward the live festival leaderboard.
            </p>
            <p className="text-xs text-amber-400 font-semibold">
              Remaining quota today: {remainingQuota} of 5 vendors
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
            <Link
              href="/leaderboard"
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-black font-extrabold text-sm shadow-lg shadow-amber-500/25 hover:scale-105 transition"
            >
              <Trophy className="w-4 h-4" />
              <span>View Live Rankings</span>
            </Link>
            <button
              onClick={() => {
                setSubmissionSuccess(false);
                setSelectedVendors([]);
              }}
              className="px-5 py-3 rounded-xl bg-fest-card hover:bg-fest-cardHover border border-fest-border text-sm font-bold text-gray-300 hover:text-white"
            >
              Rate Another Stall
            </button>
          </div>
        </div>
      ) : !authenticated ? (
        /* Step 1: Voter Identification (Pass Entry) */
        <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-fest-border shadow-xl space-y-6">
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <QrCode className="w-5 h-5 text-fest-gold" />
              <span>Step 1: Identify with Event Pass</span>
            </h2>
            <p className="text-xs text-gray-400">
              Enter your ticket or wristband code (e.g. <strong className="text-gray-300">PASS-000001</strong>). No passwords, emails, or personal information required.
            </p>
          </div>

          {passError && (
            <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{passError}</span>
            </div>
          )}

          <form onSubmit={handleVerifyPass} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">
                Event Pass Number
              </label>
              <input
                type="text"
                value={passInput}
                onChange={(e) => setPassInput(e.target.value.toUpperCase())}
                placeholder="e.g. PASS-000001"
                className="w-full px-4 py-3 rounded-xl bg-fest-dark border border-fest-border text-white font-mono text-base tracking-wide uppercase focus:outline-none focus:ring-2 focus:ring-fest-gold"
              />
            </div>

            <button
              type="submit"
              disabled={isVerifyingPass}
              className="w-full py-3.5 rounded-xl font-bold bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black text-sm transition shadow-lg shadow-amber-500/20 disabled:opacity-50"
            >
              {isVerifyingPass ? "Verifying Pass..." : "Verify & Continue"}
            </button>
          </form>

          {/* Quick Demo Passes */}
          <div className="pt-4 border-t border-fest-border/60">
            <span className="text-[11px] text-gray-400 block mb-2 font-medium">
              Demo Passes (Click to test):
            </span>
            <div className="flex flex-wrap gap-2">
              {["PASS-000001", "PASS-000002", "PASS-000003", "PASS-000004", "PASS-000005"].map(
                (demo) => (
                  <button
                    key={demo}
                    type="button"
                    onClick={() => {
                      setPassInput(demo);
                      loginWithPass(demo);
                    }}
                    className="px-2.5 py-1 rounded-lg text-xs font-mono bg-fest-dark hover:bg-fest-card border border-fest-border text-amber-400"
                  >
                    {demo}
                  </button>
                )
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Step 2 & 3: Select and Rate Vendors */
        <div className="space-y-6">
          {/* Active Session Status Header */}
          <div className="glass-panel p-4 rounded-2xl border border-fest-border flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-fest-gold flex items-center justify-center font-bold font-mono text-xs">
                QR
              </div>
              <div>
                <div className="font-bold text-sm text-white flex items-center gap-1.5">
                  <span>Pass: {passToken}</span>
                </div>
                <div className="text-xs text-amber-400">
                  {ratedCount} of 5 daily votes submitted • {remainingQuota} remaining today
                </div>
              </div>
            </div>

            <button
              onClick={() => loginWithPass("PASS-" + Math.floor(Math.random() * 900000 + 100000))}
              className="text-xs text-gray-400 hover:text-white"
            >
              Switch Pass
            </button>
          </div>

          {submitError && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{submitError}</span>
            </div>
          )}

          {/* Vendors to Rate Selection */}
          <div className="glass-panel p-6 rounded-3xl border border-fest-border space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-white">Select Food Stalls You Tried Today</h2>
                <p className="text-xs text-gray-400">
                  Choose 1 to {Math.max(1, remainingQuota + selectedVendors.length)} stalls to rate.
                </p>
              </div>
              <span className="text-xs font-mono px-2.5 py-1 rounded-lg bg-fest-dark border border-fest-border text-fest-gold font-bold">
                {selectedVendors.length} selected
              </span>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={vendorSearch}
                onChange={(e) => setVendorSearch(e.target.value)}
                placeholder="Search food stalls by name, stall number (e.g. A-01), or cuisine..."
                className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-fest-dark border border-fest-border text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-fest-gold"
              />
            </div>

            {/* Quick Chips of Selected Vendors */}
            {selectedVendors.length > 0 && (
              <div className="space-y-3 pt-2">
                <span className="text-xs text-gray-300 font-semibold block">
                  Your Selected Stalls & Ratings:
                </span>
                <div className="space-y-3">
                  {selectedVendors.map((item) => (
                    <div
                      key={item.id}
                      className="p-4 rounded-2xl bg-fest-dark border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="flex items-center justify-between sm:justify-start gap-3">
                        <div>
                          <div className="font-bold text-sm text-white">{item.name}</div>
                          <div className="text-[11px] text-amber-400 font-mono">
                            Stall {item.stall}
                          </div>
                        </div>
                        <button
                          onClick={() => toggleVendor(item)}
                          className="sm:hidden text-gray-400 hover:text-red-400 p-1"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-3">
                        <StarRating
                          value={item.rating}
                          size="md"
                          showLabel
                          onChange={(star) => handleRatingChange(item.id, star)}
                        />
                        <button
                          onClick={() => toggleVendor(item)}
                          className="hidden sm:block text-gray-400 hover:text-red-400 p-1"
                          title="Remove vendor"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Available Stalls List */}
            <div className="pt-2">
              <span className="text-xs text-gray-400 block mb-2">
                Click to add stalls to your rating list:
              </span>
              <div className="max-h-60 overflow-y-auto divide-y divide-fest-border/50 border border-fest-border rounded-xl bg-fest-dark/50">
                {filteredVendors.slice(0, 30).map((v) => {
                  const isSelected = selectedVendors.some((s) => s.id === v.id);
                  const isAlreadyRated = ratedVendors.some((r) => r.vendorId === v.id);

                  return (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => toggleVendor(v)}
                      className={`w-full text-left p-3 flex items-center justify-between text-xs transition ${
                        isSelected
                          ? "bg-amber-500/10 text-amber-300"
                          : "hover:bg-fest-cardHover text-gray-300"
                      }`}
                    >
                      <div>
                        <span className="font-bold text-white">{v.name}</span>
                        <span className="ml-2 font-mono text-[10px] text-gray-400">
                          Stall {v.stallNumber}
                        </span>
                        <div className="text-[10px] text-gray-400">
                          {v.category} {v.cuisine && `• ${v.cuisine}`}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {isAlreadyRated && (
                          <span className="text-[10px] text-green-400 font-semibold">
                            (Rated)
                          </span>
                        )}
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            isSelected
                              ? "bg-amber-500 text-black"
                              : "bg-gray-800 text-gray-300"
                          }`}
                        >
                          {isSelected ? "Selected ✓" : "+ Add"}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Submit Action */}
            <div className="pt-4 border-t border-fest-border">
              <button
                type="button"
                disabled={isSubmitting || selectedVendors.length === 0}
                onClick={handleSubmitRatings}
                className="w-full py-4 rounded-xl font-black text-base bg-gradient-to-r from-amber-500 via-amber-400 to-orange-500 text-black shadow-xl shadow-amber-500/25 hover:scale-[1.01] transition transform active:scale-95 disabled:opacity-40 disabled:hover:scale-100"
              >
                {isSubmitting
                  ? "Submitting Ratings..."
                  : `Submit ${selectedVendors.length} Rating${selectedVendors.length === 1 ? "" : "s"}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function VotePage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-3xl mx-auto px-4 py-16 text-center text-gray-400 text-sm">
          Loading Festival Voting Portal...
        </div>
      }
    >
      <VoteContent />
    </Suspense>
  );
}

