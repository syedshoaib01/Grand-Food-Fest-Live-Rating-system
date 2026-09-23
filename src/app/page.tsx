"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/SessionContext";
import NameLoginForm from "@/components/NameLoginForm";
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
} from "lucide-react";

// 5 Recently Voted Stalls with authentic festival mock data
const RECENTLY_VOTED_STALLS = [
  {
    id: "cmuci1a710009115ecmt1ni6v",
    name: "Spice Route",
    slug: "spice-route",
    stallNumber: "A-01",
    category: "Biryani & Pulao",
    cuisine: "Hyderabadi",
    description: "Slow-dum Zafrani Mutton Biryani steeped in royal Nizami aromatics.",
    recentTime: "Just now",
    recentVoteScore: 5,
    tag: "Trending #1",
  },
  {
    id: "cmuci1aa3000z115etb5pajgs",
    name: "Charcoal & Clay",
    slug: "charcoal-clay",
    stallNumber: "A-14",
    category: "Kebabs & Tandoor",
    cuisine: "Mughlai",
    description: "Melt-in-mouth Kakori skewers and succulent Malai Seekh kebabs.",
    recentTime: "3m ago",
    recentVoteScore: 5,
    tag: "High Velocity",
  },
  {
    id: "cmuci1a7l000d115esqwb2kb6",
    name: "Shadab Express",
    slug: "shadab-express",
    stallNumber: "A-03",
    category: "Biryani & Pulao",
    cuisine: "Nizami",
    description: "Old City heritage dum biryani served with spicy Bagara Baingan.",
    recentTime: "6m ago",
    recentVoteScore: 4,
    tag: "Heritage Favorite",
  },
  {
    id: "cmuci1ae7002d115ezppz7p6w",
    name: "Old City Kulfi Hub",
    slug: "old-city-kulfi-hub",
    stallNumber: "A-39",
    category: "Desserts & Ice Cream",
    cuisine: "Hyderabadi",
    description: "Earthen matka kulfi loaded with dried figs, almonds, and rose falooda.",
    recentTime: "9m ago",
    recentVoteScore: 5,
    tag: "Festival Dessert",
  },
  {
    id: "cmuci1ad30021115ewvx9yrvs",
    name: "The Dessert Lab",
    slug: "the-dessert-lab",
    stallNumber: "A-33",
    category: "Desserts & Ice Cream",
    cuisine: "Continental",
    description: "Artisanal nitro-churned gelato, warm Belgian waffles, and lava pots.",
    recentTime: "12m ago",
    recentVoteScore: 4,
    tag: "Crowd Favorite",
  },
];

