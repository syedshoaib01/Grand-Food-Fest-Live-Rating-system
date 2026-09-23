"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, AlertCircle, Trophy } from "lucide-react";
import { useSession } from "@/lib/SessionContext";
import NameLoginForm from "@/components/NameLoginForm";

function getChargeLabelText(direction: "up" | "down", pct: number) {
  if (direction === "up") {
    if (pct < 20) return "Pleasant Flavor";
    if (pct < 45) return "Very Flavorful";
    if (pct < 75) return "Festival Standout";
    if (pct < 95) return "Exceptional Dish";
    return "Hyderabad Culinary Gold";
  } else {
    if (pct < 25) return "Needs Seasoning";
    if (pct < 55) return "Below Expectation";
    if (pct < 85) return "Major Shortcoming";
    return "Unsatisfactory";
  }
}

export default function RateVendorPage() {
  const params = useParams();
  const router = useRouter();
  const stallId = params.id as string;
  const { authenticated, refreshSession } = useSession();

  const [vendor, setVendor] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // High-level submission state
  const [chargingDirection, setChargingDirection] = useState<"up" | "down" | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedData, setSubmittedData] = useState<{
    direction: "up" | "down";
    percentage: number;
    stars: number;
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Direct DOM references for 60-120 FPS animation with 0 React re-renders during hold
  const holdStartTimeRef = useRef<number | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const currentPercentageRef = useRef<number>(0);
  const activeDirectionRef = useRef<"up" | "down" | null>(null);

  const percentDisplayRef = useRef<HTMLDivElement>(null);
  const labelDisplayRef = useRef<HTMLParagraphElement>(null);
  const upArrowClipRectRef = useRef<SVGRectElement>(null);
  const downArrowClipRectRef = useRef<SVGRectElement>(null);
  const upArrowIconRef = useRef<HTMLDivElement>(null);
  const downArrowIconRef = useRef<HTMLDivElement>(null);
  const upSubTextRef = useRef<HTMLSpanElement>(null);
  const downSubTextRef = useRef<HTMLSpanElement>(null);

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

  // Clean up animation on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, []);

  const triggerHaptic = useCallback((duration = 15) => {
    if (typeof window !== "undefined" && typeof navigator !== "undefined" && navigator.vibrate) {
      try {
        navigator.vibrate(duration);
      } catch {}
    }
  }, []);

  // Submit Rating Function
  const submitArrowRating = async (direction: "up" | "down", percentage: number) => {
    if (!vendor) return;

    let stars = 3;
    if (direction === "up") {
      stars = Math.max(1, Math.min(5, Math.round(1 + (percentage / 100) * 4)));
    } else {
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

      triggerHaptic(40);
      setSubmittedData({ direction, percentage, stars });
      setIsSubmitted(true);
      await refreshSession();
    } catch (err: any) {
      setError(err.message || "Failed to submit rating.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Start Charging (PointerDown / TouchStart) — Zero React re-rendering during hold
  const handlePointerDown = (direction: "up" | "down") => {
    if (isSubmitting || isSubmitted) return;

    activeDirectionRef.current = direction;
    setChargingDirection(direction);
    currentPercentageRef.current = 0;
    holdStartTimeRef.current = performance.now();

    triggerHaptic(15);

    const chargeStep = (now: number) => {
      if (!holdStartTimeRef.current || activeDirectionRef.current !== direction) return;
      const elapsed = now - holdStartTimeRef.current;
      const progress = Math.min(100, Math.round((elapsed / TOTAL_CHARGE_DURATION_MS) * 100));

      currentPercentageRef.current = progress;

      // Update DOM nodes directly — zero React virtual DOM overhead
      if (percentDisplayRef.current) {
        percentDisplayRef.current.textContent = direction === "up" ? `+${progress}%` : `-${progress}%`;
      }
      if (labelDisplayRef.current) {
        labelDisplayRef.current.textContent = getChargeLabelText(direction, progress);
      }

      if (direction === "up") {
        if (upArrowClipRectRef.current) {
          const fillH = (64 * progress) / 100;
          upArrowClipRectRef.current.setAttribute("y", String(64 - fillH));
          upArrowClipRectRef.current.setAttribute("height", String(fillH));
        }
        if (upArrowIconRef.current) {
          upArrowIconRef.current.style.transform = `scale(${1 + (progress / 100) * 0.12})`;
        }
        if (upSubTextRef.current) {
          upSubTextRef.current.textContent = `+${progress}%`;
        }
      } else {
        if (downArrowClipRectRef.current) {
          const fillH = (64 * progress) / 100;
          downArrowClipRectRef.current.setAttribute("height", String(fillH));
        }
        if (downArrowIconRef.current) {
          downArrowIconRef.current.style.transform = `scale(${1 + (progress / 100) * 0.12})`;
        }
        if (downSubTextRef.current) {
          downSubTextRef.current.textContent = `-${progress}%`;
        }
      }

      if (progress < 100) {
        animationFrameRef.current = requestAnimationFrame(chargeStep);
      } else {
        triggerHaptic(25);
      }
    };

    animationFrameRef.current = requestAnimationFrame(chargeStep);
  };

  // Stop Charging & Release to Submit
  const handlePointerUp = (direction: "up" | "down") => {
    if (activeDirectionRef.current !== direction) return;

    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);

    const holdDuration = holdStartTimeRef.current ? performance.now() - holdStartTimeRef.current : 0;
    const finalPercentage = currentPercentageRef.current;

    holdStartTimeRef.current = null;
    activeDirectionRef.current = null;
    setChargingDirection(null);

    // Reset visual transforms
    if (upArrowIconRef.current) upArrowIconRef.current.style.transform = "scale(1)";
    if (downArrowIconRef.current) downArrowIconRef.current.style.transform = "scale(1)";
    if (upArrowClipRectRef.current) {
      upArrowClipRectRef.current.setAttribute("y", "64");
      upArrowClipRectRef.current.setAttribute("height", "0");
    }
    if (downArrowClipRectRef.current) {
      downArrowClipRectRef.current.setAttribute("height", "0");
    }
    if (upSubTextRef.current) upSubTextRef.current.textContent = "Tasty";
    if (downSubTextRef.current) downSubTextRef.current.textContent = "Critique";

    if (holdDuration < 220) {
      submitArrowRating(direction, 100);
    } else {
      const effectivePercentage = Math.max(5, finalPercentage);
      submitArrowRating(direction, effectivePercentage);
    }
  };

  const handlePointerCancel = () => {
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    holdStartTimeRef.current = null;
    activeDirectionRef.current = null;
    setChargingDirection(null);

    if (upArrowIconRef.current) upArrowIconRef.current.style.transform = "scale(1)";
    if (downArrowIconRef.current) downArrowIconRef.current.style.transform = "scale(1)";
    if (upArrowClipRectRef.current) {
      upArrowClipRectRef.current.setAttribute("y", "64");
      upArrowClipRectRef.current.setAttribute("height", "0");
    }
    if (downArrowClipRectRef.current) {
      downArrowClipRectRef.current.setAttribute("height", "0");
    }
    if (upSubTextRef.current) upSubTextRef.current.textContent = "Tasty";
    if (downSubTextRef.current) downSubTextRef.current.textContent = "Critique";
  };

  if (isLoading) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-8 h-8 rounded-full border-2 border-amber-400 border-t-transparent animate-spin mx-auto" />
        <p className="font-display font-medium text-slate-400 text-xs">
          Loading food stall...
        </p>
      </div>
    );
  }

  if (error && !vendor) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
        <AlertCircle className="w-10 h-10 text-rose-400 mx-auto" />
        <h2 className="font-display font-black text-lg text-white">{error}</h2>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-display font-bold text-xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Stalls</span>
        </Link>
      </div>
    );
  }

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

      {/* Stall Hero Board */}
      <div className="glass-panel p-6 rounded-3xl space-y-2 text-center border border-white/10 shadow-xl relative overflow-hidden">
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

      {/* Attendee Name Login Check */}
      {!authenticated ? (
        <div className="pt-2">
          <NameLoginForm />
        </div>
      ) : isSubmitted && submittedData ? (
        /* Submission Success View */
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
            <div className={chargingDirection ? "space-y-0.5" : "hidden"}>
              <div
                ref={percentDisplayRef}
                className={`font-display font-black text-4xl tracking-tight leading-none tabular-nums ${
                  chargingDirection === "up" ? "text-emerald-400" : "text-rose-400"
                }`}
              >
                +0%
              </div>
              <p ref={labelDisplayRef} className="text-[11px] font-display font-semibold text-slate-300">
                Charging...
              </p>
            </div>
            {!chargingDirection && (
              <span className="text-xs font-display font-medium text-slate-400">
                {isSubmitting ? "Submitting rating..." : "Hold arrow to charge • Release to submit"}
              </span>
            )}
          </div>

          {/* SVG Definitions for Dynamic Arrow Fill */}
          <svg width="0" height="0" className="absolute pointer-events-none" aria-hidden="true">
            <defs>
              <clipPath id="upvote-arrow-clip">
                <rect ref={upArrowClipRectRef} x="0" y="64" width="64" height="0" />
              </clipPath>
              <clipPath id="downvote-arrow-clip">
                <rect ref={downArrowClipRectRef} x="0" y="0" width="64" height="0" />
              </clipPath>
            </defs>
          </svg>

          {/* Up & Down Arrows (Pure Standalone Arrows, No Box Outline) */}
          <div className="grid grid-cols-2 gap-8 max-w-xs mx-auto py-2">
            {/* UPWARD ARROW (PURE ARROW) */}
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
              <div
                ref={upArrowIconRef}
                className="relative transition-transform duration-75"
                style={{ transform: "scale(1)" }}
              >
                <svg viewBox="0 0 64 64" className="w-20 h-24 overflow-visible">
                  {/* Base Unfilled Arrow */}
                  <path
                    d="M 32 6 L 56 30 H 42 V 58 H 22 V 30 H 8 Z"
                    fill="rgba(255, 255, 255, 0.06)"
                    stroke="rgba(255, 255, 255, 0.25)"
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

              <div className="text-center mt-3 space-y-0.5">
                <span className="block font-display font-extrabold text-xs uppercase tracking-wider text-emerald-400">
                  Upvote
                </span>
                <span ref={upSubTextRef} className="block text-[11px] font-medium text-slate-400 tabular-nums">
                  Tasty
                </span>
              </div>
            </button>

            {/* DOWNWARD ARROW (PURE ARROW) */}
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
              <div
                ref={downArrowIconRef}
                className="relative transition-transform duration-75"
                style={{ transform: "scale(1)" }}
              >
                <svg viewBox="0 0 64 64" className="w-20 h-24 overflow-visible">
                  {/* Base Unfilled Arrow */}
                  <path
                    d="M 32 58 L 8 34 H 22 V 6 H 42 V 34 H 56 Z"
                    fill="rgba(255, 255, 255, 0.06)"
                    stroke="rgba(255, 255, 255, 0.25)"
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

              <div className="text-center mt-3 space-y-0.5">
                <span className="block font-display font-extrabold text-xs uppercase tracking-wider text-rose-400 group-hover:text-rose-300 transition-colors">
                  Downvote
                </span>
                <span ref={downSubTextRef} className="block text-[11px] font-medium text-slate-400 tabular-nums">
                  Critique
                </span>
              </div>
            </button>
          </div>

          <p className="text-center text-[11px] text-slate-500">
            Tap arrow for instant 100% vote • Press and hold to adjust intensity
          </p>
        </div>
      )}
    </div>
  );
}
