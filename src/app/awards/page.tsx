"use client";

import React, { useState, useEffect } from "react";
import { Trophy, Award, Crown, Sparkles, MapPin, Star } from "lucide-react";
import Link from "next/link";

export default function AwardsPage() {
  const [awards, setAwards] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/awards")
      .then((res) => res.json())
      .then((data) => setAwards(data.awards || []))
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Oscars-Style Header */}
      <div className="text-center space-y-3 relative">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold bg-gradient-to-r from-amber-500/20 via-yellow-500/30 to-amber-500/20 text-fest-gold border border-amber-500/30 shadow-md">
          <Sparkles className="w-3.5 h-3.5" />
          <span>OFFICIAL FESTIVAL HONORS</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white">
          GRAND FOOD FEST <span className="gold-gradient-text">AWARDS 2026</span>
        </h1>

        <p className="text-sm sm:text-base text-gray-300 max-w-xl mx-auto leading-relaxed">
          Celebrating culinary mastery, crowd favorites, and artisan craftsmanship across Hyderabad.
        </p>
      </div>

      {/* Awards List */}
      {isLoading ? (
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="glass-panel p-8 rounded-3xl border border-fest-border animate-pulse space-y-4">
              <div className="h-6 bg-gray-800 rounded w-1/3" />
              <div className="h-4 bg-gray-800/60 rounded w-1/2" />
              <div className="h-32 bg-gray-800/40 rounded-2xl" />
            </div>
          ))}
        </div>
      ) : awards.length === 0 ? (
        <div className="glass-panel rounded-3xl p-12 text-center text-gray-400 space-y-3">
          <Award className="w-12 h-12 mx-auto text-amber-500/50" />
          <h3 className="font-bold text-lg text-white">Awards Ceremony Upcoming</h3>
          <p className="text-xs max-w-md mx-auto">
            Festival nominations will be revealed as voting progresses. Stay tuned!
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {awards.map((award) => {
            const hasWinner = award.status === "WINNER_ANNOUNCED" && award.winner;
            const isRevealed = award.status === "NOMINEES_REVEALED" || hasWinner;

            return (
              <div
                key={award.id}
                className="glass-panel rounded-3xl p-6 sm:p-10 border border-fest-border shadow-2xl relative overflow-hidden"
              >
                {/* Background glow */}
                <div className="absolute -top-20 -right-20 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

                {/* Category Header */}
                <div className="border-b border-fest-border pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <span className="text-xs font-bold tracking-widest text-amber-400 uppercase">
                      {award.category}
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-black text-white mt-1">
                      {award.name}
                    </h2>
                    {award.description && (
                      <p className="text-xs sm:text-sm text-gray-300 mt-1 max-w-2xl">
                        {award.description}
                      </p>
                    )}
                  </div>

                  <div>
                    <span
                      className={`px-3.5 py-1.5 rounded-full text-xs font-bold ${
                        hasWinner
                          ? "bg-amber-500 text-black shadow-lg shadow-amber-500/25"
                          : isRevealed
                          ? "bg-blue-500/15 text-blue-400 border border-blue-500/30"
                          : "bg-gray-800 text-gray-400"
                      }`}
                    >
                      {hasWinner ? "🏆 Winner Announced" : isRevealed ? "Nominees Revealed" : "Upcoming"}
                    </span>
                  </div>
                </div>

                {/* Winner Spotlight (If Announced) */}
                {hasWinner && (
                  <div className="mt-8 p-6 sm:p-8 rounded-2xl bg-gradient-to-r from-amber-500/20 via-yellow-500/15 to-orange-500/20 border-2 border-amber-500/60 shadow-xl relative overflow-hidden">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="text-xs font-black tracking-widest text-amber-300 uppercase flex items-center gap-1.5">
                          <Crown className="w-4 h-4 fill-amber-400" />
                          <span>AND THE WINNER IS...</span>
                        </div>
                        <h3 className="text-3xl sm:text-4xl font-black text-white">
                          🏆 {award.winner.name}
                        </h3>
                        <div className="flex items-center gap-2 text-xs font-mono text-amber-200">
                          <span>Stall {award.winner.stall}</span>
                          <span>•</span>
                          <span>{award.winner.category}</span>
                        </div>
                      </div>

                      <Link
                        href={`/vendors/${award.winner.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
                        className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs shadow transition self-start sm:self-center"
                      >
                        View Stall Profile →
                      </Link>
                    </div>
                  </div>
                )}

                {/* Nominees Grid */}
                {isRevealed && award.nominees && award.nominees.length > 0 && (
                  <div className="mt-8 space-y-3">
                    <h4 className="text-xs font-bold text-gray-400 tracking-wider uppercase">
                      Official Festival Nominees
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                      {award.nominees.map((nom: any) => {
                        const isNomWinner = hasWinner && award.winner.id === nom.id;

                        return (
                          <div
                            key={nom.id}
                            className={`p-4 rounded-xl border transition ${
                              isNomWinner
                                ? "bg-amber-500/15 border-amber-500/50 shadow-md"
                                : "bg-fest-dark/70 border-fest-border"
                            }`}
                          >
                            <div className="font-bold text-sm text-white flex items-center justify-between">
                              <span className="truncate">{nom.name}</span>
                              {isNomWinner && <Crown className="w-4 h-4 text-amber-400 fill-amber-400 shrink-0" />}
                            </div>
                            <div className="text-[11px] font-mono text-gray-400 mt-1">
                              Stall {nom.stall} {nom.cuisine && `• ${nom.cuisine}`}
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
