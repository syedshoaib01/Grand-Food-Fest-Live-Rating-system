"use client";

import React, { useState, useEffect } from "react";
import LeaderboardTable from "@/components/LeaderboardTable";
import TrendingSection from "@/components/TrendingSection";
import { Star } from "lucide-react";
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
      {/* Calm Header */}
      <div className="space-y-3 pb-3 border-b border-stone-200/80">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-stone-950 tracking-tight">
            Festival Leaderboard
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
            Live rankings based on verified attendee ratings. Minimum 20 ratings required for official Top 10 eligibility.
          </p>
        </div>

        {/* Tab Toggle */}
        <div className="flex items-center gap-1.5 p-1 bg-stone-100 rounded-xl max-w-xs">
          <button
            type="button"
            onClick={() => setActiveTab("top10")}
            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition active:scale-95 ${
              activeTab === "top10"
                ? "bg-white text-stone-950 shadow-xs"
                : "text-stone-500 hover:text-stone-900"
            }`}
          >
            Official Top 10
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("all")}
            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition active:scale-95 ${
              activeTab === "all"
                ? "bg-white text-stone-950 shadow-xs"
                : "text-stone-500 hover:text-stone-900"
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
        <div className="bg-white rounded-2xl border border-stone-200/80 shadow-xs overflow-hidden">
          <div className="px-4 py-3 bg-stone-50/70 border-b border-stone-100 flex items-center justify-between text-xs text-stone-500">
            <span className="font-semibold text-stone-800">All Competing Food Stalls</span>
            <span>{stats?.totalVotesCounted?.toLocaleString()} total votes</span>
          </div>

          <div className="divide-y divide-stone-100">
            {allRanked.map((v) => (
              <div
                key={v.vendorId}
                className="p-3.5 sm:px-6 flex items-center justify-between hover:bg-stone-50/60 transition"
              >
                <div className="flex items-center gap-3 min-w-0 pr-2">
                  <span className="font-mono text-xs font-bold text-stone-400 w-6 text-center">
                    #{v.rank}
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Link
                        href={`/vendors/${v.slug}`}
                        className="font-semibold text-sm text-stone-950 hover:text-amber-700 transition truncate"
                      >
                        {v.name}
                      </Link>
                      <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-stone-100 text-stone-500">
                        {v.stallNumber}
                      </span>
                    </div>
                    <div className="text-[11px] text-stone-400 mt-0.5">
                      {v.category} {v.cuisine && `• ${v.cuisine}`}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 sm:gap-4 shrink-0 text-right">
                  <div>
                    <div className="flex items-center justify-end gap-1">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                      <span className="font-semibold text-sm text-stone-900 font-mono">
                        {v.ratingAverage.toFixed(2)}
                      </span>
                    </div>
                    <div className="text-[11px] text-stone-400">{v.ratingCount} ratings</div>
                  </div>

                  <div>
                    {v.isEligibleForLeaderboard ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                        Eligible
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-stone-100 text-stone-500">
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
