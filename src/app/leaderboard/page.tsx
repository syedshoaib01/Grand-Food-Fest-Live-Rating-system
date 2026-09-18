"use client";

import React, { useState, useEffect } from "react";
import LeaderboardTable from "@/components/LeaderboardTable";
import TrendingSection from "@/components/TrendingSection";
import { Trophy, Star, ArrowRight } from "lucide-react";
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
      {/* Header */}
      <div className="space-y-3 pb-4 border-b border-stone-200">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-900">
          <Trophy className="w-3.5 h-3.5 text-amber-700" />
          <span>Grand Food Fest Hyderabad 2026</span>
        </div>
        <div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-stone-900 tracking-tight">
            Festival Leaderboard
          </h1>
          <p className="text-xs sm:text-sm text-stone-600 mt-1">
            Live rankings based on verified attendee ratings. Minimum 20 ratings required for official Top 10 eligibility.
          </p>
        </div>

        {/* Mobile Tab Toggle */}
        <div className="flex items-center gap-2 pt-1">
          <button
            type="button"
            onClick={() => setActiveTab("top10")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition active:scale-95 ${
              activeTab === "top10"
                ? "bg-amber-600 text-white shadow-sm"
                : "bg-white text-stone-600 border border-stone-200 hover:bg-stone-50"
            }`}
          >
            Official Top 10
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("all")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition active:scale-95 ${
              activeTab === "all"
                ? "bg-amber-600 text-white shadow-sm"
                : "bg-white text-stone-600 border border-stone-200 hover:bg-stone-50"
            }`}
          >
            All Food Stalls ({stats?.totalFoodVendors || 124})
          </button>
        </div>
      </div>

      {/* Trending Now */}
      <TrendingSection />

      {/* Leaderboard View */}
      {activeTab === "top10" ? (
        <LeaderboardTable />
      ) : (
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
          <div className="p-4 bg-stone-50 border-b border-stone-200 flex items-center justify-between">
            <h2 className="font-bold text-sm sm:text-base text-stone-900">
              All Competing Food Stalls
            </h2>
            <span className="text-xs text-stone-500">
              {stats?.totalVotesCounted?.toLocaleString()} total votes
            </span>
          </div>

          <div className="divide-y divide-stone-100">
            {allRanked.map((v) => (
              <div
                key={v.vendorId}
                className="p-3.5 sm:px-5 flex items-center justify-between hover:bg-stone-50/80 transition"
              >
                <div className="flex items-center gap-3 min-w-0 pr-2">
                  <span className="font-mono text-sm font-bold text-stone-400 w-6 text-center">
                    #{v.rank}
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Link
                        href={`/vendors/${v.slug}`}
                        className="font-bold text-sm text-stone-900 hover:text-amber-700 transition truncate"
                      >
                        {v.name}
                      </Link>
                      <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-stone-100 text-stone-600 font-semibold">
                        {v.stallNumber}
                      </span>
                    </div>
                    <div className="text-[11px] text-stone-500 mt-0.5">
                      {v.category} {v.cuisine && `• ${v.cuisine}`}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 sm:gap-4 shrink-0 text-right">
                  <div>
                    <div className="flex items-center justify-end gap-1">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                      <span className="font-bold text-sm text-stone-900">
                        {v.ratingAverage.toFixed(2)}
                      </span>
                    </div>
                    <div className="text-[11px] text-stone-500">{v.ratingCount} ratings</div>
                  </div>

                  <div>
                    {v.isEligibleForLeaderboard ? (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        Eligible
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-stone-100 text-stone-600">
                        Needs {Math.max(0, 20 - v.ratingCount)} votes
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
