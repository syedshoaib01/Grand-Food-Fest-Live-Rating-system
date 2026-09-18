"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Trophy, Star, TrendingUp, TrendingDown, Minus, RefreshCw, Crown, ShieldAlert } from "lucide-react";
import StarRating from "./StarRating";

export interface LeaderboardItem {
  rank: number;
  vendorId: string;
  name: string;
  slug: string;
  category: string;
  cuisine: string | null;
  stallNumber: string;
  ratingAverage: number;
  ratingCount: number;
  rankingScore: number;
  rankChange: number;
  trendFormatted: string;
  isTied: boolean;
  isEligibleForLeaderboard: boolean;
}

export default function LeaderboardTable({ initialData }: { initialData?: LeaderboardItem[] }) {
  const [items, setItems] = useState<LeaderboardItem[]>(initialData || []);
  const [totalVotes, setTotalVotes] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(!initialData);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [countdown, setCountdown] = useState(20);

  const fetchLeaderboard = async (showPulse = false) => {
    if (showPulse) setIsRefreshing(true);
    try {
      const res = await fetch("/api/leaderboard", { cache: "no-store" });
      const data = await res.json();
      if (res.ok) {
        setItems(data.top10 || []);
        setTotalVotes(data.totalVotesCounted || 0);
        setLastUpdated(new Date());
        setCountdown(20);
      }
    } catch (err) {
      console.error("Leaderboard refresh error:", err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
    // 20 second live refresh interval
    const interval = setInterval(() => {
      fetchLeaderboard();
    }, 20000);

    const countdownTimer = setInterval(() => {
      setCountdown((prev) => (prev > 1 ? prev - 1 : 20));
    }, 1000);

    return () => {
      clearInterval(interval);
      clearInterval(countdownTimer);
    };
  }, []);

  const getRankBadge = (rank: number) => {
    if (rank === 1) {
      return (
        <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-yellow-500 via-amber-400 to-yellow-200 text-black flex items-center justify-center font-extrabold shadow-lg shadow-yellow-500/30">
          <Crown className="w-5 h-5 fill-black" />
        </div>
      );
    }
    if (rank === 2) {
      return (
        <div className="w-8 h-8 rounded-full bg-slate-300 text-slate-900 flex items-center justify-center font-extrabold text-sm shadow">
          #2
        </div>
      );
    }
    if (rank === 3) {
      return (
        <div className="w-8 h-8 rounded-full bg-amber-700 text-amber-100 flex items-center justify-center font-extrabold text-sm shadow">
          #3
        </div>
      );
    }
    return (
      <div className="w-8 h-8 rounded-full bg-fest-card border border-fest-border text-gray-400 flex items-center justify-center font-bold text-sm">
        #{rank}
      </div>
    );
  };

  const renderTrend = (trendFormatted: string, rankChange: number) => {
    if (rankChange > 0) {
      return (
        <span className="inline-flex items-center gap-1 font-bold text-green-400 text-xs bg-green-500/10 px-2 py-0.5 rounded-full border border-green-500/20">
          <TrendingUp className="w-3 h-3" />
          {trendFormatted}
        </span>
      );
    }
    if (rankChange < 0) {
      return (
        <span className="inline-flex items-center gap-1 font-bold text-red-400 text-xs bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/20">
          <TrendingDown className="w-3 h-3" />
          {trendFormatted}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-0.5 text-gray-400 text-xs px-2 py-0.5">
        <Minus className="w-3 h-3 text-gray-500" />
      </span>
    );
  };

  return (
    <div className="glass-panel rounded-2xl overflow-hidden border border-fest-border shadow-2xl">
      {/* Header with Live pulse and refresh */}
      <div className="px-5 py-4 border-b border-fest-border flex items-center justify-between bg-fest-card/60">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-fest-gold flex items-center justify-center">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-extrabold text-lg sm:text-xl text-white flex items-center gap-2">
              <span>OFFICIAL TOP 10 FOOD LEADERBOARD</span>
              <span className="w-2 h-2 rounded-full bg-green-500 live-pulse inline-block" />
            </h2>
            <p className="text-xs text-gray-400">
              Ranked with Bayesian confidence rating • {totalVotes.toLocaleString()} votes counted
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <span className="text-[11px] text-gray-400 hidden sm:inline">
            Refresh in <strong className="text-amber-400">{countdown}s</strong>
          </span>
          <button
            onClick={() => fetchLeaderboard(true)}
            disabled={isRefreshing}
            className="p-2 rounded-lg bg-fest-card hover:bg-fest-cardHover border border-fest-border text-gray-300 hover:text-white transition disabled:opacity-50"
            title="Refresh Leaderboard Now"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin text-fest-gold" : ""}`} />
          </button>
        </div>
      </div>

      {/* Leaderboard Items */}
      <div className="divide-y divide-fest-border/60">
        {isLoading ? (
          <div className="p-8 space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="animate-pulse flex items-center gap-4">
                <div className="w-8 h-8 rounded-full bg-gray-800" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-800 rounded w-1/3" />
                  <div className="h-3 bg-gray-800/60 rounded w-1/4" />
                </div>
                <div className="w-16 h-8 bg-gray-800 rounded" />
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="p-12 text-center text-gray-400 space-y-3">
            <ShieldAlert className="w-12 h-12 mx-auto text-amber-500/60" />
            <h3 className="font-bold text-lg text-white">No Official Leaderboard Yet</h3>
            <p className="text-sm max-w-sm mx-auto">
              Vendors require a minimum of 20 ratings to enter the official Top 10. Start rating your favorite food stalls to push them onto the leaderboard!
            </p>
            <Link
              href="/vote"
              className="inline-block mt-2 px-5 py-2 rounded-xl bg-fest-gold text-black font-bold text-sm"
            >
              Rate a Vendor Now
            </Link>
          </div>
        ) : (
          items.map((item) => {
            return (
              <div
                key={item.vendorId}
                className={`p-4 sm:px-6 flex items-center justify-between hover:bg-fest-cardHover/50 transition duration-150 ${
                  item.rank === 1 ? "bg-amber-500/[0.04]" : ""
                }`}
              >
                {/* Left: Rank & Vendor details */}
                <div className="flex items-center gap-3.5 sm:gap-4 flex-1 min-w-0 pr-3">
                  <div className="shrink-0 flex items-center justify-center">
                    {getRankBadge(item.rank)}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link
                        href={`/vendors/${item.slug}`}
                        className="font-bold text-base sm:text-lg text-white hover:text-fest-gold transition truncate"
                      >
                        {item.name}
                      </Link>
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-gray-800 text-gray-300 border border-gray-700">
                        Stall {item.stallNumber}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-400">
                      <span>{item.category}</span>
                      {item.cuisine && (
                        <>
                          <span>•</span>
                          <span className="text-amber-400/80">{item.cuisine}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Score, Stars & Trend */}
                <div className="flex items-center gap-3 sm:gap-6 shrink-0">
                  <div className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Star className="w-4 h-4 fill-fest-gold text-fest-gold" />
                      <span className="font-extrabold text-base sm:text-lg text-white">
                        {item.ratingAverage.toFixed(2)}
                      </span>
                    </div>
                    <div className="text-[11px] text-gray-400">
                      {item.ratingCount.toLocaleString()} {item.ratingCount === 1 ? "rating" : "ratings"}
                    </div>
                  </div>

                  <div className="w-14 text-right">
                    {renderTrend(item.trendFormatted, item.rankChange)}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer disclaimer */}
      <div className="p-3 bg-fest-dark/60 text-center border-t border-fest-border/50 text-[11px] text-gray-400">
        Rankings update in real-time. Only vendors with ≥ 20 ratings compete on the official Top 10.
      </div>
    </div>
  );
}
