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
      <div className="space-y-2 pb-4 border-b border-white/8">
        <div className="flex items-center gap-1.5 text-xs font-display font-black tracking-wider uppercase text-amber-400">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Official Festival Honors</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-display font-black text-white tracking-tight">
          Grand Food Fest Awards 2026
        </h1>
        <p className="text-xs sm:text-sm text-slate-400">
          Celebrating the culinary masters of Hyderabad across Biryani, Kebabs, and Sweet Craft at Gachibowli Stadium.
        </p>
      </div>

      {/* Awards List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="glass-panel p-6 rounded-3xl border border-white/10 animate-pulse space-y-3 shadow-lg">
              <div className="h-3 bg-white/10 rounded w-1/4" />
              <div className="h-6 bg-white/10 rounded w-1/2" />
              <div className="h-20 bg-white/5 rounded-xl" />
            </div>
          ))}
        </div>
      ) : awards.length === 0 ? (
        <div className="glass-panel p-8 text-center border border-white/10 rounded-3xl shadow-xl space-y-3">
          <Award className="w-10 h-10 mx-auto text-amber-400" />
          <h3 className="font-display font-extrabold text-base text-white">
            Awards Ceremony In Progress
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
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
                className="float-card glass-panel p-6 sm:p-7 rounded-3xl border border-white/10 shadow-xl space-y-5 relative overflow-hidden group"
              >
                {/* Category Header */}
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div>
                    <span className="text-[10px] font-display font-bold text-amber-400 uppercase tracking-wider bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
                      {award.category}
                    </span>
                    <h2 className="text-xl sm:text-2xl font-display font-black text-white mt-1.5">
                      {award.name}
                    </h2>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-display font-bold ${
                      hasWinner
                        ? "bg-amber-500/20 text-amber-300 border border-amber-400/40 shadow-[0_0_12px_rgba(245,158,11,0.2)]"
                        : isRevealed
                        ? "bg-white/10 text-white border border-white/15"
                        : "bg-white/5 text-slate-500 border border-white/5"
                    }`}
                  >
                    {hasWinner ? (
                      <>
                        <Crown className="w-3.5 h-3.5 fill-amber-400 text-amber-300 stroke-[1.5]" />
                        <span>Winner Announced</span>
                      </>
                    ) : isRevealed ? (
                      <>
                        <Sparkles className="w-3.5 h-3.5 stroke-[1.75]" />
                        <span>Nominees Unveiled</span>
                      </>
                    ) : (
                      <span>Upcoming Ceremony</span>
                    )}
                  </span>
                </div>

                {/* Winner Spotlight */}
                {hasWinner && (
                  <div className="p-6 rounded-2xl glass-panel-gold border border-amber-400/40 shadow-lg space-y-3 relative">
                    <div className="flex items-center gap-1.5 text-xs font-display font-black text-amber-300 uppercase tracking-wider">
                      <Crown className="w-4 h-4 fill-amber-400 text-amber-300 stroke-[1.5]" />
                      <span>Festival Crown Winner</span>
                    </div>

                    <div className="flex items-baseline justify-between flex-wrap gap-2">
                      <div>
                        <h3 className="text-lg sm:text-xl font-display font-black text-white">
                          {award.winner.name}
                        </h3>
                        <p className="text-xs font-medium text-slate-300 mt-0.5">
                          Stall {award.winner.stall} • {award.winner.category}
                        </p>
                      </div>

                      <Link
                        href={`/vendors/${award.winner.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
                        className="text-xs font-display font-bold text-amber-400 hover:text-amber-300 underline"
                      >
                        Explore stall details →
                      </Link>
                    </div>
                  </div>
                )}

                {/* Nominees Grid */}
                {isRevealed && award.nominees && award.nominees.length > 0 && (
                  <div className="space-y-2.5 pt-3 border-t border-white/8">
                    <h4 className="text-[11px] font-display font-bold text-slate-400 uppercase tracking-wider">
                      Official Nominees
                    </h4>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                      {award.nominees.map((nom: any) => {
                        const isNomWinner = hasWinner && award.winner.id === nom.id;

                        return (
                          <div
                            key={nom.id}
                            className={`p-3 rounded-2xl border text-xs transition ${
                              isNomWinner
                                ? "bg-amber-500/20 border-amber-400 text-white font-bold shadow-xs"
                                : "bg-white/5 border-white/10 text-white hover:bg-white/10"
                            }`}
                          >
                            <div className="font-display font-extrabold flex items-center justify-between">
                              <span className="truncate">{nom.name}</span>
                              {isNomWinner && <Crown className="w-3.5 h-3.5 text-amber-400 fill-amber-400 shrink-0" />}
                            </div>
                            <div className="text-[10px] font-mono text-slate-400 mt-0.5">
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
