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
      {/* Top Welcome Bar */}
      <div className="flex items-center justify-between gap-2 pb-3 border-b border-fest-border">
        <div>
          <span className="text-[10px] font-display font-black uppercase tracking-wider text-fest-terracotta">
            Grand Food Fest • Gachibowli
          </span>
          <h1 className="text-xl sm:text-2xl font-display font-black text-fest-charcoal">
            Welcome, {attendeeName || "Foodie"}! 👋
          </h1>
        </div>

        <button
          type="button"
          onClick={() => logout()}
          className="text-xs font-display font-bold text-fest-charcoalMuted hover:text-fest-charcoal px-2.5 py-1 rounded-lg bg-fest-parchment border border-fest-border transition active-press"
        >
          Change Name
        </button>
      </div>

      {/* HEADER SEARCH BAR (Always accessible at top) */}
      <div className="space-y-2 sticky top-16 z-20">
        <div className="relative shadow-card rounded-2xl">
          <Search className="w-5 h-5 text-fest-charcoalTertiary absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search 160+ food stalls, biryani, kebabs, desserts..."
            className="w-full pl-12 pr-10 py-3.5 rounded-2xl bg-white border-2 border-fest-border text-sm font-sans text-fest-charcoal placeholder:text-fest-charcoalTertiary focus:outline-hidden focus:border-fest-saffron shadow-xs transition"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-fest-charcoalTertiary hover:text-fest-charcoal p-1"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Live Search Results Dropdown/List */}
        {searchQuery.trim() !== "" && (
          <div className="ticket-stub p-2 border border-fest-border bg-white shadow-warm max-h-80 overflow-y-auto divide-y divide-fest-parchment animate-in fade-in duration-150">
            <div className="px-3 py-1.5 text-[11px] font-display font-bold text-fest-charcoalMuted flex items-center justify-between">
              <span>Matching Food Stalls ({searchResults.length})</span>
              <span>Tap to rate with arrows</span>
            </div>

            {searchResults.length === 0 ? (
              <div className="p-6 text-center text-xs text-fest-charcoalMuted">
                No food stalls found matching &quot;{searchQuery}&quot;
              </div>
            ) : (
              searchResults.map((stall) => (
                <Link
                  key={stall.id}
                  href={`/rate/${stall.id}`}
                  className="p-3 rounded-xl flex items-center justify-between hover:bg-fest-cream/70 transition group"
                >
                  <div className="pr-3 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-display font-extrabold text-sm text-fest-charcoal group-hover:text-fest-terracotta transition-colors truncate">
                        {stall.name}
                      </span>
                      <span className="font-display text-[10px] font-black text-fest-charcoal bg-fest-parchment px-1.5 py-0.5 rounded border border-fest-border">
                        Stall {stall.stallNumber}
                      </span>
                    </div>
                    <div className="text-[11px] text-fest-charcoalMuted truncate mt-0.5">
                      {stall.cuisine ? `${stall.cuisine} • ${stall.category}` : stall.category}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 text-xs font-display font-bold text-fest-terracotta shrink-0">
                    <span>Rate</span>
                    <ArrowRight className="w-3.5 h-3.5" />
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
              <div className="w-7 h-7 rounded-xl bg-fest-terracottaLight flex items-center justify-center text-fest-terracotta">
                <Flame className="w-4 h-4 fill-fest-terracotta" />
              </div>
              <div>
                <h2 className="font-display font-black text-base sm:text-lg text-fest-charcoal">
                  Recently Voted Stalls
                </h2>
                <p className="text-[11px] text-fest-charcoalMuted">
                  Live attendee tasting activity on festival grounds
                </p>
              </div>
            </div>

            <span className="text-[10px] font-mono font-bold text-fest-terracotta bg-fest-terracottaLight px-2 py-0.5 rounded-full border border-fest-terracotta/20">
              Live Feed
            </span>
          </div>

          <div className="space-y-3">
            {RECENTLY_VOTED_STALLS.map((stall) => (
              <Link
                key={stall.id}
                href={`/rate/${stall.id}`}
                className="ticket-stub p-4 sm:p-5 border border-fest-border hover:border-fest-saffron/50 shadow-card hover:shadow-warm transition-all duration-200 flex flex-col justify-between group bg-white active-press block"
              >
                <div>
                  {/* Stall meta line */}
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-display text-[10px] font-black text-fest-charcoal bg-fest-parchment px-2 py-0.5 rounded border border-fest-border shadow-2xs">
                        Stall {stall.stallNumber}
                      </span>
                      <span className="text-[10px] font-semibold text-fest-terracotta bg-fest-terracottaLight px-2 py-0.5 rounded-full">
                        {stall.tag}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 text-[11px] font-mono text-fest-charcoalMuted">
                      <Clock className="w-3 h-3 text-fest-charcoalTertiary" />
                      <span>{stall.recentTime}</span>
                    </div>
                  </div>

                  {/* Stall Name */}
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-display font-black text-base sm:text-lg text-fest-charcoal group-hover:text-fest-terracotta transition-colors">
                      {stall.name}
                    </h3>

                    <div className="flex items-center gap-1 text-xs font-display font-bold text-fest-saffron">
                      <Star className="w-3.5 h-3.5 fill-fest-turmeric text-fest-saffron" />
                      <span>{stall.recentVoteScore}.0★</span>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-fest-charcoalMuted mt-1 leading-relaxed line-clamp-1">
                    {stall.description}
                  </p>
                </div>

                {/* Bottom CTA Bar */}
                <div className="mt-3 pt-2.5 border-t border-fest-parchment flex items-center justify-between text-xs">
                  <span className="text-[11px] font-semibold text-fest-charcoalTertiary">
                    {stall.cuisine} • {stall.category}
                  </span>

                  <div className="inline-flex items-center gap-1 font-display font-extrabold text-xs text-fest-terracotta group-hover:translate-x-0.5 transition-transform">
                    <span>Rate with Arrows</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Festival Quick Links */}
      <div className="grid grid-cols-2 gap-3 pt-2">
        <Link
          href="/leaderboard"
          className="p-4 rounded-2xl bg-white border border-fest-border hover:border-fest-saffron/40 shadow-card flex items-center justify-between group active-press"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-fest-saffronLight flex items-center justify-center text-fest-saffron">
              <Trophy className="w-4 h-4 fill-fest-turmeric" />
            </div>
            <div>
              <div className="font-display font-bold text-xs text-fest-charcoal">Top 10</div>
              <div className="text-[10px] text-fest-charcoalMuted">Live Leaderboard</div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-fest-charcoalTertiary group-hover:text-fest-terracotta transition-colors" />
        </Link>

        <Link
          href="/vendors"
          className="p-4 rounded-2xl bg-white border border-fest-border hover:border-fest-saffron/40 shadow-card flex items-center justify-between group active-press"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-fest-parchment flex items-center justify-center text-fest-charcoal">
              <UtensilsCrossed className="w-4 h-4 text-fest-terracotta" />
            </div>
            <div>
              <div className="font-display font-bold text-xs text-fest-charcoal">All Stalls</div>
              <div className="text-[10px] text-fest-charcoalMuted">160+ Festival Stalls</div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-fest-charcoalTertiary group-hover:text-fest-terracotta transition-colors" />
        </Link>
      </div>
    </div>
  );
}
