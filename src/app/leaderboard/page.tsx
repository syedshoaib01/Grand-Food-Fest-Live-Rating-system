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
      <div className="space-y-3 pb-3 border-b border-orange-100">
        <div className="flex items-center gap-1.5 text-xs font-display font-black tracking-wider uppercase text-orange-600">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Gachibowli Stadium Live Rankings</span>
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-black text-slate-900 tracking-tight">
            Festival Leaderboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Real-time standings powered by confidence-adjusted Bayesian scoring. Minimum 20 verified ratings required for the official podium.
          </p>
        </div>

        {/* Tab Toggle */}
        <div className="flex items-center gap-1 p-1 bg-white rounded-2xl max-w-xs border border-orange-200 shadow-2xs">
          <button
            type="button"
            onClick={() => setActiveTab("top10")}
            className={`flex-1 py-1.5 rounded-xl text-xs font-display transition active-press ${
              activeTab === "top10"
                ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold shadow-xs"
                : "text-slate-600 hover:text-slate-900 font-medium"
            }`}
          >
            Official Top 10
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("all")}
            className={`flex-1 py-1.5 rounded-xl text-xs font-display transition active-press ${
              activeTab === "all"
                ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold shadow-xs"
                : "text-slate-600 hover:text-slate-900 font-medium"
            }`}
          >
            All Stalls ({stats?.totalFoodVendors || 138})
          </button>
        </div>
      </div>

      {/* Trending Now */}
      <TrendingSection />

      {/* Leaderboard View */}
      {activeTab === "top10" ? (
        <LeaderboardTable />
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-xs font-display font-bold text-slate-600">
            <span className="text-slate-900 font-bold">All Competing Food Stalls</span>
            <span>{stats?.totalVotesCounted?.toLocaleString()} tastings recorded</span>
          </div>

          <div className="divide-y divide-slate-100">
            {allRanked.map((v) => (
              <div
                key={v.vendorId}
                className="contain-card p-3.5 sm:px-5 flex items-center justify-between hover:bg-orange-50/40 transition-colors group"
              >
                <div className="flex items-center gap-3 min-w-0 pr-2">
                  <span className="font-display text-xs font-black text-slate-400 w-7 text-center shrink-0">
                    #{v.rank}
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Link
                        href={`/vendors/${v.slug}`}
                        className="font-display font-black text-sm sm:text-base text-slate-900 group-hover:text-orange-600 transition-colors truncate"
                      >
                        {v.name}
                      </Link>
                      <span className="font-display text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                        Stall {v.stallNumber}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5 truncate">
                      {v.cuisine ? `${v.cuisine} • ${v.category}` : v.category}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 sm:gap-4 shrink-0 text-right">
                  <div>
                    <div className="flex items-center justify-end gap-1 font-display font-black text-sm text-slate-900">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500 stroke-[1.5]" />
                      <span>{v.ratingAverage.toFixed(2)}</span>
                    </div>
                    <div className="text-[10px] text-slate-400">{v.ratingCount} ratings</div>
                  </div>

                  <div>
                    {v.isEligibleForLeaderboard ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-display font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Podium Eligible
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-display font-medium bg-slate-100 text-slate-500 border border-slate-200">
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
