"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Users,
  Star,
  Clock,
  Utensils,
  Trophy,
  Flame,
  AlertTriangle,
  ArrowUpRight,
  RefreshCw,
  Crown,
  Sparkles,
} from "lucide-react";

export default function AdminOverviewPage() {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAnalytics = async () => {
    try {
      const res = await fetch("/api/admin/analytics");
      const json = await res.json();
      if (res.ok) setData(json);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
    const timer = setInterval(fetchAnalytics, 15000);
    return () => clearInterval(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-gray-800 rounded w-48" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-gray-800 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  const metrics = data?.metrics || {};
  const highlights = data?.highlights || {};

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-fest-border pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">
            Live Organizer <span className="gold-gradient-text">Overview</span>
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Real-time telemetry for Grand Food Fest Hyderabad 2026 • Status:{" "}
            <strong className="text-green-400">{data?.eventStatus || "LIVE"}</strong>
            {data?.activeDay && ` (Day ${data.activeDay.dayNumber})`}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchAnalytics}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-fest-card hover:bg-fest-cardHover border border-fest-border text-xs font-bold text-gray-300 transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
          <Link
            href="/admin/exports"
            className="px-3.5 py-1.5 rounded-xl bg-fest-gold text-black font-bold text-xs shadow"
          >
            Export Results
          </Link>
        </div>
      </div>

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel p-5 rounded-2xl border border-fest-border space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400 font-semibold">Voter Sessions Today</span>
            <div className="w-7 h-7 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white">
            {metrics.votingSessionsToday?.toLocaleString() || 0}
          </div>
          <p className="text-[11px] text-gray-500">Anonymous unique attendees verified</p>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-fest-border space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400 font-semibold">Ratings Today</span>
            <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-fest-gold flex items-center justify-center">
              <Star className="w-4 h-4 fill-fest-gold" />
            </div>
          </div>
          <div className="text-2xl font-black text-white">
            {metrics.ratingsToday?.toLocaleString() || 0}
          </div>
          <p className="text-[11px] text-green-400 font-medium">
            {metrics.ratingsLastHour || 0} ratings in last hour
          </p>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-fest-border space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400 font-semibold">Active Vendors</span>
            <div className="w-7 h-7 rounded-lg bg-green-500/20 text-green-400 flex items-center justify-center">
              <Utensils className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white">
            {metrics.activeFoodVendors || 0}{" "}
            <span className="text-xs font-normal text-gray-400">
              (+{metrics.activeLifestyleVendors || 0} lifestyle)
            </span>
          </div>
          <p className="text-[11px] text-gray-500">Accepting ratings across venue</p>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-fest-border space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400 font-semibold">Festival Average</span>
            <div className="w-7 h-7 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-fest-gold">
            ⭐ {metrics.averageRatingToday || "0.00"}
          </div>
          <p className="text-[11px] text-gray-500">Across all stalls today</p>
        </div>
      </div>

      {/* Spotlight Cards: Current #1, Current #10, Fastest Rising, Most Rated */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Current #1 */}
        <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1">
              <Crown className="w-3.5 h-3.5 fill-amber-400" />
              Current #1 Stall
            </span>
            <span className="text-xs font-mono font-bold text-white">
              {highlights.currentRank1?.stall || "A-01"}
            </span>
          </div>
          <div className="text-lg font-black text-white truncate">
            {highlights.currentRank1?.name || "Spice Route"}
          </div>
          <div className="text-xs text-gray-400">
            Score: <strong className="text-white">{highlights.currentRank1?.score}</strong> (
            {highlights.currentRank1?.ratings} votes)
          </div>
        </div>

        {/* Current #10 */}
        <div className="p-5 rounded-2xl bg-fest-card border border-fest-border space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Current #10 Stall
            </span>
            <span className="text-xs font-mono font-bold text-gray-300">
              {highlights.currentRank10?.stall || "—"}
            </span>
          </div>
          <div className="text-lg font-black text-white truncate">
            {highlights.currentRank10?.name || "Leaderboard Contender"}
          </div>
          <div className="text-xs text-gray-400">
            Score: <strong className="text-white">{highlights.currentRank10?.score}</strong> (
            {highlights.currentRank10?.ratings} votes)
          </div>
        </div>

        {/* Fastest Rising */}
        <div className="p-5 rounded-2xl bg-orange-500/10 border border-orange-500/30 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-orange-400 uppercase tracking-wider flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 fill-orange-400" />
              Fastest Rising
            </span>
            <span className="text-xs font-mono font-bold text-orange-400">
              {highlights.fastestRising?.label}
            </span>
          </div>
          <div className="text-lg font-black text-white truncate">
            {highlights.fastestRising?.name || "The Dessert Lab"}
          </div>
          <div className="text-xs text-gray-400">
            {highlights.fastestRising?.recentCount} ratings in last 60m
          </div>
        </div>

        {/* Most Rated */}
        <div className="p-5 rounded-2xl bg-fest-card border border-fest-border space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Most Rated Stall
            </span>
            <span className="text-xs font-mono font-bold text-amber-400">
              {highlights.mostRatedVendor?.stall}
            </span>
          </div>
          <div className="text-lg font-black text-white truncate">
            {highlights.mostRatedVendor?.name || "Top Stall"}
          </div>
          <div className="text-xs text-gray-400">
            Total {highlights.mostRatedVendor?.totalRatings} ratings logged
          </div>
        </div>
      </div>

      {/* Organizer Quick Jump Shortcuts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          href="/admin/vendors"
          className="glass-panel p-5 rounded-2xl border border-fest-border hover:border-fest-gold transition space-y-1 block"
        >
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-white text-sm">Vendor Management</h3>
            <ArrowUpRight className="w-4 h-4 text-gray-400" />
          </div>
          <p className="text-xs text-gray-400">
            Add new stalls, update cuisines, stall numbers, or toggle active status.
          </p>
        </Link>

        <Link
          href="/admin/anomalies"
          className="glass-panel p-5 rounded-2xl border border-fest-border hover:border-red-500/50 transition space-y-1 block"
        >
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-white text-sm flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              <span>Anomaly Logs & Spikes</span>
            </h3>
            <ArrowUpRight className="w-4 h-4 text-gray-400" />
          </div>
          <p className="text-xs text-gray-400">
            Review flagged velocity spikes and invalidate suspicious rating records.
          </p>
        </Link>

        <Link
          href="/admin/exports"
          className="glass-panel p-5 rounded-2xl border border-fest-border hover:border-green-500/50 transition space-y-1 block"
        >
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-white text-sm">Data Exports</h3>
            <ArrowUpRight className="w-4 h-4 text-gray-400" />
          </div>
          <p className="text-xs text-gray-400">
            Generate CSV and JSON reports for summary, vendors, daily results, and ratings.
          </p>
        </Link>
      </div>
    </div>
  );
}
