"use client";

import React, { useState, useEffect } from "react";
import LeaderboardTable from "@/components/LeaderboardTable";
import TrendingSection from "@/components/TrendingSection";
import { Star, Trophy, Sparkles } from "lucide-react";
import Link from "next/link";

export default function LeaderboardPage() {
  const [activeTab, setActiveTab] = useState<"top10" | "all">("top10");
  const [allRanked, setAllRanked] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState<any>(null);

  const fetchAllRanked = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/leaderboard");
      const data = await res.json();
      if (res.ok) {
        setAllRanked(data.allRanked || []);
        setStats(data);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllRanked();
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Page Header */}
      <div className="space-y-3 pb-3 border-b border-fest-border">
        <div className="flex items-center gap-1.5 text-xs font-display font-black tracking-wider uppercase text-fest-terracotta">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Gachibowli Stadium Live Rankings</span>
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-black text-fest-charcoal tracking-tight">
            Festival Leaderboard
          </h1>
          <p className="text-xs sm:text-sm text-fest-charcoalMuted mt-0.5">
            Real-time standings powered by confidence-adjusted Bayesian scoring. Minimum 20 verified ratings required for the official podium.
          </p>
        </div>

        {/* Tab Toggle */}
        <div className="flex items-center gap-1 p-1 bg-fest-parchment rounded-xl max-w-xs border border-fest-border">
          <button
            type="button"
            onClick={() => setActiveTab("top10")}
            className={`flex-1 py-1.5 rounded-lg text-xs font-display font-bold transition active-press ${
              activeTab === "top10"
                ? "bg-white text-fest-charcoal shadow-xs"
                : "text-fest-charcoalMuted hover:text-fest-charcoal"
            }`}
          >
            Official Top 10
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("all")}
            className={`flex-1 py-1.5 rounded-lg text-xs font-display font-bold transition active-press ${
              activeTab === "all"
                ? "bg-white text-fest-charcoal shadow-xs"
                : "text-fest-charcoalMuted hover:text-fest-charcoal"
            }`}
          >
            All Stalls ({stats?.totalFoodVendors || 124})
          </button>
        </div>
      </div>

      {/* Trending Now */}
      <TrendingSection />

      {/* Leaderboard View */}
      {activeTab === "top10" ? (
        <LeaderboardTable />
      ) : (
        <div className="bg-white rounded-2xl border border-fest-border shadow-card overflow-hidden">
          <div className="px-4 py-3 bg-fest-parchment/70 border-b border-fest-border flex items-center justify-between text-xs font-display font-bold text-fest-charcoalMuted">
            <span className="text-fest-charcoal font-black">All Competing Food Stalls</span>
            <span>{stats?.totalVotesCounted?.toLocaleString()} total tastings recorded</span>
          </div>

          <div className="divide-y divide-fest-parchment">
            {allRanked.map((v) => (
              <div
                key={v.vendorId}
                className="p-3.5 sm:px-5 flex items-center justify-between hover:bg-fest-cream/60 transition-colors group"
              >
                <div className="flex items-center gap-3 min-w-0 pr-2">
                  <span className="font-display text-xs font-black text-fest-charcoalTertiary w-7 text-center shrink-0">
                    #{v.rank}
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Link
                        href={`/vendors/${v.slug}`}
                        className="font-display font-extrabold text-sm sm:text-base text-fest-charcoal group-hover:text-fest-terracotta transition-colors truncate"
                      >
                        {v.name}
                      </Link>
                      <span className="font-display text-[10px] font-black px-1.5 py-0.5 rounded bg-fest-parchment text-fest-charcoal border border-fest-border">
                        Stall {v.stallNumber}
                      </span>
                    </div>
                    <div className="text-[11px] text-fest-charcoalMuted mt-0.5 truncate">
                      {v.cuisine ? `${v.cuisine} • ${v.category}` : v.category}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 sm:gap-4 shrink-0 text-right">
                  <div>
                    <div className="flex items-center justify-end gap-1 font-display font-extrabold text-sm text-fest-charcoal">
                      <Star className="w-3.5 h-3.5 fill-fest-turmeric text-fest-saffron" />
                      <span>{v.ratingAverage.toFixed(2)}</span>
                    </div>
                    <div className="text-[10px] text-fest-charcoalMuted">{v.ratingCount} ratings</div>
                  </div>

                  <div>
                    {v.isEligibleForLeaderboard ? (
                      <span className="px-2.5 py-1 rounded-md text-[10px] font-display font-black bg-emerald-50 text-emerald-800 border border-emerald-200">
                        Podium Eligible
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-display font-semibold bg-fest-parchment text-fest-charcoalTertiary border border-fest-border">
                        Needs {Math.max(0, 20 - v.ratingCount)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
