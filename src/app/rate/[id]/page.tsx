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

  // Real-time expressive text feedback
  const getChargeLabel = () => {
    if (chargingDirection === "up") {
      if (chargePercentage < 20) return "Decent bite 👍";
      if (chargePercentage < 45) return "Tasty food 😋";
      if (chargePercentage < 75) return "Very delicious! ✨";
      if (chargePercentage < 95) return "Outstanding flavor! 🔥";
      return "Hyderabad Hall of Fame! 🏆";
    }
    if (chargingDirection === "down") {
      if (chargePercentage < 25) return "Needs more flavor 🌶️";
      if (chargePercentage < 55) return "Below expectations 👎";
      if (chargePercentage < 85) return "Disappointing bite ⚠️";
      return "Terrible / Avoid ❌";
    }
    return "Tap arrow to vote, or hold to charge";
  };

  return (
    <div className="max-w-md mx-auto px-4 py-6 space-y-6 select-none">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-display font-bold text-fest-charcoalMuted hover:text-fest-charcoal transition active-press"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Stalls</span>
        </Link>

        <span className="font-display text-[10px] font-black uppercase tracking-wider text-fest-terracotta bg-fest-terracottaLight px-2.5 py-1 rounded-full border border-fest-terracotta/20">
          Stall #{vendor?.stallNumber}
        </span>
      </div>

      {/* Stall Hero Board */}
      <div className="ticket-stub p-5 border border-fest-border shadow-card bg-white space-y-2 text-center">
        <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-fest-saffronDark bg-fest-saffronLight/70 px-2.5 py-0.5 rounded-full border border-fest-saffron/20">
          <Sparkles className="w-3 h-3 text-fest-saffron" />
          <span>{vendor?.cuisine ? `${vendor.cuisine} • ${vendor.category}` : vendor?.category}</span>
        </div>

        <h1 className="text-2xl font-display font-black text-fest-charcoal tracking-tight">
          {vendor?.name}
        </h1>

        {vendor?.description && (
          <p className="text-xs text-fest-charcoalMuted leading-relaxed line-clamp-2 max-w-sm mx-auto">
            {vendor.description}
          </p>
        )}
      </div>

      {/* Submission Success View */}
      {isSubmitted && submittedData ? (
        <div className="ticket-stub p-6 border border-fest-border shadow-warm bg-white text-center space-y-5 animate-in fade-in zoom-in-95 duration-200">
          <div
            className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto shadow-xs ${
              submittedData.direction === "up"
                ? "bg-emerald-100 text-emerald-800 border-2 border-emerald-300"
                : "bg-red-100 text-red-800 border-2 border-red-300"
            }`}
          >
            {submittedData.direction === "up" ? (
              <ThumbsUp className="w-8 h-8 stroke-[2.5]" />
            ) : (
              <ThumbsDown className="w-8 h-8 stroke-[2.5]" />
            )}
          </div>

          <div className="space-y-1">
            <span
              className={`stamp-badge text-xs ${
                submittedData.direction === "up"
                  ? "text-emerald-800 border-emerald-700"
                  : "text-red-800 border-red-700"
              }`}
            >
              {submittedData.direction === "up" ? "POSITIVE RATING RECORDED" : "BAD REVIEW RECORDED"}
            </span>

            <h2 className="text-4xl font-display font-black text-fest-charcoal pt-2 tabular-nums">
              {submittedData.direction === "up" ? `+${submittedData.percentage}%` : `-${submittedData.percentage}%`}
            </h2>

            <p className="text-xs font-semibold text-fest-charcoalMuted">
              Equivalent to {"★".repeat(submittedData.stars)}{"☆".repeat(5 - submittedData.stars)} ({submittedData.stars}/5 stars)
            </p>
          </div>

          <div className="space-y-2 pt-2 max-w-xs mx-auto">
            <Link
              href="/"
              className="w-full flex items-center justify-center gap-2 h-12 rounded-xl bg-gradient-to-r from-fest-terracotta to-fest-ember text-white font-display font-extrabold text-sm shadow-xs transition active-press"
            >
              <span>Rate Another Stall</span>
            </Link>

            <Link
              href="/leaderboard"
              className="w-full flex items-center justify-center gap-2 h-11 rounded-xl bg-fest-parchment hover:bg-fest-linen text-fest-charcoal font-display font-bold text-xs transition border border-fest-border"
            >
              <Trophy className="w-3.5 h-3.5 text-fest-saffron" />
              <span>See Live Leaderboard</span>
            </Link>
          </div>
        </div>
      ) : (
        /* The Two Hold-to-Charge Arrow Controls */
        <div className="space-y-5">
          {/* Active Charging Percentage Meter Display (No layout shifts, crisp numbers) */}
          <div className="text-center h-14 flex flex-col items-center justify-center">
            {chargingDirection ? (
              <div>
                <div
                  className={`font-display font-black text-4xl tracking-tight leading-none tabular-nums transition-colors ${
                    chargingDirection === "up" ? "text-emerald-800" : "text-fest-terracotta"
                  }`}
                >
                  {chargingDirection === "up" ? `+${chargePercentage}%` : `-${chargePercentage}%`}
                </div>
                <p className="text-xs font-display font-bold text-fest-charcoal mt-1">
                  {getChargeLabel()}
                </p>
              </div>
            ) : (
              <div className="text-xs font-display font-semibold text-fest-charcoalMuted bg-fest-parchment px-3.5 py-1.5 rounded-full border border-fest-border">
                {isSubmitting ? "Submitting rating..." : "Tap arrow to vote, or hold to charge"}
              </div>
            )}
          </div>

          {/* Up & Down Arrows Container */}
          <div className="grid grid-cols-2 gap-4">
            {/* UPWARD ARROW (POSITIVE RATING) */}
            <button
              type="button"
              disabled={isSubmitting}
              onPointerDown={() => handlePointerDown("up")}
              onPointerUp={() => handlePointerUp("up")}
              onPointerLeave={handlePointerCancel}
              onPointerCancel={handlePointerCancel}
              className={`relative overflow-hidden rounded-3xl h-64 flex flex-col items-center justify-between p-5 border-2 touch-none active:scale-[0.98] transition-colors duration-150 ${
                chargingDirection === "up"
                  ? "bg-emerald-600 text-white border-emerald-700 shadow-warm ring-4 ring-emerald-300/50"
                  : "bg-white text-emerald-800 border-emerald-300 hover:border-emerald-500 shadow-card"
              }`}
            >
              {/* Internal Dynamic Fill Bar (Smooth GPU-accelerated height, no CSS transition lag) */}
              {chargingDirection === "up" && (
                <div
                  className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-emerald-800 to-emerald-700/90 pointer-events-none"
                  style={{
                    height: `${chargePercentage}%`,
                    willChange: "height",
                  }}
                />
              )}

              {/* Up Indicator Label */}
              <div className="relative z-10 font-display font-extrabold text-xs uppercase tracking-wider">
                Upvote
              </div>

              {/* Central Arrow Graphic (Scales up smoothly with charge) */}
              <div className="relative z-10 my-auto flex flex-col items-center">
                <div
                  className={`w-20 h-20 rounded-full flex items-center justify-center ${
                    chargingDirection === "up"
                      ? "bg-white text-emerald-700 shadow-lg"
                      : "bg-emerald-50 text-emerald-700"
                  }`}
                  style={{
                    transform: chargingDirection === "up" ? `scale(${1 + (chargePercentage / 100) * 0.18})` : "scale(1)",
                    transition: chargingDirection === "up" ? "none" : "transform 0.15s ease",
                    willChange: "transform",
                  }}
                >
                  <ArrowUp className="w-10 h-10 stroke-[3]" />
                </div>

                <span className="font-display font-black text-sm mt-3 tabular-nums">
                  {chargingDirection === "up" ? `${chargePercentage}%` : "Delicious"}
                </span>
              </div>

              <div className="relative z-10 text-[10px] font-mono font-medium opacity-80">
                Hold to Charge
              </div>
            </button>

            {/* DOWNWARD ARROW (BAD REVIEW) */}
            <button
              type="button"
              disabled={isSubmitting}
              onPointerDown={() => handlePointerDown("down")}
              onPointerUp={() => handlePointerUp("down")}
              onPointerLeave={handlePointerCancel}
              onPointerCancel={handlePointerCancel}
              className={`relative overflow-hidden rounded-3xl h-64 flex flex-col items-center justify-between p-5 border-2 touch-none active:scale-[0.98] transition-colors duration-150 ${
                chargingDirection === "down"
                  ? "bg-red-600 text-white border-red-700 shadow-warm ring-4 ring-red-300/50"
                  : "bg-white text-red-800 border-red-200 hover:border-red-400 shadow-card"
              }`}
            >
              {/* Internal Dynamic Fill Bar (Smooth GPU-accelerated height, no CSS transition lag) */}
              {chargingDirection === "down" && (
                <div
                  className="absolute top-0 left-0 right-0 bg-gradient-to-b from-red-800 to-red-700/90 pointer-events-none"
                  style={{
                    height: `${chargePercentage}%`,
                    willChange: "height",
                  }}
                />
              )}

              {/* Down Indicator Label */}
              <div className="relative z-10 font-display font-extrabold text-xs uppercase tracking-wider">
                Bad Review
              </div>

              {/* Central Arrow Graphic (Scales up smoothly with charge) */}
              <div className="relative z-10 my-auto flex flex-col items-center">
                <div
                  className={`w-20 h-20 rounded-full flex items-center justify-center ${
                    chargingDirection === "down"
                      ? "bg-white text-red-700 shadow-lg"
                      : "bg-red-50 text-red-700"
                  }`}
                  style={{
                    transform: chargingDirection === "down" ? `scale(${1 + (chargePercentage / 100) * 0.18})` : "scale(1)",
                    transition: chargingDirection === "down" ? "none" : "transform 0.15s ease",
                    willChange: "transform",
                  }}
                >
                  <ArrowDown className="w-10 h-10 stroke-[3]" />
                </div>

                <span className="font-display font-black text-sm mt-3 tabular-nums">
                  {chargingDirection === "down" ? `${chargePercentage}%` : "Disliked"}
                </span>
              </div>

              <div className="relative z-10 text-[10px] font-mono font-medium opacity-80">
                Hold to Charge
              </div>
            </button>
          </div>

          {/* Guidance Info */}
          <div className="p-3.5 rounded-2xl bg-fest-parchment/60 border border-fest-border text-center text-xs text-fest-charcoalMuted space-y-1">
            <p className="font-display font-bold text-fest-charcoal">
              ⚡ How Arrow Voting Works:
            </p>
            <p className="text-[11px] leading-relaxed">
              Quick tap = 100% instant vote. <strong>Press & hold</strong> = device vibrates as the arrow charges up smoothly from 0% to 100% — release anytime to submit!
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
