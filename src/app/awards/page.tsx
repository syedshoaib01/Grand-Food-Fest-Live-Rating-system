"use client";

import React, { useState, useEffect } from "react";
import { Award, Crown, Sparkles, Trophy, Star } from "lucide-react";
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
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Ceremonial Festival Header */}
      <div className="space-y-2 pb-4 border-b border-fest-border">
        <div className="flex items-center gap-1.5 text-xs font-display font-black tracking-wider uppercase text-fest-terracotta">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Official Festival Honors</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-display font-black text-fest-charcoal tracking-tight">
          Grand Food Fest Awards 2026
        </h1>
        <p className="text-xs sm:text-sm text-fest-charcoalMuted">
          Celebrating the culinary masters of Hyderabad across Biryani, Kebabs, and Sweet Craft at Gachibowli Stadium.
        </p>
      </div>

      {/* Awards List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white p-6 rounded-2xl border border-fest-border animate-pulse space-y-3 shadow-card">
              <div className="h-3 bg-fest-parchment rounded w-1/4" />
              <div className="h-6 bg-fest-parchment rounded w-1/2" />
              <div className="h-20 bg-fest-parchment rounded-xl" />
            </div>
          ))}
        </div>
      ) : awards.length === 0 ? (
        <div className="ticket-stub p-8 text-center border border-fest-border shadow-card space-y-3">
          <Award className="w-10 h-10 mx-auto text-fest-saffron" />
          <h3 className="font-display font-extrabold text-base text-fest-charcoal">
            Awards Ceremony In Progress
          </h3>
          <p className="text-xs text-fest-charcoalMuted max-w-sm mx-auto">
            Festival nominations and honorees are unveiled as attendee voting reaches key milestone thresholds.
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
                className="ticket-stub p-6 sm:p-7 border border-fest-border shadow-card space-y-5 relative overflow-hidden group"
              >
                {/* Category Header */}
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div>
                    <span className="text-[10px] font-display font-black text-fest-terracotta uppercase tracking-wider bg-fest-terracottaLight px-2 py-0.5 rounded-md border border-fest-terracotta/20">
                      {award.category}
                    </span>
                    <h2 className="text-xl sm:text-2xl font-display font-black text-fest-charcoal mt-1.5">
                      {award.name}
                    </h2>
                  </div>

                  <span
                    className={`px-3 py-1 rounded-full text-xs font-display font-extrabold shadow-2xs ${
                      hasWinner
                        ? "bg-fest-saffronLight text-fest-saffronDark border border-fest-saffron/40"
                        : isRevealed
                        ? "bg-fest-parchment text-fest-charcoal border border-fest-border"
                        : "bg-fest-parchment/60 text-fest-charcoalTertiary border border-fest-border"
                    }`}
                  >
                    {hasWinner ? "🏆 Winner Announced" : isRevealed ? "✨ Nominees Unveiled" : "Upcoming Ceremony"}
                  </span>
                </div>

                {/* Winner Spotlight */}
                {hasWinner && (
                  <div className="p-5 rounded-2xl bg-gradient-to-br from-[#FFFDF9] to-fest-saffronLight/50 border border-fest-saffron/40 shadow-xs space-y-3 relative">
                    <div className="flex items-center gap-1.5 text-xs font-display font-black text-fest-saffronDark uppercase tracking-wider">
                      <Crown className="w-4 h-4 fill-fest-turmeric text-fest-saffron" />
                      <span>Festival Crown Winner</span>
                    </div>

                    <div className="flex items-baseline justify-between flex-wrap gap-2">
                      <div>
                        <h3 className="text-lg sm:text-xl font-display font-black text-fest-charcoal">
                          {award.winner.name}
                        </h3>
                        <p className="text-xs font-medium text-fest-charcoalMuted mt-0.5">
                          Stall {award.winner.stall} • {award.winner.category}
                        </p>
                      </div>

                      <Link
                        href={`/vendors/${award.winner.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
                        className="text-xs font-display font-bold text-fest-terracotta hover:text-fest-ember underline"
                      >
                        Explore stall details →
                      </Link>
                    </div>
                  </div>
                )}

                {/* Nominees Grid */}
                {isRevealed && award.nominees && award.nominees.length > 0 && (
                  <div className="space-y-2.5 pt-3 border-t border-fest-parchment">
                    <h4 className="text-[11px] font-display font-bold text-fest-charcoalTertiary uppercase tracking-wider">
                      Official Nominees
                    </h4>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                      {award.nominees.map((nom: any) => {
                        const isNomWinner = hasWinner && award.winner.id === nom.id;

                        return (
                          <div
                            key={nom.id}
                            className={`p-3 rounded-xl border text-xs transition ${
                              isNomWinner
                                ? "bg-fest-saffronLight/60 border-fest-saffron text-fest-charcoal shadow-2xs font-bold"
                                : "bg-fest-parchment/60 border-fest-border text-fest-charcoal"
                            }`}
                          >
                            <div className="font-display font-extrabold flex items-center justify-between">
                              <span className="truncate">{nom.name}</span>
                              {isNomWinner && <Crown className="w-3.5 h-3.5 text-fest-saffron fill-fest-turmeric shrink-0" />}
                            </div>
                            <div className="text-[10px] font-mono text-fest-charcoalMuted mt-0.5">
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
