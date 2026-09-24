"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Star, ArrowUp, ArrowDown, RefreshCw, Crown, ShieldAlert, Sparkles } from "lucide-react";

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

function CountdownIndicator({ onRefresh }: { onRefresh: () => void }) {
  const [count, setCount] = useState(20);

  useEffect(() => {
    const t = setInterval(() => {
      setCount((prev) => {
        if (prev <= 1) {
          onRefresh();
          return 20;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [onRefresh]);

  return (
    <span className="text-[11px] hidden sm:inline font-mono text-slate-400">
      updates in {count}s
    </span>
  );
}

export default function LeaderboardTable({ initialData }: { initialData?: LeaderboardItem[] }) {
  const [items, setItems] = useState<LeaderboardItem[]>(initialData || []);
  const [totalVotes, setTotalVotes] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(!initialData);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchLeaderboard = useCallback(async (showPulse = false) => {
    if (showPulse) setIsRefreshing(true);
    try {
      const res = await fetch("/api/leaderboard", { cache: "no-store" });
      const data = await res.json();
      if (res.ok) {
        setItems(data.top10 || []);
        setTotalVotes(data.totalVotesCounted || 0);
      }
    } catch (err) {
      console.error("Leaderboard refresh error:", err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  const renderTrendBadge = (trendFormatted: string, rankChange: number) => {
    if (trendFormatted === "NEW") {
      return (
        <span className="text-[10px] font-display font-black text-orange-700 bg-orange-100 px-2 py-0.5 rounded-full border border-orange-200">
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
        <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded-md border border-slate-200">
          <ArrowDown className="w-3 h-3 stroke-[2.5]" />
          <span>{Math.abs(rankChange)}</span>
        </span>
      );
    }
    return (
      <span className="text-xs text-slate-400 font-medium px-1">
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
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-600 shadow-2xs">
            <Crown className="w-4 h-4 fill-orange-500 text-orange-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-display font-black text-lg sm:text-xl text-slate-900 tracking-tight">
                Official Festival Top 10
              </h2>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_6px_#10B981]" />
                LIVE
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">
              Verified Bayesian rankings • Min 20 ratings
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-slate-500 text-xs">
          <CountdownIndicator onRefresh={() => fetchLeaderboard(false)} />
          <button
            type="button"
            onClick={() => fetchLeaderboard(true)}
            disabled={isRefreshing}
            className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 transition active-press disabled:opacity-50 shadow-2xs"
            title="Refresh Leaderboard"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-orange-600" : ""}`} />
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white p-5 rounded-2xl border border-slate-200 animate-pulse h-36" />
            ))}
          </div>
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-3xl p-8 text-center border border-slate-200 shadow-sm space-y-3">
          <div className="w-12 h-12 rounded-full bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-600 mx-auto">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h3 className="font-display font-extrabold text-base text-slate-900">
            Top 10 Opening Soon
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
            Stalls require at least 20 verified attendee ratings to unlock the official festival podium. Start rating what you taste!
          </p>
          <Link
            href="/vote"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-display font-bold text-xs shadow-xs hover:opacity-95 transition active-press"
          >
            <Star className="w-3.5 h-3.5 fill-white" />
            <span>Rate your food now</span>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Top 3 Festival Podium Cards */}
          {top3.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              {top3.map((item) => {
                const isFirst = item.rank === 1;
                const isSecond = item.rank === 2;
                const medalBadge = isFirst
                  ? "bg-amber-400 text-white border-amber-300 shadow-sm"
                  : isSecond
                  ? "bg-slate-600 text-white border-slate-500 shadow-2xs"
                  : "bg-orange-600 text-white border-orange-500 shadow-2xs";

                const cardStyling = isFirst
                  ? "glass-panel-gold border-amber-300 ring-2 ring-amber-300/40"
                  : isSecond
                  ? "bg-white border-slate-200 shadow-sm"
                  : "bg-white border-orange-100 shadow-sm";

                return (
                  <div
                    key={item.vendorId}
                    className={`rounded-3xl p-5 flex flex-col justify-between relative overflow-hidden group float-card ${cardStyling}`}
                  >
                    {/* Top Medallion & Rank Change */}
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-7 h-7 rounded-xl flex items-center justify-center font-display font-black text-xs border ${medalBadge}`}
                        >
                          {item.rank}
                        </span>
                        <span className="font-display text-[10px] font-bold text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200 shadow-2xs">
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
                        <h3 className="font-display font-black text-base text-slate-900 group-hover:text-orange-600 transition-colors line-clamp-1">
                          {item.name}
                        </h3>
                      </Link>
                      <p className="text-[11px] font-medium text-slate-500 mt-0.5 truncate">
                        {item.cuisine ? `${item.cuisine} • ${item.category}` : item.category}
                      </p>
                    </div>

                    {/* Score Bar */}
                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Star className="w-4 h-4 fill-amber-400 text-amber-500 stroke-[1.5]" />
                        <span className="font-display font-black text-base text-slate-900">
                          {item.ratingAverage.toFixed(2)}
                        </span>
                      </div>

                      <span className="text-[11px] font-medium text-slate-400">
                        {item.ratingCount} {item.ratingCount === 1 ? "tasting" : "tastings"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Ranks 4 to 10 List - Clean White Container */}
          {remaining7.length > 0 && (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm divide-y divide-slate-100 overflow-hidden">
              <div className="px-5 py-3 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between text-xs font-display font-bold text-slate-500">
                <span>Festival Contenders (Ranks 4–10)</span>
                <span>Ratings & Score</span>
              </div>

              {remaining7.map((item) => (
                <div
                  key={item.vendorId}
                  className="p-3.5 sm:px-5 flex items-center justify-between hover:bg-orange-50/40 transition-colors group"
                >
                  <div className="flex items-center gap-3 min-w-0 pr-2">
                    <span className="w-6 text-center font-display font-black text-sm text-slate-400 shrink-0">
                      {String(item.rank).padStart(2, "0")}
                    </span>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <Link
                          href={`/vendors/${item.slug}`}
                          className="font-display font-black text-sm sm:text-base text-slate-900 group-hover:text-orange-600 transition-colors truncate"
                        >
                          {item.name}
                        </Link>
                        <span className="font-display text-[10px] font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                          Stall {item.stallNumber}
                        </span>
                      </div>

                      <div className="text-[11px] text-slate-500 mt-0.5 truncate">
                        {item.cuisine ? `${item.cuisine} • ${item.category}` : item.category}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 text-right">
                    <div>
                      <div className="flex items-center justify-end gap-1 font-display font-black text-sm text-slate-900">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                        <span>{item.ratingAverage.toFixed(2)}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-medium">
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
          <div className="px-4 py-3 bg-white rounded-2xl border border-slate-200 flex flex-col xs:flex-row items-center justify-between text-xs text-slate-600 gap-1 shadow-2xs">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-orange-600" />
              <span>Live festival ranking calculated from verified attendee votes</span>
            </span>
            <span className="font-display font-bold text-slate-900">
              {totalVotes.toLocaleString()} festival tastings logged
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
