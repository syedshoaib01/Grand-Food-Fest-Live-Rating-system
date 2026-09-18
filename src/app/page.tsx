import React from "react";
import Link from "next/link";
import { Trophy, Star, UtensilsCrossed, Sparkles, MapPin, ArrowRight, CheckCircle2 } from "lucide-react";
import LeaderboardTable from "@/components/LeaderboardTable";
import TrendingSection from "@/components/TrendingSection";

export default function HomePage() {
  return (
    <div className="space-y-8 sm:space-y-12 pb-16">
      {/* Mobile-First Hero Section */}
      <section className="pt-6 sm:pt-10 pb-8 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto text-center">
        {/* Subtle festival location tag */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-100/70 text-amber-900 mb-4">
          <MapPin className="w-3.5 h-3.5 text-amber-700" />
          <span>Gachibowli Stadium, Hyderabad • Oct 9–11, 2026</span>
        </div>

        {/* Clear, focused headline hierarchy */}
        <div className="space-y-2 mb-6">
          <p className="text-xs sm:text-sm font-bold tracking-widest text-amber-700 uppercase">
            Grand Food Fest
          </p>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-stone-900 tracking-tight leading-tight">
            🔥 What’s winning right now?
          </h1>
          <p className="text-base sm:text-lg text-stone-600 max-w-lg mx-auto leading-relaxed">
            Live ratings from festival attendees. Discover the best food stalls across the stadium.
          </p>
        </div>

        {/* Focused CTAs: Primary Rate Food, Secondary See Top 10 */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 max-w-xs sm:max-w-md mx-auto mb-8">
          <Link
            href="/vote"
            className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-bold text-base bg-amber-600 hover:bg-amber-700 active:scale-[0.98] text-white shadow-sm transition"
          >
            <Star className="w-5 h-5 fill-current" />
            <span>Rate Food</span>
          </Link>

          <Link
            href="/leaderboard"
            className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-base bg-white hover:bg-stone-50 active:scale-[0.98] border border-stone-300 text-stone-800 transition"
          >
            <Trophy className="w-5 h-5 text-amber-600" />
            <span>See Top 10</span>
          </Link>
        </div>

        {/* Quick mobile value props */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4 max-w-lg mx-auto text-center pt-2">
          <div className="bg-white p-3 rounded-xl border border-stone-200 shadow-sm">
            <div className="text-xs text-stone-500 font-medium">Daily Limit</div>
            <div className="text-base sm:text-lg font-bold text-stone-900">5 Stalls/Day</div>
          </div>
          <div className="bg-white p-3 rounded-xl border border-stone-200 shadow-sm">
            <div className="text-xs text-stone-500 font-medium">Ratings</div>
            <div className="text-base sm:text-lg font-bold text-amber-700">1–5 Stars</div>
          </div>
          <div className="bg-white p-3 rounded-xl border border-stone-200 shadow-sm">
            <div className="text-xs text-stone-500 font-medium">Leaderboard</div>
            <div className="text-base sm:text-lg font-bold text-emerald-700">Live Top 10</div>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Trending Section */}
        <TrendingSection />

        {/* Live Top 10 Leaderboard Component */}
        <LeaderboardTable />

        {/* Simple 3-step festival loop */}
        <section className="bg-white rounded-2xl p-6 sm:p-8 border border-stone-200 shadow-sm">
          <div className="text-center max-w-xl mx-auto mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-stone-900">How to Participate</h2>
            <p className="text-sm text-stone-600 mt-1">
              Easy rating on your phone while walking the stadium stalls.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-stone-50 border border-stone-200/80 space-y-2">
              <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 font-bold flex items-center justify-center text-sm">
                1
              </div>
              <h3 className="font-bold text-stone-900 text-base">Grab Your Pass</h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                Use your festival wristband or pass number to start rating. No account required.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-stone-50 border border-stone-200/80 space-y-2">
              <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 font-bold flex items-center justify-center text-sm">
                2
              </div>
              <h3 className="font-bold text-stone-900 text-base">Rate Up to 5 Stalls</h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                Give an honest 1 to 5 star rating for each food stall you taste today.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-stone-50 border border-stone-200/80 space-y-2">
              <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 font-bold flex items-center justify-center text-sm">
                3
              </div>
              <h3 className="font-bold text-stone-900 text-base">Watch the Winner</h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                Leaderboard recalculates continuously as festival votes roll in.
              </p>
            </div>
          </div>

          <div className="mt-6 text-center">
            <Link
              href="/vote"
              className="inline-flex items-center gap-1.5 text-sm font-bold text-amber-700 hover:text-amber-800 hover:underline"
            >
              <span>Start rating stalls today</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
