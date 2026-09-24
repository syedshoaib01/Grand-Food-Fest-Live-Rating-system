"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/SessionContext";
import {
  Search,
  X,
  Sparkles,
  ArrowRight,
  Flame,
  Star,
  Trophy,
  UtensilsCrossed,
  Clock,
  ChevronRight,
  CheckCircle2,
  Zap,
} from "lucide-react";

// Top Flagship Stalls for Instant Testing & Live Feed
const RECENTLY_VOTED_STALLS = [
  {
    name: "Paradise Biryani",
    slug: "paradise-biryani",
    stallNumber: "A-01",
    category: "Biryani & Pulao",
    cuisine: "Hyderabadi",
    description: "Legendary World-Famous Hyderabadi Dum Biryani, double mutton biryani & Mirchi ka Salan since 1953.",
    recentTime: "Just now",
    recentVoteScore: 5,
    tag: "Trending #1",
  },
  {
    name: "Shah Ghouse",
    slug: "shah-ghouse",
    stallNumber: "A-02",
    category: "Biryani & Pulao",
    cuisine: "Hyderabadi",
    description: "Rich authentic Hyderabadi Mutton Haleem, special mutton biryani, and crispy Tala Hua Gosht.",
    recentTime: "2m ago",
    recentVoteScore: 5,
    tag: "High Velocity",
  },
  {
    name: "Pista House",
    slug: "pista-house",
    stallNumber: "A-03",
    category: "Biryani & Pulao",
    cuisine: "Hyderabadi",
    description: "World-renowned GI-tagged pure desi ghee Haleem, Zafrani Chai, and royal dry fruit sweets.",
    recentTime: "5m ago",
    recentVoteScore: 5,
    tag: "Crowd Favorite",
  },
  {
    name: "Cafe Niloufer",
    slug: "cafe-niloufer",
    stallNumber: "A-04",
    category: "Beverages & Chai",
    cuisine: "Hyderabadi",
    description: "Iconic slow-brewed Malai Chai paired with melt-in-mouth Maska Bun and Osmania biscuits.",
    recentTime: "8m ago",
    recentVoteScore: 5,
    tag: "Heritage Favorite",
  },
  {
    name: "Karachi Bakery",
    slug: "karachi-bakery",
    stallNumber: "A-05",
    category: "Desserts & Ice Cream",
    cuisine: "Traditional",
    description: "Historic Moazzam Jahi bakery famous for candied fruit biscuits, rich plum cake, and cashew cookies.",
    recentTime: "11m ago",
    recentVoteScore: 4,
    tag: "Dessert Legend",
  },
];

