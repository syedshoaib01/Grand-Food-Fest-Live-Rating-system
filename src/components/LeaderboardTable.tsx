"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Star, ArrowUp, ArrowDown, RefreshCw, Crown, ShieldAlert } from "lucide-react";

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
  const [countdown, setCountdown] = useState(20);

  const fetchLeaderboard = async (showPulse = false) => {
    if (showPulse) setIsRefreshing(true);
    try {
      const res = await fetch("/api/leaderboard", { cache: "no-store" });
      const data = await res.json();
      if (res.ok) {
        setItems(data.top10 || []);
        setTotalVotes(data.totalVotesCounted || 0);
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
        <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200/60">
          NEW
        </span>
      );
    }
    if (rankChange > 0) {
      return (
        <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-emerald-700">
          <ArrowUp className="w-3 h-3 stroke-[2.5]" />
          <span>{rankChange}</span>
        </span>
      );
    }
    if (rankChange < 0) {
      return (
        <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-stone-500">
          <ArrowDown className="w-3 h-3 stroke-[2.5]" />
          <span>{Math.abs(rankChange)}</span>
        </span>
      );
    }
    return (
      <span className="text-xs text-stone-400 font-medium">
        —
      </span>
    );
  };

  return (
    <div className="bg-white rounded-2xl border border-stone-200/80 shadow-xs overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3.5 sm:px-6 border-b border-stone-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-bold text-stone-950">
            Top 10 right now
          </h2>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
            LIVE
          </span>
        </div>

        <div className="flex items-center gap-2 text-stone-400">
          <span className="text-[11px] hidden sm:inline">
            Refreshes in {countdown}s
          </span>
          <button
            type="button"
            onClick={() => fetchLeaderboard(true)}
            disabled={isRefreshing}
            className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-500 transition active:scale-95 disabled:opacity-50"
            title="Refresh Leaderboard"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-amber-600" : ""}`} />
          </button>
        </div>
      </div>

      {/* Leaderboard Rows */}
      <div className="divide-y divide-stone-100">
        {isLoading ? (
          <div className="p-5 space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="animate-pulse flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded bg-stone-100" />
                  <div className="space-y-1">
                    <div className="h-4 bg-stone-200 rounded w-28" />
                    <div className="h-3 bg-stone-100 rounded w-20" />
                  </div>
                </div>
                <div className="h-4 bg-stone-200 rounded w-16" />
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="p-8 text-center space-y-2">
            <ShieldAlert className="w-8 h-8 text-amber-500 mx-auto" />
            <h3 className="font-semibold text-stone-900 text-sm">Rating Threshold in Progress</h3>
            <p className="text-xs text-stone-500 max-w-sm mx-auto">
              Stalls require at least 20 ratings to appear on the official Top 10.
            </p>
            <Link
              href="/vote"
              className="inline-block mt-2 px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs transition"
            >
              Rate stalls now
            </Link>
          </div>
        ) : (
          items.map((item) => {
            const isFirst = item.rank === 1;

            return (
              <div
                key={item.vendorId}
                className={`p-3.5 sm:px-6 flex items-center justify-between transition ${
                  isFirst
                    ? "bg-amber-50/40"
                    : "hover:bg-stone-50/60"
                }`}
              >
                {/* Left: Rank, Name, Stall, Rating line */}
                <div className="flex items-center gap-3 min-w-0 pr-3">
                  <div className="w-6 shrink-0 flex items-center justify-center font-mono text-sm font-bold">
                    {isFirst ? (
                      <span className="text-amber-600 flex items-center justify-center">
                        <Crown className="w-4 h-4 fill-amber-500" />
                      </span>
                    ) : (
                      <span className="text-stone-400">
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
                      <span className="font-mono text-[10px] font-semibold text-stone-500 bg-stone-100 px-1.5 py-0.5 rounded">
                        {item.stallNumber}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 text-xs text-stone-500 mt-0.5">
                      <span className="inline-flex items-center gap-0.5 font-medium text-stone-800">
                        ⭐ {item.ratingAverage.toFixed(2)}
                      </span>
                      <span>·</span>
                      <span>{item.ratingCount.toLocaleString()} ratings</span>
                    </div>
                  </div>
                </div>

                {/* Right: Movement */}
                <div className="shrink-0 text-right">
                  {renderTrendBadge(item.trendFormatted, item.rankChange)}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Quiet Footer */}
      <div className="px-4 py-2.5 bg-stone-50/50 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-400">
        <span>Live ranking based on attendee ratings</span>
        <span>{totalVotes.toLocaleString()} votes counted</span>
      </div>
    </div>
  );
}
