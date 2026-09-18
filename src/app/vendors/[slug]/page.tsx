"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Star,
  MapPin,
  Trophy,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Clock,
  Ticket,
} from "lucide-react";
import StarRating from "@/components/StarRating";
import RatingDistribution from "@/components/RatingDistribution";
import { useSession } from "@/lib/SessionContext";

export default function VendorDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const { authenticated, passToken, remainingQuota, ratedVendors, refreshSession } = useSession();

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
      setSubmitMessage("Your rating has been recorded!");
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
        <div className="h-4 bg-stone-200 rounded w-24" />
        <div className="h-8 bg-stone-200 rounded w-48" />
        <div className="h-48 bg-stone-200 rounded-2xl" />
      </div>
    );
  }

  if (!data || !data.vendor) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-3">
        <h1 className="text-xl font-bold text-stone-900">Stall Not Found</h1>
        <p className="text-xs text-stone-500">The requested food stall could not be found.</p>
        <Link
          href="/vendors"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 text-white font-bold text-xs"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Directory</span>
        </Link>
      </div>
    );
  }

  const { vendor, stats, nominations, awardsWon } = data;
  const isFood = vendor.vendorType === "FOOD";

  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 py-6 space-y-5">
      {/* Back button */}
      <div>
        <Link
          href="/vendors"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-500 hover:text-stone-900 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Stalls</span>
        </Link>
      </div>

      {/* Main Vendor Header Card */}
      <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-sm space-y-4">
        {/* Stall & Rank Pills */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-stone-100 text-stone-800">
              Stall {vendor.stallNumber}
            </span>
            <span className="text-xs font-semibold text-stone-600 bg-stone-50 px-2 py-0.5 rounded border border-stone-200">
              {vendor.category}
            </span>
            {vendor.cuisine && (
              <span className="text-xs text-amber-800 font-medium">
                {vendor.cuisine}
              </span>
            )}
          </div>

          {stats.rank && (
            <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
              <Trophy className="w-3.5 h-3.5 text-amber-600" />
              <span>#{stats.rank} right now</span>
            </span>
          )}
        </div>

        {/* Vendor Name */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
            {vendor.name}
          </h1>
          {vendor.description && (
            <p className="text-xs sm:text-sm text-stone-600 mt-1 leading-relaxed">
              {vendor.description}
            </p>
          )}
        </div>

        {/* Rating Overview */}
        {isFood && (
          <div className="flex items-center justify-between p-3.5 bg-stone-50 rounded-xl border border-stone-200/80">
            <div>
              <div className="text-[11px] font-semibold text-stone-500 uppercase tracking-wide">
                Live Rating
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Star className="w-5 h-5 fill-amber-400 text-amber-500" />
                <span className="text-2xl font-extrabold text-stone-900 font-mono">
                  {stats.totalRatings > 0 ? stats.averageRating.toFixed(2) : "New"}
                </span>
                <span className="text-xs text-stone-500">/ 5.0</span>
              </div>
            </div>

            <div className="text-right">
              <div className="text-xs font-bold text-stone-800">
                {stats.totalRatings.toLocaleString()}
              </div>
              <div className="text-[11px] text-stone-500">total ratings</div>
            </div>
          </div>
        )}
      </div>

      {/* Interactive Rate This Stall Box */}
      {isFood && (
        <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-stone-900 flex items-center gap-1.5">
              <Star className="w-4 h-4 text-amber-600 fill-amber-500" />
              <span>Rate this stall</span>
            </h2>
            {authenticated && (
              <span className="text-[11px] text-stone-500">
                {remainingQuota} votes left today
              </span>
            )}
          </div>

          {submitMessage && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{submitMessage}</span>
            </div>
          )}

          {errorMessage && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {authenticated ? (
            <div className="space-y-3 pt-1">
              <p className="text-xs text-stone-500">
                Tap stars to record your rating:
              </p>
              <StarRating
                value={userRating}
                size="lg"
                showLabel
                onChange={(stars) => handleRateVendor(stars)}
              />
              {userRating > 0 && (
                <p className="text-[11px] text-emerald-700 font-semibold">
                  ✓ Your active vote: {userRating} stars (tap to change)
                </p>
              )}
            </div>
          ) : (
            <div className="pt-1">
              <p className="text-xs text-stone-600 mb-3">
                Identify with your festival pass to vote for {vendor.name}.
              </p>
              <Link
                href={`/vote?vendorId=${vendor.id}`}
                className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-amber-600 hover:bg-amber-700 active:scale-[0.98] text-white font-bold text-xs shadow-sm transition"
              >
                <Ticket className="w-4 h-4" />
                <span>Rate this stall with pass</span>
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Rating Distribution */}
      {isFood && stats.totalRatings > 0 && (
        <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-sm space-y-3">
          <h2 className="text-sm font-bold text-stone-900">Rating Breakdown</h2>
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