export default function HomePage() {
  const router = useRouter();
  const { authenticated, attendeeName, logout, remainingQuota, loginWithName } = useSession();

  const [searchQuery, setSearchQuery] = useState("");
  const [allVendors, setAllVendors] = useState<any[]>([]);
  const [inlineName, setInlineName] = useState("");
  const [isInlineLoggingIn, setIsInlineLoggingIn] = useState(false);
  const [inlineError, setInlineError] = useState<string | null>(null);

  // Fetch all food vendors for live search
  useEffect(() => {
    fetch("/api/vendors?type=FOOD&limit=150")
      .then((res) => res.json())
      .then((data) => setAllVendors(data.vendors || []))
      .catch(() => {});
  }, []);

  // Filter vendors based on user's search (capped at 15 for 120 FPS mobile responsiveness)
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();
    return allVendors
      .filter((v) => {
        return (
          v.name.toLowerCase().includes(q) ||
          v.stallNumber.toLowerCase().includes(q) ||
          (v.category && v.category.toLowerCase().includes(q)) ||
          (v.cuisine && v.cuisine.toLowerCase().includes(q)) ||
          (v.description && v.description.toLowerCase().includes(q))
        );
      })
      .slice(0, 15);
  }, [searchQuery, allVendors]);

  const handleInlineLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const trimmed = inlineName.trim();
    if (!trimmed) {
      setInlineError("Please enter your name.");
      return;
    }
    setIsInlineLoggingIn(true);
    setInlineError(null);
    const res = await loginWithName(trimmed);
    setIsInlineLoggingIn(false);
    if (!res.success) {
      setInlineError(res.error || "Could not log in.");
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 space-y-6 pb-20">
      {/* Top Welcome Bar - High Contrast Orange & White Scoreboard Hero */}
      <div className="bg-white rounded-3xl border border-orange-100 p-5 sm:p-6 shadow-sm relative overflow-hidden space-y-4">
        {/* Warm Orange Gradient Rim */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-orange-500 via-amber-400 to-orange-400" />

        {authenticated ? (
          <div className="flex items-center justify-between gap-3 relative z-10">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_#10B981]" />
                <span className="text-[10px] font-display font-bold uppercase tracking-wider text-orange-600">
                  Live Festival Stadium Feed
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-display font-black text-slate-900 tracking-tight">
                Welcome, {attendeeName || "Attendee"}
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                You have <span className="text-orange-600 font-bold">{remainingQuota ?? 5} of 5</span> tasting ratings left today
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/vote"
                className="px-3.5 py-1.5 rounded-full text-xs font-display font-bold bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-xs hover:opacity-95 transition active-press flex items-center gap-1.5"
              >
                <span>Passport</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <button
                type="button"
                onClick={() => logout()}
                className="text-xs font-display font-medium text-slate-500 hover:text-slate-900 px-2.5 py-1.5 rounded-full border border-slate-200 hover:border-slate-300 bg-slate-50 transition active-press"
                title="Change Name"
              >
                Change
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3 relative z-10">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_#10B981]" />
                  <span className="text-[10px] font-display font-bold uppercase tracking-wider text-orange-600">
                    Live Festival Stadium Feed
                  </span>
                </div>
                <h1 className="text-xl sm:text-2xl font-display font-black text-slate-900 tracking-tight">
                  Grand Food Fest 2026
                </h1>
              </div>
              <span className="text-[10px] font-mono font-bold text-orange-700 bg-orange-50 px-2.5 py-1 rounded-full border border-orange-200">
                Gachibowli Stadium
              </span>
            </div>

            {/* Inline Quick Attendee Check-In */}
            <div className="p-3.5 rounded-2xl bg-orange-50/60 border border-orange-200/80 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-display font-bold text-slate-900 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-orange-600" />
                  <span>Taste & Rate Stalls</span>
                </span>
                <span className="text-[11px] text-slate-500 font-medium">5 tasting stamps today</span>
              </div>

              {inlineError && (
                <p className="text-[11px] text-rose-600 font-semibold">{inlineError}</p>
              )}

              <form onSubmit={handleInlineLogin} className="flex items-center gap-2">
                <input
                  type="text"
                  value={inlineName}
                  onChange={(e) => setInlineName(e.target.value)}
                  placeholder="Enter your name (e.g. Alex, Ruwaiz)..."
                  className="flex-1 px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-xs font-sans text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition shadow-2xs"
                />
                <button
                  type="submit"
                  disabled={isInlineLoggingIn || !inlineName.trim()}
                  className="px-4 py-2.5 rounded-xl font-display font-bold text-xs bg-gradient-to-r from-orange-500 to-amber-500 hover:opacity-95 text-white transition disabled:opacity-40 disabled:cursor-not-allowed shrink-0 flex items-center gap-1.5 shadow-sm active-press cursor-pointer"
                >
                  <span>{isInlineLoggingIn ? "Entering..." : "Check In"}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Live Stadium Quick Stats Strip */}
        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-center">
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-[10px] uppercase font-mono tracking-wider text-slate-500 block">Stalls</span>
            <span className="text-base font-display font-black text-slate-900">160+</span>
          </div>
          <div className="p-2.5 rounded-xl bg-orange-50 border border-orange-100">
            <span className="text-[10px] uppercase font-mono tracking-wider text-orange-600 block">Daily Quota</span>
            <span className="text-base font-display font-black text-orange-600">5 Stalls</span>
          </div>
          <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-100">
            <span className="text-[10px] uppercase font-mono tracking-wider text-amber-700 block">Top 10 Min</span>
            <span className="text-base font-display font-black text-amber-700">20 Votes</span>
          </div>
        </div>
      </div>

      {/* QUICK TEST VOTING ACTIONS (Instant Check for User) */}
      <section className="bg-gradient-to-r from-orange-500 via-orange-600 to-amber-500 rounded-3xl p-5 text-white shadow-md space-y-3 relative overflow-hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center">
              <Zap className="w-4 h-4 text-white stroke-[2.5]" />
            </div>
            <div>
              <h2 className="font-display font-black text-sm text-white">
                Test the Voting System
              </h2>
              <p className="text-[11px] text-white/80">
                1-tap quick ratings for flagship Hyderabad restaurants
              </p>
            </div>
          </div>
          <Link
            href="/vote"
            className="text-[11px] font-display font-black text-orange-600 bg-white px-3 py-1.5 rounded-full hover:bg-orange-50 transition active-press shadow-xs"
          >
            Open Passport
          </Link>
        </div>

        <div className="flex gap-2 overflow-x-auto no-scrollbar pt-1">
          {[
            { name: "Paradise Biryani", slug: "paradise-biryani", stall: "A-01" },
            { name: "Shah Ghouse", slug: "shah-ghouse", stall: "A-02" },
            { name: "Pista House", slug: "pista-house", stall: "A-03" },
            { name: "Cafe Niloufer", slug: "cafe-niloufer", stall: "A-04" },
            { name: "Karachi Bakery", slug: "karachi-bakery", stall: "A-05" },
          ].map((item) => (
            <Link
              key={item.slug}
              href={`/rate/${item.slug}`}
              className="shrink-0 bg-white/15 hover:bg-white/25 border border-white/20 rounded-xl px-3 py-2 text-left transition active-press"
            >
              <div className="text-[10px] text-white/80 font-mono">Stall {item.stall}</div>
              <div className="text-xs font-display font-bold text-white truncate max-w-[120px]">{item.name}</div>
              <div className="text-[10px] text-amber-200 flex items-center gap-0.5 mt-0.5 font-bold">
                <Star className="w-3 h-3 fill-amber-200" />
                <span>Rate 1–5★</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* HEADER SEARCH BAR (Clean White & Fast) */}
      <div className="space-y-2 sticky top-16 z-20">
        <div className="relative rounded-2xl bg-white shadow-sm border border-orange-100">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search 160+ food stalls, biryani, kebabs, desserts..."
            className="w-full pl-10 pr-9 py-3 rounded-2xl bg-white border-0 text-sm font-sans text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-orange-500/20 transition"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Live Search Results Dropdown/List */}
        {searchQuery.trim() !== "" && (
          <div className="bg-white p-2 rounded-2xl max-h-80 overflow-y-auto divide-y divide-slate-100 animate-in fade-in duration-150 border border-orange-100 shadow-xl">
            <div className="px-3 py-1.5 text-[11px] font-display font-bold text-slate-500 flex items-center justify-between">
              <span>Matching Food Stalls ({searchResults.length})</span>
              <span className="text-orange-600">Tap to rate</span>
            </div>

            {searchResults.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">
                No food stalls found matching &quot;{searchQuery}&quot;
              </div>
            ) : (
              searchResults.map((stall) => (
                <Link
                  key={stall.slug || stall.id}
                  href={`/rate/${stall.slug || stall.id}`}
                  className="p-3 rounded-xl flex items-center justify-between hover:bg-orange-50/60 transition group"
                >
                  <div className="pr-3 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-display font-bold text-sm text-slate-900 group-hover:text-orange-600 transition-colors truncate">
                        {stall.name}
                      </span>
                      <span className="font-display text-[10px] font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                        Stall {stall.stallNumber}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 truncate mt-0.5">
                      {stall.cuisine ? `${stall.cuisine} • ${stall.category}` : stall.category}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 text-xs font-display font-bold text-orange-600 shrink-0">
                    <span>Rate</span>
                    <ArrowRight className="w-3.5 h-3.5 stroke-[2]" />
                  </div>
                </Link>
              ))
            )}
          </div>
        )}
      </div>

      {/* 5 RECENTLY VOTED FLAGSHIP STALLS */}
      {searchQuery.trim() === "" && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600">
                <Sparkles className="w-3.5 h-3.5 stroke-[2.2]" />
              </div>
              <div>
                <h2 className="font-display font-bold text-sm sm:text-base text-slate-900">
                  Recently Voted Stalls
                </h2>
                <p className="text-[11px] text-slate-500">
                  Verified attendee tasting activity on festival grounds
                </p>
              </div>
            </div>

            <span className="text-[10px] font-mono font-bold text-orange-700 bg-orange-50 px-2.5 py-0.5 rounded-full border border-orange-200">
              Live Feed
            </span>
          </div>

          <div className="space-y-3">
            {RECENTLY_VOTED_STALLS.map((stall, index) => (
              <Link
                key={stall.slug}
                href={`/rate/${stall.slug}`}
                className={`float-card p-4 sm:p-5 rounded-2xl flex flex-col justify-between group active-press block ${
                  index === 0 ? "animate-stagger-1" : index === 1 ? "animate-stagger-2" : "animate-stagger-3"
                }`}
              >
                <div>
                  {/* Stall meta line */}
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-display text-[10px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        Stall {stall.stallNumber}
                      </span>
                      <span className="text-[10px] font-bold text-orange-700 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-200">
                        {stall.tag}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 text-[11px] font-mono text-slate-400">
                      <Clock className="w-3 h-3 stroke-[1.75]" />
                      <span>{stall.recentTime}</span>
                    </div>
                  </div>

                  {/* Stall Name */}
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-display font-black text-base text-slate-900 group-hover:text-orange-600 transition-colors">
                      {stall.name}
                    </h3>

                    <div className="flex items-center gap-1 text-xs font-display font-bold text-amber-500">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 stroke-[1.5]" />
                      <span>{stall.recentVoteScore}.0</span>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed line-clamp-1">
                    {stall.description}
                  </p>
                </div>

                {/* Bottom CTA Bar */}
                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-[11px] font-medium text-slate-500">
                    {stall.cuisine} • {stall.category}
                  </span>

                  <div className="inline-flex items-center gap-1 font-display font-bold text-xs text-orange-600 group-hover:translate-x-0.5 transition-transform">
                    <span>Rate with Arrows</span>
                    <ArrowRight className="w-3.5 h-3.5 stroke-[2.2]" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Festival Quick Links - Clean White Cards */}
      <div className="grid grid-cols-2 gap-3 pt-2">
        <Link
          href="/leaderboard"
          className="float-card p-4 rounded-2xl flex items-center justify-between group active-press"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
              <Trophy className="w-4 h-4 stroke-[2]" />
            </div>
            <div>
              <div className="font-display font-bold text-xs text-slate-900">Top 10</div>
              <div className="text-[10px] text-slate-500">Live Leaderboard</div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-orange-600 transition-colors stroke-[2]" />
        </Link>

        <Link
          href="/vendors"
          className="float-card p-4 rounded-2xl flex items-center justify-between group active-press"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-600">
              <UtensilsCrossed className="w-4 h-4 stroke-[2]" />
            </div>
            <div>
              <div className="font-display font-bold text-xs text-slate-900">All Stalls</div>
              <div className="text-[10px] text-slate-500">Explore 160+</div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-orange-600 transition-colors stroke-[2]" />
        </Link>
      </div>
    </div>
  );
}
