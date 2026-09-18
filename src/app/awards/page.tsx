"use client";

import React, { useState, useEffect } from "react";
import { Trophy, Award, Crown, Sparkles, MapPin, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function AwardsPage() {
  const [awards, setAwards] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/awards")
      .then((res) => res.json())
      .then((data) => setAwards(data.awards || []))
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Oscars-Style Header */}
      <div className="space-y-2 pb-4 border-b border-stone-200">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900">
          <Sparkles className="w-3.5 h-3.5 text-amber-700" />
          <span>Official Festival Honors</span>
        </div>

        <h1 className="text-2xl sm:text-4xl font-extrabold text-stone-900 tracking-tight">
          Grand Food Fest Awards 2026
        </h1>

        <p className="text-xs sm:text-sm text-stone-600 max-w-xl leading-relaxed">
          Celebrating culinary mastery, crowd favorites, and artisan craftsmanship across Hyderabad.
        </p>
      </div>

      {/* Awards List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white p-6 rounded-2xl border border-stone-200 animate-pulse space-y-3">
              <div className="h-4 bg-stone-200 rounded w-1/4" />
              <div className="h-6 bg-stone-200 rounded w-1/2" />
              <div className="h-20 bg-stone-100 rounded-xl" />
            </div>
          ))}
        </div>
      ) : awards.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 text-center border border-stone-200 space-y-2">
          <Award className="w-10 h-10 mx-auto text-amber-500/70" />
          <h3 className="font-bold text-base text-stone-900">Awards Ceremony Upcoming</h3>
          <p className="text-xs text-stone-500 max-w-md mx-auto">
            Festival nominations will be revealed as voting progresses. Stay tuned!
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {awards.map((award) => {
            const hasWinner = award.status === "WINNER_ANNOUNCED" && award.winner;
            const isRevealed = award.status === "NOMINEES_REVEALED" || hasWinner;

            return (
              <div
                key={award.id}
                className="bg-white rounded-2xl p-5 sm:p-6 border border-stone-200 shadow-sm space-y-4"
              >
                {/* Category Header */}
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div>
                    <span className="text-xs font-bold tracking-wider text-amber-700 uppercase">
                      {award.category}
                    </span>
                    <h2 className="text-xl sm:text-2xl font-extrabold text-stone-900 mt-0.5">
                      {award.name}
                    </h2>
                    {award.description && (
                      <p className="text-xs text-stone-600 mt-1 max-w-xl">
                        {award.description}
                      </p>
                    )}
                  </div>

                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold ${
                      hasWinner
                        ? "bg-amber-600 text-white"
                        : isRevealed
                        ? "bg-amber-100 text-amber-900"
                        : "bg-stone-100 text-stone-600"
                    }`}
                  >
                    {hasWinner ? "🏆 Winner Announced" : isRevealed ? "Nominees Revealed" : "Upcoming"}
                  </span>
                </div>

                {/* Winner Spotlight (If Announced) */}
                {hasWinner && (
                  <div className="p-4 sm:p-5 rounded-xl bg-amber-50 border border-amber-200/80 space-y-2">
                    <div className="text-xs font-extrabold tracking-wider text-amber-800 uppercase flex items-center gap-1.5">
                      <Crown className="w-4 h-4 text-amber-600 fill-amber-500" />
                      <span>AND THE WINNER IS...</span>
                    </div>
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div>
                        <h3 className="text-xl sm:text-2xl font-black text-stone-900">
                          🏆 {award.winner.name}
                        </h3>
                        <p className="text-xs text-stone-600">
                          Stall {award.winner.stall} • {award.winner.category}
                        </p>
                      </div>

                      <Link
                        href={`/vendors/${award.winner.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
                        className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 active:scale-[0.98] text-white font-bold text-xs shadow-sm transition"
                      >
                        View Stall Profile →
                      </Link>
                    </div>
                  </div>
                )}

                {/* Nominees Grid */}
                {isRevealed && award.nominees && award.nominees.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-stone-100">
                    <h4 className="text-xs font-bold text-stone-500 uppercase tracking-wider">
                      Official Festival Nominees
                    </h4>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      {award.nominees.map((nom: any) => {
                        const isNomWinner = hasWinner && award.winner.id === nom.id;

                        return (
                          <div
                            key={nom.id}
                            className={`p-3 rounded-xl border transition ${
                              isNomWinner
                                ? "bg-amber-50 border-amber-300 font-bold"
                                : "bg-stone-50 border-stone-200"
                            }`}
                          >
                            <div className="font-bold text-xs text-stone-900 flex items-center justify-between">
                              <span className="truncate">{nom.name}</span>
                              {isNomWinner && <Crown className="w-3.5 h-3.5 text-amber-600 fill-amber-500 shrink-0" />}
                            </div>
                            <div className="text-[10px] text-stone-500 mt-0.5">
                              Stall {nom.stall}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
