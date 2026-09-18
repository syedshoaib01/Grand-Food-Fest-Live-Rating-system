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
        <div className="h-4 bg-stone-100 rounded w-20" />
        <div className="h-8 bg-stone-200 rounded w-48" />
        <div className="h-24 bg-stone-100 rounded-xl" />
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
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 text-white font-semibold text-xs"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Directory</span>
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
          className="inline-flex items-center gap-1.5 text-xs font-medium text-stone-400 hover:text-stone-800 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Stalls</span>
        </Link>
      </div>

      {/* Simplified Vendor Header */}
      <div className="space-y-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="font-mono text-xs font-bold text-stone-600 bg-stone-100 px-2 py-0.5 rounded">
              Stall {vendor.stallNumber}
            </span>
            <span className="text-xs font-medium text-stone-500">
              {vendor.cuisine || vendor.category}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-stone-950 tracking-tight">
            {vendor.name}
          </h1>

          {vendor.description && (
            <p className="text-xs sm:text-sm text-stone-500 mt-1.5 leading-relaxed">
              {vendor.description}
            </p>
          )}
        </div>

        {/* Rating and Rank Overview */}
        {isFood && (
          <div className="flex items-baseline gap-3 flex-wrap pt-1">
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-bold text-stone-950 font-mono">
                ⭐ {stats.totalRatings > 0 ? stats.averageRating.toFixed(2) : "New"}
              </span>
              <span className="text-xs text-stone-500">
                ({stats.totalRatings.toLocaleString()} ratings)
              </span>
            </div>

            {stats.rank && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200/70">
                <Trophy className="w-3 h-3 text-amber-600" />
                <span>#{stats.rank} right now</span>
              </span>
            )}
          </div>
        )}

        {/* Rating action area */}
        {isFood && (
          <div className="pt-2">
            {submitMessage && (
              <div className="mb-3 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{submitMessage}</span>
              </div>
            )}

            {errorMessage && (
              <div className="mb-3 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                <span>{errorMessage}</span>
              </div>
            )}

            {authenticated ? (
              <div className="p-4 bg-white rounded-xl border border-stone-200/80 shadow-2xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-stone-900">
                    {userRating > 0 ? "Your active rating:" : "How was it?"}
                  </span>
                  <span className="text-[11px] text-stone-400">
                    {remainingQuota} ratings left today
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
                className="w-full flex items-center justify-center gap-2 h-12 rounded-xl bg-amber-600 hover:bg-amber-700 active:scale-[0.98] text-white font-semibold text-sm shadow-2xs transition"
              >
                <Ticket className="w-4 h-4" />
                <span>Rate this vendor</span>
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Rating Distribution Breakdown */}
      {isFood && stats.totalRatings > 0 && (
        <div className="pt-4 border-t border-stone-200/80 space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-stone-500">
            Rating breakdown
          </h2>
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
