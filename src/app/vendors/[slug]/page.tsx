"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Star,
  MapPin,
  Trophy,
  TrendingUp,
  Award,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Ticket,
  Clock,
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

  // Check if current user already rated this vendor
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
      <div className="max-w-4xl mx-auto px-4 py-12 space-y-6 animate-pulse">
        <div className="h-6 bg-gray-800 rounded w-28" />
        <div className="h-10 bg-gray-800 rounded w-1/2" />
        <div className="h-64 bg-gray-800 rounded-2xl" />
      </div>
    );
  }

  if (!data || !data.vendor) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <h1 className="text-2xl font-bold text-white">Vendor Not Found</h1>
        <p className="text-sm text-gray-400">The requested festival stall could not be found.</p>
        <Link
          href="/vendors"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-fest-gold text-black font-bold text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Directory
        </Link>
      </div>
    );
  }

  const { vendor, stats, nominations, awardsWon } = data;
  const isFood = vendor.vendorType === "FOOD";

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Back button */}
      <div>
        <Link
          href="/vendors"
          className="inline-flex items-center gap-2 text-xs font-semibold text-gray-400 hover:text-white transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Vendor Directory
        </Link>
      </div>

      {/* Main Vendor Header Card */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-fest-border shadow-2xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="space-y-3 flex-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-mono font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                <MapPin className="w-3.5 h-3.5" />
                Stall {vendor.stallNumber}
              </span>
              <span className="px-3 py-1 rounded-xl text-xs font-semibold bg-gray-800 text-gray-300">
                {vendor.category}
              </span>
              {vendor.cuisine && (
                <span className="px-3 py-1 rounded-xl text-xs font-semibold bg-fest-card text-amber-300 border border-fest-border">
                  {vendor.cuisine} Cuisine
                </span>
              )}
            </div>

            <h1 className="text-3xl sm:text-4xl font-black text-white">{vendor.name}</h1>

            {vendor.description && (
              <p className="text-sm sm:text-base text-gray-300 leading-relaxed max-w-2xl">
                {vendor.description}
              </p>
            )}

            <div className="flex items-center gap-2 text-xs text-gray-400 pt-1">
              <Clock className="w-3.5 h-3.5 text-gray-400" />
              <span>Open Festival Hours: 3:00 PM – 1:00 AM Daily</span>
            </div>
          </div>

          {/* Right Stats Card */}
          {isFood && (
            <div className="bg-fest-dark/80 p-6 rounded-2xl border border-fest-border shrink-0 min-w-[240px] space-y-4 text-center sm:text-left">
              <div>
                <div className="text-xs text-gray-400 font-semibold uppercase tracking-wider">
                  Overall Rating
                </div>
                <div className="flex items-center gap-2 mt-1 justify-center sm:justify-start">
                  <Star className="w-6 h-6 fill-fest-gold text-fest-gold" />
                  <span className="text-3xl font-black text-white">
                    {stats.totalRatings > 0 ? stats.averageRating.toFixed(2) : "New"}
                  </span>
                  <span className="text-xs text-gray-400">/ 5.0</span>
                </div>
                <div className="text-xs text-gray-400 mt-0.5">
                  Based on {stats.totalRatings.toLocaleString()} ratings
                </div>
              </div>

              {stats.rank && (
                <div className="pt-3 border-t border-fest-border flex items-center justify-between">
                  <span className="text-xs text-gray-400 font-medium">Live Rank</span>
                  <span className="text-lg font-black text-amber-400 flex items-center gap-1.5">
                    #{stats.rank}
                    {stats.trend && stats.trend !== "—" && (
                      <span className="text-xs text-green-400 font-bold">{stats.trend}</span>
                    )}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Two Column Layout: Interactive Rate Form + Real Rating Distribution */}
      {isFood && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Rate This Stall Section */}
          <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-fest-border space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-fest-gold flex items-center justify-center">
                <Star className="w-5 h-5 fill-fest-gold" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Rate This Food Stall</h2>
                <p className="text-xs text-gray-400">
                  {authenticated
                    ? `Logged in with ${passToken} (${remainingQuota} of 5 daily votes left)`
                    : "Enter your festival pass to vote"}
                </p>
              </div>
            </div>

            {submitMessage && (
              <div className="p-3.5 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{submitMessage}</span>
              </div>
            )}

            {errorMessage && (
              <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Star Rating Interactive Controls */}
            <div className="p-5 rounded-2xl bg-fest-dark border border-fest-border text-center space-y-3">
              <span className="text-xs text-gray-400 block">
                {userRating > 0 ? "Your Current Rating:" : "Tap a star to rate:"}
              </span>
              <div className="flex justify-center">
                <StarRating
                  value={userRating}
                  size="xl"
                  showLabel
                  onChange={(star) => handleRateVendor(star)}
                />
              </div>
              {userRating > 0 && (
                <p className="text-[11px] text-gray-400">
                  You can tap a different star anytime to update your vote for today.
                </p>
              )}
            </div>

            {!authenticated && (
              <div className="pt-2 text-center">
                <Link
                  href={`/vote?vendorId=${vendor.id}`}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-fest-gold text-black font-bold text-xs"
                >
                  <Ticket className="w-4 h-4" />
                  <span>Enter Pass to Rate</span>
                </Link>
              </div>
            )}
          </div>

          {/* Rating Distribution Breakdown */}
          <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-fest-border space-y-5">
            <div>
              <h2 className="text-xl font-bold text-white">Rating Distribution</h2>
              <p className="text-xs text-gray-400">
                Breakdown of {stats.totalRatings} authentic attendee votes
              </p>
            </div>

            <RatingDistribution
              distribution={stats.distribution}
              percentages={stats.percentages}
              totalRatings={stats.totalRatings}
            />

            <div className="pt-4 border-t border-fest-border text-xs text-gray-400">
              {stats.isEligibleForLeaderboard ? (
                <span className="text-green-400 font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  Official Top 10 Contender (≥20 ratings)
                </span>
              ) : (
                <span className="text-amber-400 font-medium">
                  Requires {Math.max(0, 20 - stats.totalRatings)} more ratings to qualify for official Top 10 leaderboard.
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Nominations & Awards */}
      {nominations && nominations.length > 0 && (
        <div className="glass-panel rounded-2xl p-6 border border-fest-border space-y-4">
          <div className="flex items-center gap-2.5">
            <Award className="w-5 h-5 text-fest-gold" />
            <h2 className="text-lg font-bold text-white">Festival Award Nominations</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {nominations.map((nom: any) => (
              <div
                key={nom.awardId}
                className="p-4 rounded-xl bg-fest-dark border border-fest-border space-y-1"
              >
                <div className="text-xs font-semibold text-amber-400">{nom.category}</div>
                <div className="font-bold text-white">{nom.awardName}</div>
                <div className="text-[11px] text-gray-400">
                  Status: {nom.status === "WINNER_ANNOUNCED" ? "Winner Announced 🏆" : "Official Nominee"}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
