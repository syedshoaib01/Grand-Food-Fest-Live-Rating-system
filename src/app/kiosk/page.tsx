"use client";

import React, { useState, useEffect } from "react";
import {
  QrCode,
  CheckCircle2,
  Trophy,
  ArrowRight,
  Sparkles,
  Utensils,
  Star,
  RefreshCw,
  X,
  AlertCircle,
} from "lucide-react";
import StarRating from "@/components/StarRating";
import Link from "next/link";

export default function KioskPage() {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [passInput, setPassInput] = useState("");
  const [session, setSession] = useState<any>(null);
  const [passError, setPassError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  // Step 2 & 3: Vendors & Ratings
  const [vendors, setVendors] = useState<any[]>([]);
  const [selectedVendors, setSelectedVendors] = useState<
    Array<{ id: string; name: string; stall: string; rating: number }>
  >([]);
  const [search, setSearch] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resetCountdown, setResetCountdown] = useState(12);

  // Load vendors
  useEffect(() => {
    fetch("/api/vendors?type=FOOD&limit=150")
      .then((res) => res.json())
      .then((data) => setVendors(data.vendors || []))
      .catch(() => {});
  }, []);

  // Auto-reset timer on Step 4 (Thank you)
  useEffect(() => {
    if (step === 4) {
      setResetCountdown(12);
      const timer = setInterval(() => {
        setResetCountdown((prev) => {
          if (prev <= 1) {
            handleResetKiosk();
            return 12;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [step]);

  const handleResetKiosk = () => {
    setStep(1);
    setPassInput("");
    setSession(null);
    setSelectedVendors([]);
    setPassError(null);
    setSubmitError(null);
  };

  // Step 1: Verify pass
  const handleVerify = async (tokenToVerify?: string) => {
    const token = tokenToVerify || passInput.trim();
    if (!token) {
      setPassError("Please tap or scan your event pass.");
      return;
    }

    setIsVerifying(true);
    setPassError(null);

    try {
      const res = await fetch("/api/voting/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passToken: token }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Pass verification failed.");
      }

      setSession(data);
      setStep(2);
    } catch (e: any) {
      setPassError(e.message);
    } finally {
      setIsVerifying(false);
    }
  };

  // Step 2: Toggle vendor selection
  const toggleVendorSelection = (v: any) => {
    if (selectedVendors.some((s) => s.id === v.id)) {
      setSelectedVendors(selectedVendors.filter((s) => s.id !== v.id));
      return;
    }
    if (selectedVendors.length >= 5) {
      setSubmitError("Maximum 5 stalls allowed per attendee daily.");
      return;
    }
    setSubmitError(null);
    setSelectedVendors([
      ...selectedVendors,
      { id: v.id, name: v.name, stall: v.stallNumber, rating: 5 },
    ]);
  };

  // Step 3: Change rating
  const updateStar = (vendorId: string, rating: number) => {
    setSelectedVendors(
      selectedVendors.map((s) => (s.id === vendorId ? { ...s, rating } : s))
    );
  };

  // Step 3: Submit ratings
  const handleSubmit = async () => {
    if (selectedVendors.length === 0) return;
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const res = await fetch("/api/voting/ratings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: session?.session?.id,
          ratings: selectedVendors.map((s) => ({
            vendorId: s.id,
            rating: s.rating,
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Submission failed");
      }

      setStep(4);
    } catch (err: any) {
      setSubmitError(err.message || "Failed to record votes.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filtered = vendors.filter(
    (v) =>
      v.name.toLowerCase().includes(search.toLowerCase()) ||
      v.stallNumber.toLowerCase().includes(search.toLowerCase()) ||
      (v.category && v.category.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-fest-dark text-white flex flex-col p-4 sm:p-8 select-none">
      {/* Top Kiosk Header */}
      <div className="flex items-center justify-between border-b border-fest-border/80 pb-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center font-black text-black text-xl shadow-lg shadow-amber-500/30">
            GF
          </div>
          <div>
            <h1 className="font-black text-xl sm:text-2xl tracking-wide">
              VENUE EXIT RATING KIOSK
            </h1>
            <p className="text-xs text-amber-400 font-bold uppercase tracking-widest">
              Grand Food Fest Hyderabad 2026
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="text-xs text-gray-400 hover:text-white px-3 py-1.5 rounded-lg border border-fest-border"
          >
            Exit Kiosk
          </Link>
          <button
            onClick={handleResetKiosk}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-fest-card hover:bg-fest-cardHover border border-fest-border text-xs font-bold text-gray-300"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Reset Screen
          </button>
        </div>
      </div>

      {/* Main Kiosk Wizard Content */}
      <div className="flex-1 flex flex-col justify-center max-w-4xl mx-auto w-full">
        {/* STEP 1: SCAN PASS */}
        {step === 1 && (
          <div className="glass-panel p-8 sm:p-12 rounded-3xl border border-fest-border shadow-2xl text-center space-y-8 animate-fadeIn">
            <div className="w-24 h-24 rounded-3xl bg-amber-500/20 text-fest-gold flex items-center justify-center mx-auto border border-amber-500/30 shadow-xl">
              <QrCode className="w-14 h-14 text-fest-gold" />
            </div>

            <div className="space-y-2">
              <h2 className="text-3xl sm:text-4xl font-black text-white">SCAN YOUR EVENT PASS</h2>
              <p className="text-base text-gray-300 max-w-md mx-auto">
                Hold your festival wristband QR code to the scanner or tap your pass number below.
              </p>
            </div>

            {passError && (
              <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm font-semibold max-w-md mx-auto">
                {passError}
              </div>
            )}

            <div className="max-w-md mx-auto space-y-4">
              <input
                type="text"
                value={passInput}
                onChange={(e) => setPassInput(e.target.value.toUpperCase())}
                placeholder="Enter Pass (e.g. PASS-000001)"
                className="w-full text-center px-6 py-4 rounded-2xl bg-fest-dark border-2 border-fest-border text-white text-xl font-mono tracking-widest uppercase focus:outline-none focus:border-fest-gold"
              />

              <button
                onClick={() => handleVerify()}
                disabled={isVerifying}
                className="w-full py-5 rounded-2xl font-black text-lg bg-gradient-to-r from-amber-500 via-amber-400 to-orange-500 text-black shadow-xl shadow-amber-500/30 hover:scale-[1.02] transition transform active:scale-95"
              >
                {isVerifying ? "Verifying..." : "START RATING →"}
              </button>
            </div>

            {/* Tap Demo Pass shortcuts */}
            <div className="pt-4 border-t border-fest-border/50">
              <span className="text-xs text-gray-400 block mb-2">Quick Test Pass:</span>
              <div className="flex flex-wrap justify-center gap-2">
                {["PASS-000001", "PASS-000002", "PASS-000003", "PASS-000010"].map((p) => (
                  <button
                    key={p}
                    onClick={() => handleVerify(p)}
                    className="px-4 py-2 rounded-xl text-xs font-mono font-bold bg-fest-card hover:bg-fest-cardHover border border-fest-border text-amber-400"
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: SELECT VENDORS */}
        {step === 2 && (
          <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-fest-border shadow-2xl space-y-6 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-fest-border pb-4">
              <div>
                <h2 className="text-2xl font-black text-white">SELECT STALLS YOU TRIED TODAY</h2>
                <p className="text-xs text-gray-400">
                  Tap up to 5 food stalls. (Pass: <span className="font-mono text-amber-400">{session?.session?.passToken}</span>)
                </p>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black text-fest-gold font-mono">
                  {selectedVendors.length} / 5
                </span>
                <span className="text-xs text-gray-400 block">selected</span>
              </div>
            </div>

            {submitError && (
              <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
                {submitError}
              </div>
            )}

            {/* Fast Filter / Search */}
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="🔍 Search stall name or number (e.g. Spice Route, A-01)..."
              className="w-full px-5 py-3.5 rounded-xl bg-fest-dark border border-fest-border text-sm text-white placeholder-gray-500 focus:outline-none focus:border-fest-gold"
            />

            {/* Vendor Grid: Touch-Friendly Large Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto pr-1">
              {filtered.slice(0, 45).map((v) => {
                const isSelected = selectedVendors.some((s) => s.id === v.id);

                return (
                  <button
                    key={v.id}
                    onClick={() => toggleVendorSelection(v)}
                    className={`p-4 rounded-2xl text-left border transition-all duration-150 flex items-center justify-between gap-2 ${
                      isSelected
                        ? "bg-amber-500 text-black border-amber-400 font-bold shadow-lg scale-[1.01]"
                        : "bg-fest-dark hover:bg-fest-card border-fest-border text-gray-200"
                    }`}
                  >
                    <div>
                      <div className="font-black text-sm">{v.name}</div>
                      <div
                        className={`text-xs font-mono mt-0.5 ${
                          isSelected ? "text-black/80 font-bold" : "text-amber-400"
                        }`}
                      >
                        Stall {v.stallNumber} • {v.category}
                      </div>
                    </div>

                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${
                        isSelected ? "bg-black text-white" : "border border-gray-600 text-gray-400"
                      }`}
                    >
                      {isSelected ? "✓" : "+"}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Next Step CTA */}
            <div className="flex items-center justify-between pt-4 border-t border-fest-border">
              <button
                onClick={() => setStep(1)}
                className="px-6 py-3 rounded-xl border border-fest-border text-gray-400 hover:text-white text-sm font-bold"
              >
                ← Back
              </button>

              <button
                disabled={selectedVendors.length === 0}
                onClick={() => setStep(3)}
                className="px-8 py-4 rounded-2xl font-black text-base bg-gradient-to-r from-amber-500 to-orange-500 text-black shadow-lg shadow-amber-500/30 disabled:opacity-40"
              >
                RATE SELECTED ({selectedVendors.length}) →
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: RATE SELECTED VENDORS */}
        {step === 3 && (
          <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-fest-border shadow-2xl space-y-6 animate-fadeIn">
            <div className="border-b border-fest-border pb-4">
              <h2 className="text-2xl font-black text-white">TAP STARS TO RATE EACH STALL</h2>
              <p className="text-xs text-gray-400">
                1 Star = Poor, 5 Stars = Sublime!
              </p>
            </div>

            {submitError && (
              <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
                {submitError}
              </div>
            )}

            <div className="space-y-4 max-h-96 overflow-y-auto pr-1">
              {selectedVendors.map((item) => (
                <div
                  key={item.id}
                  className="p-5 rounded-2xl bg-fest-dark border border-fest-border flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div>
                    <div className="font-extrabold text-lg text-white">{item.name}</div>
                    <div className="text-xs font-mono text-amber-400 font-semibold">
                      Stall {item.stall}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <StarRating
                      value={item.rating}
                      size="xl"
                      showLabel
                      onChange={(stars) => updateStar(item.id, stars)}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-fest-border">
              <button
                onClick={() => setStep(2)}
                className="px-6 py-3 rounded-xl border border-fest-border text-gray-400 hover:text-white text-sm font-bold"
              >
                ← Back
              </button>

              <button
                disabled={isSubmitting}
                onClick={handleSubmit}
                className="px-10 py-4 rounded-2xl font-black text-lg bg-gradient-to-r from-amber-500 via-amber-400 to-orange-500 text-black shadow-xl shadow-amber-500/30 hover:scale-[1.02] transition"
              >
                {isSubmitting ? "SUBMITTING..." : "CONFIRM & SUBMIT RATINGS ✓"}
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: THANK YOU & INSTANT CONFIRMATION */}
        {step === 4 && (
          <div className="glass-panel p-10 sm:p-14 rounded-3xl border border-fest-border shadow-2xl text-center space-y-6 animate-fadeIn">
            <div className="w-24 h-24 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center mx-auto shadow-xl shadow-green-500/20">
              <CheckCircle2 className="w-14 h-14" />
            </div>

            <div className="space-y-2">
              <h2 className="text-4xl font-black text-white">THANK YOU!</h2>
              <p className="text-lg text-gray-200">Your ratings have been officially recorded.</p>
              <p className="text-sm text-amber-400 font-semibold">
                Thank you for supporting Hyderabad's food artisans!
              </p>
            </div>

            <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/leaderboard"
                className="flex items-center gap-2 px-8 py-4 rounded-2xl font-black text-base bg-fest-gold text-black shadow-lg shadow-amber-500/25"
              >
                <Trophy className="w-5 h-5" />
                <span>VIEW LIVE LEADERBOARD</span>
              </Link>

              <button
                onClick={handleResetKiosk}
                className="px-6 py-4 rounded-2xl bg-fest-card border border-fest-border text-sm font-bold text-gray-300 hover:text-white"
              >
                Rate Another Pass
              </button>
            </div>

            <div className="text-xs text-gray-500 pt-4">
              Screen will reset automatically in{" "}
              <strong className="text-amber-400">{resetCountdown}s</strong>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
