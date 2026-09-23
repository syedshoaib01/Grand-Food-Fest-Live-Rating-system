"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Star, ArrowUp, ArrowDown, RefreshCw, Crown, ShieldAlert, Sparkles, Medal } from "lucide-react";

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
        <span className="text-[10px] font-display font-black text-fest-terracotta bg-fest-terracottaLight px-2 py-0.5 rounded-full border border-fest-terracotta/30">
          NEW
        </span>
      );
    }
    if (rankChange > 0) {
      return (
        <span className="inline-flex items-center gap-0.5 text-xs font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-200">
          <ArrowUp className="w-3 h-3 stroke-[3]" />
          <span>{rankChange}</span>
        </span>
      );
    }
    if (rankChange < 0) {
      return (
        <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-fest-charcoalMuted bg-fest-parchment px-1.5 py-0.5 rounded-md border border-fest-border">
          <ArrowDown className="w-3 h-3 stroke-[2.5]" />
          <span>{Math.abs(rankChange)}</span>
        </span>
      );
    }
    return (
      <span className="text-xs text-fest-charcoalTertiary font-medium px-1">
        —
      </span>
    );
  };

  const top3 = items.slice(0, 3);
  const remaining7 = items.slice(3, 10);

  return (
    <div className="space-y-4">
      {/* Header Bar with Live Badge & Refresh Button */}
      <div className="flex items-center justify-between gap-2 px-1">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-fest-saffronLight flex items-center justify-center text-fest-saffron">
            <Crown className="w-4 h-4 fill-fest-turmeric" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-display font-black text-lg sm:text-xl text-fest-charcoal tracking-tight">
                Official Festival Top 10
              </h2>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                LIVE
              </span>
            </div>
            <p className="text-[11px] text-fest-charcoalMuted font-medium">
              Verified Bayesian rankings • Min 20 ratings
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-fest-charcoalMuted text-xs">
          <span className="text-[11px] hidden sm:inline font-mono">
            updates in {countdown}s
          </span>
          <button
            type="button"
            onClick={() => fetchLeaderboard(true)}
            disabled={isRefreshing}
            className="p-2 rounded-xl bg-white border border-fest-border hover:bg-fest-parchment text-fest-charcoal transition active-press disabled:opacity-50 shadow-2xs"
            title="Refresh Leaderboard"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-fest-terracotta" : ""}`} />
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white p-5 rounded-2xl border border-fest-border animate-pulse h-36" />
            ))}
          </div>
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center border border-fest-border shadow-card space-y-3">
          <div className="w-12 h-12 rounded-full bg-fest-saffronLight flex items-center justify-center text-fest-saffron mx-auto">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h3 className="font-display font-extrabold text-base text-fest-charcoal">
            Top 10 Opening Soon
          </h3>
          <p className="text-xs text-fest-charcoalMuted max-w-sm mx-auto leading-relaxed">
            Stalls require at least 20 verified attendee ratings to unlock the official festival podium. Start rating what you taste!
          </p>
          <Link
            href="/vote"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-fest-terracotta to-fest-ember text-white font-display font-bold text-xs shadow-xs hover:opacity-95 transition active-press"
          >
            <Star className="w-3.5 h-3.5 fill-white/40" />
            <span>Rate your food now</span>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Top 3 Festival Podium Cards */}
          {top3.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {top3.map((item, idx) => {
                const isFirst = item.rank === 1;
                const isSecond = item.rank === 2;
                const medalColor = isFirst
                  ? "bg-gradient-to-b from-amber-400 to-amber-500 text-amber-950 border-amber-300"
                  : isSecond
                  ? "bg-gradient-to-b from-slate-200 to-slate-300 text-slate-900 border-slate-300"
                  : "bg-gradient-to-b from-amber-600 to-amber-700 text-amber-100 border-amber-600";

                const cardBg = isFirst
                  ? "bg-gradient-to-b from-[#FFFDF9] to-[#FFF8EE] border-fest-turmeric/50 shadow-warm ring-2 ring-fest-turmeric/20"
                  : "bg-white border-fest-border shadow-card";

                return (
                  <div
                    key={item.vendorId}
                    className={`rounded-2xl p-4 sm:p-5 border transition-all duration-200 flex flex-col justify-between relative overflow-hidden group ${cardBg}`}
                  >
                    {/* Top Medallion & Rank Change */}
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-7 h-7 rounded-xl flex items-center justify-center font-display font-black text-xs shadow-xs border ${medalColor}`}
                        >
                          {item.rank}
                        </span>
                        <span className="font-display text-[10px] font-black text-fest-charcoal bg-white px-2 py-0.5 rounded-md border border-fest-border shadow-2xs">
                          Stall {item.stallNumber}
                        </span>
                      </div>

                      <div className="text-right">
                        {renderTrendBadge(item.trendFormatted, item.rankChange)}
                      </div>
                    </div>

                    {/* Stall Name & Cuisine */}
                    <div>
                      <Link href={`/vendors/${item.slug}`} className="block">
                        <h3 className="font-display font-black text-base sm:text-lg text-fest-charcoal group-hover:text-fest-terracotta transition-colors line-clamp-1">
                          {item.name}
                        </h3>
                      </Link>
                      <p className="text-[11px] font-semibold text-fest-saffronDark mt-0.5 truncate">
                        {item.cuisine ? `${item.cuisine} • ${item.category}` : item.category}
                      </p>
                    </div>

                    {/* Score Bar */}
                    <div className="mt-4 pt-3 border-t border-fest-parchment flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Star className="w-4 h-4 fill-fest-turmeric text-fest-saffron" />
                        <span className="font-display font-extrabold text-base text-fest-charcoal">
                          {item.ratingAverage.toFixed(2)}
                        </span>
                      </div>

                      <span className="text-[11px] font-bold text-fest-charcoalMuted">
                        {item.ratingCount} {item.ratingCount === 1 ? "tasting" : "tastings"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Ranks 4 to 10 List */}
          {remaining7.length > 0 && (
            <div className="bg-white rounded-2xl border border-fest-border shadow-card divide-y divide-fest-parchment overflow-hidden">
              <div className="px-4 py-2.5 bg-fest-parchment/60 border-b border-fest-border flex items-center justify-between text-xs font-display font-bold text-fest-charcoalMuted">
                <span>Festival Contenders (Ranks 4–10)</span>
                <span>Ratings & Score</span>
              </div>

              {remaining7.map((item) => (
                <div
                  key={item.vendorId}
                  className="p-3.5 sm:px-5 flex items-center justify-between hover:bg-fest-cream/60 transition-colors group"
                >
                  <div className="flex items-center gap-3 min-w-0 pr-2">
                    <span className="w-6 text-center font-display font-black text-sm text-fest-charcoalTertiary shrink-0">
                      {String(item.rank).padStart(2, "0")}
                    </span>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <Link
                          href={`/vendors/${item.slug}`}
                          className="font-display font-extrabold text-sm sm:text-base text-fest-charcoal group-hover:text-fest-terracotta transition-colors truncate"
                        >
                          {item.name}
                        </Link>
                        <span className="font-display text-[10px] font-bold text-fest-charcoalMuted bg-fest-parchment px-1.5 py-0.5 rounded border border-fest-border">
                          Stall {item.stallNumber}
                        </span>
                      </div>

                      <div className="text-[11px] text-fest-charcoalMuted mt-0.5 truncate">
                        {item.cuisine ? `${item.cuisine} • ${item.category}` : item.category}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 text-right">
                    <div>
                      <div className="flex items-center justify-end gap-1 font-display font-extrabold text-sm text-fest-charcoal">
                        <Star className="w-3.5 h-3.5 fill-fest-turmeric text-fest-saffron" />
                        <span>{item.ratingAverage.toFixed(2)}</span>
                      </div>
                      <div className="text-[10px] text-fest-charcoalTertiary font-medium">
                        {item.ratingCount} tastings
                      </div>
                    </div>

                    <div className="w-12 text-right">
                      {renderTrendBadge(item.trendFormatted, item.rankChange)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Footer with Truthful Stats */}
          <div className="px-4 py-3 bg-fest-parchment/70 rounded-xl border border-fest-border flex flex-col xs:flex-row items-center justify-between text-xs text-fest-charcoalMuted gap-1">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-fest-saffron" />
              <span>Live festival ranking calculated from attendee votes</span>
            </span>
            <span className="font-display font-bold text-fest-charcoal">
              {totalVotes.toLocaleString()} festival tastings logged
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
