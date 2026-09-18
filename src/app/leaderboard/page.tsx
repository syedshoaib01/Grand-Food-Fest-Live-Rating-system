"use client";

import React, { useState, useEffect } from "react";
import LeaderboardTable from "@/components/LeaderboardTable";
import TrendingSection from "@/components/TrendingSection";
import { Trophy, Info, Sparkles, Filter } from "lucide-react";
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-fest-border pb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-fest-gold border border-amber-500/20 mb-2">
            <Trophy className="w-3.5 h-3.5" />
            <span>Grand Food Fest Hyderabad 2026</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white">
            Festival <span className="gold-gradient-text">Leaderboard</span>
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Real-time rankings powered by Bayesian confidence rating (minimum 20 ratings required for official Top 10).
          </p>
        </div>

        <div className="flex items-center gap-2 bg-fest-card p-1 rounded-xl border border-fest-border self-start">
          <button
            onClick={() => setActiveTab("top10")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition ${
              activeTab === "top10"
                ? "bg-fest-gold text-black shadow"
                : "text-gray-300 hover:text-white"
            }`}
          >
            Official Top 10
          </button>
          <button
            onClick={() => setActiveTab("all")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition ${
              activeTab === "all"
                ? "bg-fest-gold text-black shadow"
                : "text-gray-300 hover:text-white"
            }`}
          >
            All Competing Food Stalls ({stats?.totalFoodVendors || 110})
          </button>
        </div>
      </div>

      {/* Hot Trending Row */}
      <TrendingSection />

      {activeTab === "top10" ? (
        <LeaderboardTable />
      ) : (
        <div className="glass-panel rounded-2xl overflow-hidden border border-fest-border shadow-xl">
          <div className="p-4 sm:p-5 bg-fest-card/60 border-b border-fest-border flex items-center justify-between">
            <h2 className="font-bold text-lg text-white">
              All Competing Food Vendors Ranked
            </h2>
            <span className="text-xs text-gray-400">
              {stats?.totalVotesCounted?.toLocaleString()} total ratings counted
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-300">
              <thead className="bg-fest-dark text-xs uppercase tracking-wider text-gray-400 border-b border-fest-border">
                <tr>
                  <th className="py-3 px-4">Rank</th>
                  <th className="py-3 px-4">Vendor & Stall</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4 text-right">Raw Rating</th>
                  <th className="py-3 px-4 text-right">Ratings</th>
                  <th className="py-3 px-4 text-right">Bayesian Score</th>
                  <th className="py-3 px-4 text-center">Eligibility</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-fest-border/50 font-medium">
                {allRanked.map((v) => (
                  <tr key={v.vendorId} className="hover:bg-fest-cardHover/40 transition">
                    <td className="py-3 px-4 font-bold text-white">#{v.rank}</td>
                    <td className="py-3 px-4">
                      <Link
                        href={`/vendors/${v.slug}`}
                        className="font-bold text-white hover:text-fest-gold transition"
                      >
                        {v.name}
                      </Link>
                      <span className="ml-2 text-xs font-mono text-gray-400">
                        (Stall {v.stallNumber})
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs text-gray-400">
                      {v.category} {v.cuisine && `• ${v.cuisine}`}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-fest-gold">
                      ⭐ {v.ratingAverage.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-right text-gray-300">{v.ratingCount}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-white">
                      {v.rankingScore.toFixed(3)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {v.isEligibleForLeaderboard ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-green-500/10 text-green-400 border border-green-500/20">
                          Eligible
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20" title={`Needs ${20 - v.ratingCount} more ratings to enter official Top 10`}>
                          Needs {20 - v.ratingCount} votes
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