export default function HomePage() {
  const router = useRouter();
  const { authenticated, attendeeName, logout, isLoading: isSessionLoading } = useSession();

  const [searchQuery, setSearchQuery] = useState("");
  const [allVendors, setAllVendors] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Fetch all vendors for the live search bar
  useEffect(() => {
    fetch("/api/vendors?type=FOOD&limit=150")
      .then((res) => res.json())
      .then((data) => setAllVendors(data.vendors || []))
      .catch(() => {});
  }, []);

  // Filter vendors based on user's search
  const searchResults = searchQuery.trim()
    ? allVendors.filter((v) => {
        const q = searchQuery.toLowerCase().trim();
        return (
          v.name.toLowerCase().includes(q) ||
          v.stallNumber.toLowerCase().includes(q) ||
          (v.category && v.category.toLowerCase().includes(q)) ||
          (v.cuisine && v.cuisine.toLowerCase().includes(q)) ||
          (v.description && v.description.toLowerCase().includes(q))
        );
      })
    : [];

  // If session is still loading, show a warm festival spinner
  if (isSessionLoading) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-3">
        <div className="w-10 h-10 rounded-full border-4 border-fest-terracotta border-t-transparent animate-spin mx-auto" />
        <p className="font-display font-bold text-fest-charcoal text-xs">
          Loading Grand Food Fest...
        </p>
      </div>
    );
  }

  // 1. If NOT authenticated: Show the Name Login Screen
  if (!authenticated) {
    return <NameLoginForm />;
  }

  // 2. If authenticated: Show the Landing Page
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 space-y-6 pb-20">
      {/* Top Welcome Bar - Luminous Stadium Scoreboard Hero */}
      <div className="glass-panel p-5 sm:p-6 rounded-3xl border border-white/10 shadow-lg relative overflow-hidden space-y-4">
        {/* Glow Accent */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-amber-500/15 via-orange-500/10 to-transparent blur-2xl pointer-events-none" />

        <div className="flex items-center justify-between gap-3 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#10B981]" />
              <span className="text-[10px] font-display font-bold uppercase tracking-wider text-amber-400">
                Live Festival Stadium Feed
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-display font-black text-white tracking-tight">
              Welcome, {attendeeName || "Attendee"}
            </h1>
          </div>

          <button
            type="button"
            onClick={() => logout()}
            className="text-xs font-display font-medium text-slate-400 hover:text-white px-3 py-1.5 rounded-full border border-white/10 hover:border-white/20 bg-white/5 transition active-press"
          >
            Change Name
          </button>
        </div>

        {/* Live Stadium Quick Stats Strip */}
        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/8 text-center">
          <div className="p-2 rounded-xl bg-white/5 border border-white/5">
            <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block">Stalls</span>
            <span className="text-base font-display font-black text-white">160+</span>
          </div>
          <div className="p-2 rounded-xl bg-white/5 border border-white/5">
            <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block">Quota / Day</span>
            <span className="text-base font-display font-black text-amber-400">5 Stalls</span>
          </div>
          <div className="p-2 rounded-xl bg-white/5 border border-white/5">
            <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block">Podium Min</span>
            <span className="text-base font-display font-black text-orange-400">20 Votes</span>
          </div>
        </div>
      </div>

      {/* HEADER SEARCH BAR (Always accessible at top) */}
      <div className="space-y-2 sticky top-16 z-20">
        <div className="relative rounded-2xl glass-panel shadow-md border border-white/12">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search 160+ food stalls, biryani, kebabs, desserts..."
            className="w-full pl-10 pr-9 py-3 rounded-2xl bg-transparent border-0 text-sm font-sans text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-0 transition"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Live Search Results Dropdown/List */}
        {searchQuery.trim() !== "" && (
          <div className="glass-panel p-2 rounded-2xl max-h-80 overflow-y-auto divide-y divide-white/5 animate-in fade-in duration-150 border border-white/10 shadow-2xl">
            <div className="px-3 py-1.5 text-[11px] font-display font-semibold text-slate-400 flex items-center justify-between">
              <span>Matching Food Stalls ({searchResults.length})</span>
              <span className="text-amber-400/80">Tap to rate</span>
            </div>

            {searchResults.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">
                No food stalls found matching &quot;{searchQuery}&quot;
              </div>
            ) : (
              searchResults.map((stall) => (
                <Link
                  key={stall.id}
                  href={`/rate/${stall.id}`}
                  className="p-3 rounded-xl flex items-center justify-between hover:bg-white/5 transition group"
                >
                  <div className="pr-3 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-display font-bold text-sm text-white group-hover:text-amber-400 transition-colors truncate">
                        {stall.name}
                      </span>
                      <span className="font-display text-[10px] font-semibold text-slate-300 bg-white/10 px-1.5 py-0.5 rounded border border-white/10">
                        Stall {stall.stallNumber}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 truncate mt-0.5">
                      {stall.cuisine ? `${stall.cuisine} • ${stall.category}` : stall.category}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 text-xs font-display font-bold text-amber-400 shrink-0">
                    <span>Rate</span>
                    <ArrowRight className="w-3.5 h-3.5 stroke-[1.75]" />
                  </div>
                </Link>
              ))
            )}
          </div>
        )}
      </div>

      {/* 4 to 5 RECENTLY VOTED STALLS SECTION */}
      {searchQuery.trim() === "" && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <Sparkles className="w-3.5 h-3.5 stroke-[1.75]" />
              </div>
              <div>
                <h2 className="font-display font-bold text-sm sm:text-base text-white">
                  Recently Voted Stalls
                </h2>
                <p className="text-[11px] text-slate-400">
                  Verified attendee tasting activity on festival grounds
                </p>
              </div>
            </div>

            <span className="text-[10px] font-mono font-medium text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
              Live Feed
            </span>
          </div>

          <div className="space-y-3">
            {RECENTLY_VOTED_STALLS.map((stall, index) => (
              <Link
                key={stall.id}
                href={`/rate/${stall.id}`}
                className={`glass-panel float-card p-4 sm:p-5 rounded-2xl border border-white/10 flex flex-col justify-between group active-press block ${
                  index === 0 ? "animate-stagger-1" : index === 1 ? "animate-stagger-2" : "animate-stagger-3"
                }`}
              >
                <div>
                  {/* Stall meta line */}
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-display text-[10px] font-bold text-slate-300 bg-white/10 px-2 py-0.5 rounded border border-white/10">
                        Stall {stall.stallNumber}
                      </span>
                      <span className="text-[10px] font-medium text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
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
                    <h3 className="font-display font-extrabold text-base text-white group-hover:text-amber-400 transition-colors">
                      {stall.name}
                    </h3>

                    <div className="flex items-center gap-1 text-xs font-display font-bold text-amber-400">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 stroke-[1.5]" />
                      <span>{stall.recentVoteScore}.0</span>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed line-clamp-1">
                    {stall.description}
                  </p>
                </div>

                {/* Bottom CTA Bar */}
                <div className="mt-3 pt-2.5 border-t border-white/5 flex items-center justify-between text-xs">
                  <span className="text-[11px] font-medium text-slate-400">
                    {stall.cuisine} • {stall.category}
                  </span>

                  <div className="inline-flex items-center gap-1 font-display font-bold text-xs text-white group-hover:text-amber-400 transition-colors">
                    <span>Rate with Arrows</span>
                    <ArrowRight className="w-3.5 h-3.5 stroke-[1.75]" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Festival Quick Links - Weightless Minimalist Cards */}
      <div className="grid grid-cols-2 gap-3 pt-2">
        <Link
          href="/leaderboard"
          className="glass-panel float-card p-4 rounded-2xl border border-white/10 hover:border-white/20 transition flex items-center justify-between group active-press"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Trophy className="w-4 h-4 stroke-[1.75]" />
            </div>
            <div>
              <div className="font-display font-bold text-xs text-white">Top 10</div>
              <div className="text-[10px] text-slate-400">Live Leaderboard</div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-amber-400 transition-colors stroke-[1.75]" />
        </Link>

        <Link
          href="/vendors"
          className="glass-panel float-card p-4 rounded-2xl border border-white/10 hover:border-white/20 transition flex items-center justify-between group active-press"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400">
              <UtensilsCrossed className="w-4 h-4 stroke-[1.75]" />
            </div>
            <div>
              <div className="font-display font-bold text-xs text-white">All Stalls</div>
              <div className="text-[10px] text-slate-400">160+ Stalls</div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-orange-400 transition-colors stroke-[1.75]" />
        </Link>
      </div>
    </div>
  );
}
