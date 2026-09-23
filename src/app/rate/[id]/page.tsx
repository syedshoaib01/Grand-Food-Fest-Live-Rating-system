"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  Sparkles,
  Trophy,
  AlertCircle,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react";
import { useSession } from "@/lib/SessionContext";

export default function RateStallPage() {
  const params = useParams();
  const router = useRouter();
  const stallId = params.id as string;
  const { refreshSession } = useSession();

  const [vendor, setVendor] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Hold-to-Charge state
  const [chargingDirection, setChargingDirection] = useState<"up" | "down" | null>(null);
  const [chargePercentage, setChargePercentage] = useState(0);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedData, setSubmittedData] = useState<{
    direction: "up" | "down";
    percentage: number;
    stars: number;
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // References for high-performance timing and vibration loop
  const holdStartTimeRef = useRef<number | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const vibrationIntervalRef = useRef<any>(null);
  const currentPercentageRef = useRef<number>(0);
  const lastStateUpdateRef = useRef<number>(0);

  // Total duration to charge from 0% to 100%: 3200ms (smooth, controllable pacing)
  const TOTAL_CHARGE_DURATION_MS = 3200;

  // Load Vendor Info
  useEffect(() => {
    async function loadVendor() {
      try {
        setIsLoading(true);
        const res = await fetch(`/api/vendors/${stallId}`);
        const data = await res.json();
        if (res.ok && data.vendor) {
          setVendor(data.vendor);
        } else {
          // Fallback search in vendors list
          const listRes = await fetch("/api/vendors?limit=150");
          const listData = await listRes.json();
          const found = (listData.vendors || []).find(
            (v: any) => v.id === stallId || v.slug === stallId
          );
          if (found) {
            setVendor(found);
          } else {
            setError("Food stall not found.");
          }
        }
      } catch {
        setError("Error loading food stall.");
      } finally {
        setIsLoading(false);
      }
    }
    loadVendor();
  }, [stallId]);

  // Clean up vibration and animation on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (vibrationIntervalRef.current) clearInterval(vibrationIntervalRef.current);
    };
  }, []);

  // Trigger gentle device haptic click
  const triggerHaptic = useCallback(() => {
    if (typeof window !== "undefined" && typeof navigator !== "undefined" && navigator.vibrate) {
      try {
        navigator.vibrate(12);
      } catch {}
    }
  }, []);

  // Submit Rating Function
  const submitArrowRating = async (direction: "up" | "down", percentage: number) => {
    if (!vendor) return;

    // Convert percentage to 1-5 scale for backend Bayesian scoring
    let stars = 3;
    if (direction === "up") {
      // 0% -> 1 star, 100% -> 5 stars
      stars = Math.max(1, Math.min(5, Math.round(1 + (percentage / 100) * 4)));
    } else {
      // Bad review: 0% down -> 3 stars, 100% down -> 1 star
      stars = Math.max(1, Math.min(3, 3 - Math.round((percentage / 100) * 2)));
    }

    setIsSubmitting(true);
    setError(null);

    const idempotencyKey = `arrow-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

    try {
      const res = await fetch("/api/voting/ratings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": idempotencyKey,
        },
        body: JSON.stringify({
          idempotencyKey,
          ratings: [
            {
              vendorId: vendor.id,
              rating: stars,
            },
          ],
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to record your vote.");
      }

      // Strong completion vibration
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        try {
          navigator.vibrate([30, 50, 70]);
        } catch {}
      }

      setSubmittedData({ direction, percentage, stars });
      setIsSubmitted(true);
      await refreshSession();
    } catch (err: any) {
      setError(err.message || "Failed to submit rating.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Start Charging (PointerDown / TouchStart)
  const handlePointerDown = (direction: "up" | "down") => {
    if (isSubmitting || isSubmitted) return;

    setChargingDirection(direction);
    setChargePercentage(0);
    currentPercentageRef.current = 0;
    holdStartTimeRef.current = performance.now();
    lastStateUpdateRef.current = performance.now();

    // Initial haptic feedback
    triggerHaptic();

    // Gentle rhythmic vibration interval (every 130ms) for smooth tactile sensation
    if (vibrationIntervalRef.current) clearInterval(vibrationIntervalRef.current);
    vibrationIntervalRef.current = setInterval(() => {
      triggerHaptic();
    }, 130);

    const chargeStep = (now: number) => {
      if (!holdStartTimeRef.current) return;
      const elapsed = now - holdStartTimeRef.current;
      const progress = Math.min(100, Math.round((elapsed / TOTAL_CHARGE_DURATION_MS) * 100));

      currentPercentageRef.current = progress;

      // Throttle React state update to at most once every ~24ms to guarantee 60fps smoothness
      if (now - lastStateUpdateRef.current >= 24 || progress === 100) {
        setChargePercentage(progress);
        lastStateUpdateRef.current = now;
      }

      if (progress < 100) {
        animationFrameRef.current = requestAnimationFrame(chargeStep);
      } else {
        // Max charge reached
        triggerHaptic();
      }
    };

    animationFrameRef.current = requestAnimationFrame(chargeStep);
  };

  // Stop Charging & Release to Submit (PointerUp / TouchEnd)
  const handlePointerUp = (direction: "up" | "down") => {
    if (!chargingDirection || chargingDirection !== direction) return;

    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    if (vibrationIntervalRef.current) clearInterval(vibrationIntervalRef.current);

    const holdDuration = holdStartTimeRef.current ? performance.now() - holdStartTimeRef.current : 0;
    const finalPercentage = currentPercentageRef.current;

    holdStartTimeRef.current = null;
    setChargingDirection(null);
    setChargePercentage(0);

    // If hold was shorter than 220ms, treat as a quick click/tap -> 100%
    if (holdDuration < 220) {
      submitArrowRating(direction, 100);
    } else {
      // Hold & release: submit at the exact percentage reached!
      const effectivePercentage = Math.max(5, finalPercentage);
      submitArrowRating(direction, effectivePercentage);
    }
  };

  // Cancel hold if pointer leaves or cancels
  const handlePointerCancel = () => {
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    if (vibrationIntervalRef.current) clearInterval(vibrationIntervalRef.current);
    holdStartTimeRef.current = null;
    setChargingDirection(null);
    setChargePercentage(0);
  };

  if (isLoading) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-10 h-10 rounded-full border-4 border-fest-terracotta border-t-transparent animate-spin mx-auto" />
        <p className="font-display font-bold text-fest-charcoal text-xs">
          Loading food stall...
        </p>
      </div>
    );
  }

  if (error && !vendor) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
        <AlertCircle className="w-10 h-10 text-red-500 mx-auto" />
        <h2 className="font-display font-black text-lg text-fest-charcoal">{error}</h2>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-fest-terracotta text-white font-display font-bold text-xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Landing Page</span>
        </Link>
      </div>
    );
  }

  // Real-time expressive professional feedback
  const getChargeLabel = () => {
    if (chargingDirection === "up") {
      if (chargePercentage < 20) return "Pleasant Flavor";
      if (chargePercentage < 45) return "Very Flavorful";
      if (chargePercentage < 75) return "Festival Standout";
      if (chargePercentage < 95) return "Exceptional Dish";
      return "Hyderabad Culinary Gold";
    }
    if (chargingDirection === "down") {
      if (chargePercentage < 25) return "Needs Seasoning";
      if (chargePercentage < 55) return "Below Expectation";
      if (chargePercentage < 85) return "Major Shortcoming";
      return "Unsatisfactory";
    }
    return "Tap arrow to score, or hold to charge";
  };

  return (
    <div className="max-w-md mx-auto px-4 py-6 space-y-6 select-none">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-display font-medium text-slate-400 hover:text-white transition active-press"
        >
          <ArrowLeft className="w-4 h-4 stroke-[1.75]" />
          <span>Back to Stalls</span>
        </Link>

        <span className="font-display text-[10px] font-bold uppercase tracking-wider text-slate-300 bg-white/10 px-2.5 py-1 rounded-full border border-white/10">
          Stall {vendor?.stallNumber}
        </span>
      </div>

      {/* Stall Hero Board - Antigravity Glassmorphism & Minimalist */}
      <div className="glass-panel float-card p-6 rounded-3xl space-y-2 text-center border border-white/10 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-orange-500 via-amber-400 to-transparent" />

        <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
          <span>{vendor?.cuisine ? `${vendor.cuisine} • ${vendor.category}` : vendor?.category}</span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-display font-black text-white tracking-tight">
          {vendor?.name}
        </h1>

        {vendor?.description && (
          <p className="text-xs text-slate-400 leading-relaxed line-clamp-2 max-w-sm mx-auto">
            {vendor.description}
          </p>
        )}
      </div>

      {/* Submission Success View */}
      {isSubmitted && submittedData ? (
        <div className="glass-panel p-6 sm:p-8 rounded-3xl text-center space-y-5 animate-stagger-1 border border-white/12 shadow-2xl">
          <div className="space-y-1">
            <span
              className={`inline-block text-[11px] font-display font-bold uppercase tracking-wider px-3 py-1 rounded-full ${
                submittedData.direction === "up"
                  ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                  : "bg-rose-500/15 text-rose-400 border border-rose-500/30"
              }`}
            >
              {submittedData.direction === "up" ? "Positive Rating Recorded" : "Critique Recorded"}
            </span>

            <h2 className="text-5xl font-display font-black text-white pt-3 tabular-nums drop-shadow-md">
              {submittedData.direction === "up" ? `+${submittedData.percentage}%` : `-${submittedData.percentage}%`}
            </h2>

            <p className="text-xs font-medium text-slate-400">
              Recorded as <strong className="text-white">{submittedData.stars}</strong> of 5 stars
            </p>
          </div>

          <div className="space-y-2 pt-2 max-w-xs mx-auto">
            <Link
              href="/"
              className="w-full flex items-center justify-center gap-2 h-12 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:opacity-95 text-white font-display font-bold text-xs tracking-wide transition active-press shadow-lg shadow-amber-500/10"
            >
              <span>Rate Another Stall</span>
            </Link>

            <Link
              href="/leaderboard"
              className="w-full flex items-center justify-center gap-2 h-11 rounded-xl bg-white/5 hover:bg-white/10 text-white font-display font-semibold text-xs transition border border-white/10"
            >
              <Trophy className="w-3.5 h-3.5 text-amber-400 stroke-[1.75]" />
              <span>See Live Leaderboard</span>
            </Link>
          </div>
        </div>
      ) : (
        /* Pure Arrows (No Box Around Them) */
        <div className="space-y-6 pt-2">
          {/* Active Charging Percentage Meter Display */}
          <div className="text-center h-14 flex flex-col items-center justify-center">
            {chargingDirection ? (
              <div className="space-y-0.5">
                <div
                  className={`font-display font-black text-4xl tracking-tight leading-none tabular-nums ${
                    chargingDirection === "up" ? "text-emerald-400 drop-shadow-[0_0_12px_rgba(16,185,129,0.5)]" : "text-rose-400 drop-shadow-[0_0_12px_rgba(244,63,94,0.5)]"
                  }`}
                >
                  {chargingDirection === "up" ? `+${chargePercentage}%` : `-${chargePercentage}%`}
                </div>
                <p className="text-[11px] font-display font-semibold text-slate-300">
                  {getChargeLabel()}
                </p>
              </div>
            ) : (
              <span className="text-xs font-display font-medium text-slate-400">
                {isSubmitting ? "Submitting rating..." : "Hold arrow to charge • Release to submit"}
              </span>
            )}
          </div>

          {/* SVG Definitions for Dynamic Arrow Fill */}
          <svg width="0" height="0" className="absolute pointer-events-none" aria-hidden="true">
            <defs>
              <clipPath id="upvote-arrow-clip">
                <rect
                  x="0"
                  y={64 - (64 * (chargingDirection === "up" ? chargePercentage : 0)) / 100}
                  width="64"
                  height={(64 * (chargingDirection === "up" ? chargePercentage : 0)) / 100}
                />
              </clipPath>
              <clipPath id="downvote-arrow-clip">
                <rect
                  x="0"
                  y="0"
                  width="64"
                  height={(64 * (chargingDirection === "down" ? chargePercentage : 0)) / 100}
                />
              </clipPath>
            </defs>
          </svg>

          {/* Up & Down Arrows (Pure Arrows, No Surrounding Box) */}
          <div className="grid grid-cols-2 gap-8 max-w-xs mx-auto py-2">
            {/* UPWARD ARROW (PURE ARROW, NO BOX) */}
            <button
              type="button"
              disabled={isSubmitting}
              onPointerDown={() => handlePointerDown("up")}
              onPointerUp={() => handlePointerUp("up")}
              onPointerLeave={handlePointerCancel}
              onPointerCancel={handlePointerCancel}
              aria-label="Upvote food stall"
              className="flex flex-col items-center justify-center py-4 bg-transparent border-0 outline-none focus:outline-none cursor-pointer touch-none select-none transition-transform active:scale-95 group antigravity-arrow-hover"
            >
              {/* Pure SVG Arrow Icon */}
              <div
                className="relative transition-transform duration-100"
                style={{
                  transform: chargingDirection === "up" ? `scale(${1 + (chargePercentage / 100) * 0.14})` : "scale(1)",
                  filter: chargingDirection === "up" ? "drop-shadow(0 0 20px rgba(16, 185, 129, 0.6))" : undefined,
                }}
              >
                <svg
                  viewBox="0 0 64 64"
                  className="w-20 h-24 overflow-visible"
                >
                  {/* Unfilled Base Arrow */}
                  <path
                    d="M 32 6 L 56 30 H 42 V 58 H 22 V 30 H 8 Z"
                    fill={chargingDirection === "up" ? "rgba(255, 255, 255, 0.12)" : "rgba(255, 255, 255, 0.05)"}
                    stroke={chargingDirection === "up" ? "#34D399" : "rgba(255, 255, 255, 0.25)"}
                    strokeWidth="2.5"
                    strokeLinejoin="round"
                    className="transition-colors group-hover:stroke-emerald-400"
                  />

                  {/* Filled Dynamic Layer (Clipped to charge percentage) */}
                  <path
                    d="M 32 6 L 56 30 H 42 V 58 H 22 V 30 H 8 Z"
                    fill="#10B981"
                    stroke="#34D399"
                    strokeWidth="2.5"
                    strokeLinejoin="round"
                    clipPath="url(#upvote-arrow-clip)"
                  />
                </svg>
              </div>

              {/* Minimalist Label */}
              <div className="text-center mt-3 space-y-0.5">
                <span className="block font-display font-extrabold text-xs uppercase tracking-wider text-emerald-400">
                  Upvote
                </span>
                <span className="block text-[11px] font-medium text-slate-400 tabular-nums">
                  {chargingDirection === "up" ? `+${chargePercentage}%` : "Tasty"}
                </span>
              </div>
            </button>

            {/* DOWNWARD ARROW (PURE ARROW, NO BOX) */}
            <button
              type="button"
              disabled={isSubmitting}
              onPointerDown={() => handlePointerDown("down")}
              onPointerUp={() => handlePointerUp("down")}
              onPointerLeave={handlePointerCancel}
              onPointerCancel={handlePointerCancel}
              aria-label="Downvote food stall"
              className="flex flex-col items-center justify-center py-4 bg-transparent border-0 outline-none focus:outline-none cursor-pointer touch-none select-none transition-transform active:scale-95 group antigravity-arrow-hover"
            >
              {/* Pure SVG Arrow Icon */}
              <div
                className="relative transition-transform duration-100"
                style={{
                  transform: chargingDirection === "down" ? `scale(${1 + (chargePercentage / 100) * 0.14})` : "scale(1)",
                  filter: chargingDirection === "down" ? "drop-shadow(0 0 20px rgba(244, 63, 94, 0.6))" : undefined,
                }}
              >
                <svg
                  viewBox="0 0 64 64"
                  className="w-20 h-24 overflow-visible"
                >
                  {/* Unfilled Base Arrow */}
                  <path
                    d="M 32 58 L 8 34 H 22 V 6 H 42 V 34 H 56 Z"
                    fill={chargingDirection === "down" ? "rgba(255, 255, 255, 0.12)" : "rgba(255, 255, 255, 0.05)"}
                    stroke={chargingDirection === "down" ? "#FB7185" : "rgba(255, 255, 255, 0.25)"}
                    strokeWidth="2.5"
                    strokeLinejoin="round"
                    className="transition-colors group-hover:stroke-rose-400"
                  />

                  {/* Filled Dynamic Layer (Clipped to charge percentage) */}
                  <path
                    d="M 32 58 L 8 34 H 22 V 6 H 42 V 34 H 56 Z"
                    fill="#F43F5E"
                    stroke="#FB7185"
                    strokeWidth="2.5"
                    strokeLinejoin="round"
                    clipPath="url(#downvote-arrow-clip)"
                  />
                </svg>
              </div>

              {/* Minimalist Label */}
              <div className="text-center mt-3 space-y-0.5">
                <span className="block font-display font-extrabold text-xs uppercase tracking-wider text-rose-400 group-hover:text-rose-300 transition-colors">
                  Downvote
                </span>
                <span className="block text-[11px] font-medium text-slate-400 tabular-nums">
                  {chargingDirection === "down" ? `-${chargePercentage}%` : "Critique"}
                </span>
              </div>
            </button>
          </div>

          {/* Minimalist Helper Line */}
          <p className="text-center text-[11px] text-slate-500">
            Tap arrow for instant 100% vote • Press and hold to adjust intensity
          </p>
        </div>
      )}
    </div>
  );
}
