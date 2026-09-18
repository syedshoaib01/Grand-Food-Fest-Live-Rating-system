import React from "react";
import Link from "next/link";
import { Trophy, Star, ArrowRight, MapPin } from "lucide-react";
import LeaderboardTable from "@/components/LeaderboardTable";
import TrendingSection from "@/components/TrendingSection";

export default function HomePage() {
  return (
    <div className="space-y-10 sm:space-y-14 pb-16">
      {/* Calm, Focused First Viewport */}
      <section className="pt-8 sm:pt-14 pb-4 px-4 sm:px-6 lg:px-8 max-w-2xl mx-auto text-center">
        {/* Subtle festival location tag */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-900 border border-amber-200/60 mb-5">
          <MapPin className="w-3.5 h-3.5 text-amber-700" />
          <span>Gachibowli Stadium, Hyderabad • Oct 9–11, 2026</span>
        </div>

        {/* Clear, focused headline hierarchy */}
        <div className="space-y-2.5 mb-7">
          <p className="text-xs font-semibold tracking-wider text-amber-700 uppercase">
            Grand Food Fest
          </p>
          <h1 className="text-3xl sm:text-5xl font-bold text-stone-950 tracking-tight leading-tight">
            What’s winning right now?
          </h1>
          <p className="text-base sm:text-lg text-stone-600 max-w-md mx-auto leading-relaxed">
            Live food ratings from festival attendees.
          </p>
        </div>

        {/* Primary CTA (Rate Food) & Secondary CTA (See Top 10) */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 max-w-xs sm:max-w-sm mx-auto">
          <Link
            href="/vote"
            className="flex items-center justify-center gap-2 h-12 px-6 rounded-xl font-semibold text-base bg-amber-600 hover:bg-amber-700 active:scale-[0.98] text-white shadow-xs transition"
          >
            <Star className="w-4 h-4 fill-current" />
            <span>Rate food</span>
          </Link>

          <Link
            href="/leaderboard"
            className="flex items-center justify-center gap-2 h-12 px-6 rounded-xl font-medium text-base bg-white hover:bg-stone-50 active:scale-[0.98] border border-stone-200 text-stone-800 transition"
          >
            <Trophy className="w-4 h-4 text-amber-600" />
            <span>See Top 10</span>
          </Link>
        </div>
      </section>

      {/* Main Content Area */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Trending Section */}
        <TrendingSection />

        {/* Live Top 10 Leaderboard Component */}
        <LeaderboardTable />

        {/* Editorial "How it works" Layout */}
        <section className="pt-6 pb-2 border-t border-stone-200/80">
          <div className="max-w-xl mx-auto space-y-8">
            <div className="text-center">
              <h2 className="text-xl sm:text-2xl font-bold text-stone-950">How it works</h2>
              <p className="text-sm text-stone-500 mt-1">Simple rating from your phone while walking the stadium</p>
            </div>

            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <span className="font-mono text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200/70 rounded-md px-2 py-1 shrink-0 mt-0.5">
                  01
                </span>
                <div className="space-y-0.5">
                  <h3 className="text-base font-semibold text-stone-900">Get your pass</h3>
                  <p className="text-sm text-stone-500">Use your festival pass or wristband to start. No signup required.</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <span className="font-mono text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200/70 rounded-md px-2 py-1 shrink-0 mt-0.5">
                  02
                </span>
                <div className="space-y-0.5">
                  <h3 className="text-base font-semibold text-stone-900">Rate what you ate</h3>
                  <p className="text-sm text-stone-500">Rate up to 5 food stalls you tried today with honest 1–5 stars.</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <span className="font-mono text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200/70 rounded-md px-2 py-1 shrink-0 mt-0.5">
                  03
                </span>
                <div className="space-y-0.5">
                  <h3 className="text-base font-semibold text-stone-900">See what’s winning</h3>
                  <p className="text-sm text-stone-500">Rankings update throughout the festival as votes roll in.</p>
                </div>
              </div>
            </div>

            <div className="text-center pt-2">
              <Link
                href="/vote"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-amber-700 hover:text-amber-800 transition"
              >
                <span>Start rating</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
