import React from "react";
import Link from "next/link";
import { Trophy, Flame, UtensilsCrossed, Sparkles, CheckCircle2, Ticket, ArrowRight, ShieldCheck, MapPin } from "lucide-react";
import LeaderboardTable from "@/components/LeaderboardTable";
import TrendingSection from "@/components/TrendingSection";

export default function HomePage() {
  return (
    <div className="space-y-12 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-16 px-4 sm:px-6 lg:px-8 border-b border-fest-border bg-gradient-to-b from-amber-500/10 via-fest-card/30 to-transparent">
        {/* Background glow effects */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-64 bg-amber-500/10 blur-3xl pointer-events-none" />
        <div className="absolute top-20 right-10 w-48 h-48 bg-orange-600/10 blur-2xl pointer-events-none" />

        <div className="max-w-5xl mx-auto text-center relative z-10 space-y-6">
          {/* Location & Dates Pill */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-fest-card border border-fest-border text-gray-300 shadow-sm">
            <MapPin className="w-3.5 h-3.5 text-fest-gold" />
            <span>Gachibowli Stadium, Hyderabad</span>
            <span className="text-gray-500">•</span>
            <span className="text-amber-400">October 9, 10, 11, 2026</span>
          </div>

          {/* Main Titles */}
          <div className="space-y-3">
            <h2 className="text-sm sm:text-base font-extrabold tracking-widest text-amber-500 uppercase">
              Grand Food Fest Hyderabad
            </h2>
            <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white leading-tight">
              🔥 LIVE FOOD <span className="gold-gradient-text">RANKINGS</span>
            </h1>
            <p className="text-base sm:text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
              Taste the finest Biryanis, Kebabs, Desserts & Street Eats. Rate up to 5 food stalls each day and shape the official festival leaderboard in real time.
            </p>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <Link
              href="/vote"
              className="flex items-center gap-2 px-7 py-3.5 rounded-xl font-extrabold text-base bg-gradient-to-r from-amber-500 via-amber-400 to-orange-500 text-black shadow-xl shadow-amber-500/25 hover:shadow-amber-500/40 hover:scale-[1.02] transition transform active:scale-95"
            >
              <Ticket className="w-5 h-5" />
              <span>Rate Your Food Now</span>
            </Link>

            <Link
              href="/leaderboard"
              className="flex items-center gap-2 px-6 py-3.5 rounded-xl font-bold text-base bg-fest-card hover:bg-fest-cardHover border border-fest-border text-white hover:text-fest-gold shadow transition"
            >
              <Trophy className="w-5 h-5 text-fest-gold" />
              <span>View Top 10</span>
            </Link>

            <Link
              href="/vendors"
              className="flex items-center gap-2 px-6 py-3.5 rounded-xl font-bold text-base bg-fest-card hover:bg-fest-cardHover border border-fest-border text-gray-300 hover:text-white transition"
            >
              <UtensilsCrossed className="w-5 h-5 text-gray-400" />
              <span>Explore All Vendors</span>
            </Link>
          </div>

          {/* Highlights bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl mx-auto pt-6 text-left">
            <div className="glass-panel p-3 rounded-xl border border-fest-border">
              <div className="text-xs text-gray-400 font-medium">Food Stalls</div>
              <div className="text-xl font-extrabold text-white">110+ Stalls</div>
            </div>
            <div className="glass-panel p-3 rounded-xl border border-fest-border">
              <div className="text-xs text-gray-400 font-medium">Daily Quota</div>
              <div className="text-xl font-extrabold text-amber-400">Up to 5 Stalls</div>
            </div>
            <div className="glass-panel p-3 rounded-xl border border-fest-border">
              <div className="text-xs text-gray-400 font-medium">Scoring Engine</div>
              <div className="text-xl font-extrabold text-white">Bayesian Confidence</div>
            </div>
            <div className="glass-panel p-3 rounded-xl border border-fest-border">
              <div className="text-xs text-gray-400 font-medium">Live Updates</div>
              <div className="text-xl font-extrabold text-green-400">Every 15-30s</div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Trending Section */}
        <TrendingSection />

        {/* Live Top 10 Leaderboard */}
        <LeaderboardTable />

        {/* How Voting Works */}
        <section className="glass-panel rounded-2xl p-6 sm:p-8 border border-fest-border">
          <div className="text-center max-w-2xl mx-auto mb-8 space-y-2">
            <h2 className="text-2xl font-extrabold text-white">How Voting Works</h2>
            <p className="text-sm text-gray-400">
              Simple, instantaneous, and strictly fair. No sign-up or passwords required.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-fest-dark/70 p-5 rounded-xl border border-fest-border space-y-3">
              <div className="w-10 h-10 rounded-lg bg-amber-500/20 text-fest-gold flex items-center justify-center font-bold text-lg">
                1
              </div>
              <h3 className="font-bold text-base text-white">Scan Pass / Token</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Scan your festival wristband QR code or enter your event pass number (e.g. PASS-000001). Zero personal info stored.
              </p>
            </div>

            <div className="bg-fest-dark/70 p-5 rounded-xl border border-fest-border space-y-3">
              <div className="w-10 h-10 rounded-lg bg-orange-500/20 text-orange-400 flex items-center justify-center font-bold text-lg">
                2
              </div>
              <h3 className="font-bold text-base text-white">Rate Up To 5 Vendors Daily</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Choose the stalls you personally tried today and rate them 1 to 5 stars. Re-rating the same stall on the same day updates your score.
              </p>
            </div>

            <div className="bg-fest-dark/70 p-5 rounded-xl border border-fest-border space-y-3">
              <div className="w-10 h-10 rounded-lg bg-green-500/20 text-green-400 flex items-center justify-center font-bold text-lg">
                3
              </div>
              <h3 className="font-bold text-base text-white">Watch Real-Time Rankings</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Confidence-adjusted ranking ensures popular stalls with hundreds of votes are properly recognized without novelty vote manipulation.
              </p>
            </div>
          </div>

          <div className="mt-8 text-center">
            <Link
              href="/vote"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold bg-fest-gold text-black hover:bg-fest-goldLight transition"
            >
              <Ticket className="w-4 h-4" />
              <span>Start Voting Now</span>
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
