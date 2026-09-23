"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Ticket,
  Trophy,
  Star,
  Sparkles,
  MapPin,
} from "lucide-react";
import StarRating from "@/components/StarRating";
import RatingDistribution from "@/components/RatingDistribution";
import { useSession } from "@/lib/SessionContext";

export default function VendorDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const { authenticated, remainingQuota, ratedVendors, refreshSession } = useSession();

  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userRating, setUserRating] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchVendor = async () => {
    try {
      const res = await fetch(`/api/vendors/${slug}`);
      const json = await res.json();
      if (res.ok) {
        setData(json);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVendor();
  }, [slug]);

  // Check if current user already rated this vendor today
  useEffect(() => {
    if (data?.vendor?.id && ratedVendors) {
      const found = ratedVendors.find((r) => r.vendorId === data.vendor.id);
      if (found) {
        setUserRating(found.rating);
      }
    }
  }, [data, ratedVendors]);

  const handleRateVendor = async (selectedStars: number) => {
    if (!authenticated) {
      router.push(`/vote?vendorId=${data?.vendor?.id}`);
      return;
    }

    setIsSubmitting(true);
    setSubmitMessage(null);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/voting/ratings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vendorId: data.vendor.id,
          rating: selectedStars,
        }),
      });

      const resJson = await res.json();
      if (!res.ok) {
        throw new Error(resJson.error || "Failed to record rating");
      }

      setUserRating(selectedStars);
      setSubmitMessage("Your rating has been recorded and updated the live standings!");
      await refreshSession();
      await fetchVendor();
    } catch (err: any) {
      setErrorMessage(err.message || "Could not submit rating.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-xl mx-auto px-4 py-12 space-y-4 animate-pulse">
        <div className="h-4 bg-fest-parchment rounded w-20" />
        <div className="h-8 bg-fest-parchment rounded w-48" />
        <div className="h-28 bg-fest-parchment rounded-2xl" />
      </div>
    );
  }

  if (!data || !data.vendor) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-3">
        <h1 className="text-xl font-display font-black text-fest-charcoal">Stall Not Found</h1>
        <p className="text-xs text-fest-charcoalMuted">The requested food stall could not be found at Gachibowli Stadium.</p>
        <Link
          href="/vendors"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-fest-terracotta text-white font-display font-bold text-xs"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Festival Stalls</span>
        </Link>
      </div>
    );
  }

  const { vendor, stats } = data;
  const isFood = vendor.vendorType === "FOOD";

  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Back button */}
      <div>
        <Link
          href="/vendors"
          className="inline-flex items-center gap-1.5 text-xs font-display font-bold text-slate-400 hover:text-white transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to All Stalls</span>
        </Link>
      </div>

      {/* Festival Stall Board Banner */}
      <div className="glass-panel float-card p-6 sm:p-7 rounded-2xl border border-white/10 space-y-5">
        {/* Top Badges */}
        <div className="flex items-center justify-between gap-2 flex-wrap pb-3 border-b border-white/8">
          <div className="flex items-center gap-2">
            <span className="font-display text-xs font-bold text-white bg-white/5 px-2.5 py-1 rounded-lg border border-white/10">
              Stall {vendor.stallNumber}
            </span>
            <span className="text-xs font-display font-medium text-slate-300 bg-white/5 px-2.5 py-1 rounded-full border border-white/5">
              {vendor.cuisine ? `${vendor.cuisine} • ${vendor.category}` : vendor.category}
            </span>
          </div>

          {stats.rank && (
            <span className="inline-flex items-center gap-1.5 text-xs font-display font-bold text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20 shadow-[0_0_12px_rgba(245,158,11,0.2)]">
              <Trophy className="w-3.5 h-3.5 stroke-[1.5]" />
              <span>#{stats.rank} Leaderboard</span>
            </span>
          )}
        </div>

        {/* Title & Description */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-black text-white tracking-tight">
            {vendor.name}
          </h1>

          {vendor.description && (
            <p className="text-sm text-slate-400 mt-2.5 leading-relaxed font-sans">
              {vendor.description}
            </p>
          )}
        </div>

        {/* Live Score Summary */}
        {isFood && (
          <div className="flex items-baseline gap-4 pt-1">
            <div className="flex items-baseline gap-2">
              <Star className="w-6 h-6 fill-amber-400 text-amber-300 stroke-[1.5] self-center drop-shadow-[0_0_10px_rgba(245,158,11,0.5)]" />
              <span className="text-3xl font-display font-black text-white">
                {stats.totalRatings > 0 ? stats.averageRating.toFixed(2) : "New"}
              </span>
              <span className="text-xs text-slate-400 font-medium">
                out of 5 stars
              </span>
            </div>

            <div className="text-xs text-slate-500">
              • <strong className="text-slate-300 font-semibold">{stats.totalRatings.toLocaleString()}</strong> verified festival ratings
            </div>
          </div>
        )}

        {/* In-Place Passport Rating Area */}
        {isFood && (
          <div className="pt-2 border-t border-white/8">
            {submitMessage && (
              <div className="mb-3 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                <span className="font-semibold">{submitMessage}</span>
              </div>
            )}

            {errorMessage && (
              <div className="mb-3 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span className="font-medium">{errorMessage}</span>
              </div>
            )}

            {authenticated ? (
              <div className="p-4 bg-slate-900/60 rounded-xl border border-white/10 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-display font-bold text-slate-200">
                    {userRating > 0 ? "Your current score:" : "How was this dish?"}
                  </span>
                  <span className="text-[11px] font-display font-bold text-amber-400">
                    {remainingQuota} stamps left today
                  </span>
                </div>

                <StarRating
                  value={userRating}
                  size="lg"
                  showLabel
                  onChange={(stars) => handleRateVendor(stars)}
                />
              </div>
            ) : (
              <Link
                href={`/vote?vendorId=${vendor.id}`}
                className="w-full flex items-center justify-center gap-2 h-12 rounded-xl bg-linear-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 active-press text-slate-950 font-display font-black text-sm shadow-[0_0_20px_rgba(245,158,11,0.3)] transition"
              >
                <Ticket className="w-4 h-4" />
                <span>Rate this stall with your pass</span>
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Rating Distribution Breakdown */}
      {isFood && stats.totalRatings > 0 && (
        <div className="glass-panel float-card rounded-2xl p-6 border border-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-bold text-xs uppercase tracking-wider text-slate-200">
              Rating Distribution
            </h2>
            <span className="text-xs text-slate-500">
              {stats.totalRatings} total scores
            </span>
          </div>

          <RatingDistribution
            distribution={stats.distribution}
            percentages={stats.percentages}
            totalRatings={stats.totalRatings}
          />
        </div>
      )}
    </div>
  );
}
