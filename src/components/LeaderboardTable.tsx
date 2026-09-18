"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Trophy, Star, ArrowUp, ArrowDown, Minus, RefreshCw, Crown, Sparkles, ShieldAlert } from "lucide-react";

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

  const renderTrendBadge = (trendFormatted: string, rankChange: number) => {
    if (trendFormatted === "NEW") {
      return (
        <span className="inline-flex items-center text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-300">
          NEW
        </span>
      );
    }
    if (rankChange > 0) {
      return (
        <span className="inline-flex items-center gap-0.5 text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
          <ArrowUp className="w-3 h-3 stroke-[2.5]" />
          <span>{rankChange}</span>
        </span>
      );
    }
    if (rankChange < 0) {
      return (
        <span className="inline-flex items-center gap-0.5 text-xs font-bold text-rose-800 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
          <ArrowDown className="w-3 h-3 stroke-[2.5]" />
          <span>{Math.abs(rankChange)}</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center text-xs text-stone-400 font-bold px-1.5 py-0.5">
        —
      </span>
    );
  };

  return (
    <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-4 sm:px-6 border-b border-stone-100 flex items-center justify-between bg-stone-50/70">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-extrabold text-stone-900 flex items-center gap-1.5">
              <span>🔥 Top 10 right now</span>
            </h2>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
              LIVE
            </span>
          </div>
          <p className="text-xs text-stone-500 mt-0.5">
            Live ranking based on attendee ratings • {totalVotes.toLocaleString()} votes counted
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] text-stone-400 hidden sm:inline">
            Updates in <strong className="text-stone-700">{countdown}s</strong>
          </span>
          <button
            type="button"
            onClick={() => fetchLeaderboard(true)}
            disabled={isRefreshing}
            className="p-2 rounded-lg bg-white border border-stone-200 text-stone-600 hover:text-stone-900 transition active:scale-95 disabled:opacity-50"
            title="Refresh Leaderboard"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin text-amber-600" : ""}`} />
          </button>
        </div>
      </div>

      {/* Leaderboard Rows */}
      <div className="divide-y divide-stone-100">
        {isLoading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="animate-pulse flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-stone-200" />
                  <div className="space-y-1">
                    <div className="h-4 bg-stone-200 rounded w-28" />
                    <div className="h-3 bg-stone-100 rounded w-16" />
                  </div>
                </div>
                <div className="h-6 bg-stone-200 rounded w-14" />
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="p-10 text-center space-y-2">
            <ShieldAlert className="w-10 h-10 text-amber-500/70 mx-auto" />
            <h3 className="font-bold text-stone-900 text-base">Threshold in Progress</h3>
            <p className="text-xs text-stone-500 max-w-sm mx-auto">
              Food stalls require at least 20 verified ratings to qualify for the official Top 10. Start rating your favorites!
            </p>
            <Link
              href="/vote"
              className="inline-block mt-3 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs"
            >
              Rate Stalls Now
            </Link>
          </div>
        ) : (
          items.map((item, idx) => {
            const isFirst = item.rank === 1;

            return (
              <div
                key={item.vendorId}
                className={`p-3.5 sm:px-6 flex items-center justify-between transition ${
                  isFirst
                    ? "bg-amber-50/60 border-l-4 border-l-amber-500"
                    : "hover:bg-stone-50/80"
                }`}
              >
                {/* Left: Rank, Name, Stall, Category */}
                <div className="flex items-center gap-3 min-w-0 pr-2">
                  <div className="shrink-0 flex items-center justify-center">
                    {isFirst ? (
                      <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center font-extrabold shadow-sm">
                        <Crown className="w-4 h-4 fill-current" />
                      </div>
                    ) : (
                      <span className="font-mono text-sm sm:text-base font-extrabold text-stone-400 w-6 text-center">
                        {String(item.rank).padStart(2, "0")}
                      </span>
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Link
                        href={`/vendors/${item.slug}`}
                        className={`font-bold text-sm sm:text-base hover:text-amber-700 transition truncate ${
                          isFirst ? "text-stone-950 font-extrabold" : "text-stone-900"
                        }`}
                      >
                        {item.name}
                      </Link>
                      <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-stone-100 text-stone-600">
                        {item.stallNumber}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-[11px] text-stone-500 mt-0.5">
                      <span>{item.category}</span>
                      {item.cuisine && (
                        <>
                          <span>•</span>
                          <span>{item.cuisine}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Score, Ratings count, Movement */}
                <div className="flex items-center gap-3 sm:gap-5 shrink-0 text-right">
                  <div>
                    <div className="flex items-center justify-end gap-1">
                      <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
                      <span className="font-extrabold text-sm sm:text-base text-stone-900 font-mono">
                        {item.ratingAverage.toFixed(2)}
                      </span>
                    </div>
                    <div className="text-[11px] text-stone-500">
                      {item.ratingCount.toLocaleString()} ratings
                    </div>
                  </div>

                  <div className="w-12 text-right">
                    {renderTrendBadge(item.trendFormatted, item.rankChange)}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer info */}
      <div className="p-3 bg-stone-50 text-center border-t border-stone-100 text-[11px] text-stone-500">
        Leaderboard updates in real-time. Minimum 20 ratings required for Top 10 eligibility.
      </div>
    </div>
  );
}
