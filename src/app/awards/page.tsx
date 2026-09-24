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
      <div className="space-y-2 pb-4 border-b border-orange-100">
        <div className="flex items-center gap-1.5 text-xs font-display font-black tracking-wider uppercase text-orange-600">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Official Festival Honors</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-display font-black text-slate-900 tracking-tight">
          Grand Food Fest Awards 2026
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Celebrating the culinary masters of Hyderabad across Biryani, Kebabs, and Sweet Craft at Gachibowli Stadium.
        </p>
      </div>

      {/* Awards List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white p-6 rounded-3xl border border-slate-100 animate-pulse space-y-3 shadow-xs">
              <div className="h-3 bg-slate-100 rounded w-1/4" />
              <div className="h-6 bg-slate-100 rounded w-1/2" />
              <div className="h-20 bg-slate-50 rounded-xl" />
            </div>
          ))}
        </div>
      ) : awards.length === 0 ? (
        <div className="bg-white p-8 text-center border border-slate-200 rounded-3xl shadow-sm space-y-3">
          <Award className="w-10 h-10 mx-auto text-orange-500" />
          <h3 className="font-display font-extrabold text-base text-slate-900">
            Awards Ceremony In Progress
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
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
                className="float-card p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-sm space-y-5 relative overflow-hidden group bg-white"
              >
                {/* Category Header */}
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div>
                    <span className="text-[10px] font-display font-bold text-orange-800 uppercase tracking-wider bg-orange-50 px-2.5 py-0.5 rounded-full border border-orange-200">
                      {award.category}
                    </span>
                    <h2 className="text-xl sm:text-2xl font-display font-black text-slate-900 mt-1.5">
                      {award.name}
                    </h2>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-display font-bold ${
                      hasWinner
                        ? "bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs"
                        : isRevealed
                        ? "bg-orange-50 text-orange-700 border border-orange-200"
                        : "bg-slate-100 text-slate-500 border border-slate-200"
                    }`}
                  >
                    {hasWinner ? (
                      <>
                        <Crown className="w-3.5 h-3.5 fill-amber-500 text-amber-600 stroke-[1.5]" />
                        <span>Winner Announced</span>
                      </>
                    ) : isRevealed ? (
                      <>
                        <Sparkles className="w-3.5 h-3.5 stroke-[2]" />
                        <span>Nominees Unveiled</span>
                      </>
                    ) : (
                      <span>Upcoming Ceremony</span>
                    )}
                  </span>
                </div>

                {/* Winner Spotlight */}
                {hasWinner && (
                  <div className="p-6 rounded-2xl glass-panel-gold border border-amber-300 shadow-sm space-y-3 relative">
                    <div className="flex items-center gap-1.5 text-xs font-display font-black text-amber-800 uppercase tracking-wider">
                      <Crown className="w-4 h-4 fill-amber-500 text-amber-600 stroke-[1.5]" />
                      <span>Festival Crown Winner</span>
                    </div>

                    <div className="flex items-baseline justify-between flex-wrap gap-2">
                      <div>
                        <h3 className="text-lg sm:text-xl font-display font-black text-slate-900">
                          {award.winner.name}
                        </h3>
                        <p className="text-xs font-semibold text-slate-600 mt-0.5">
                          Stall {award.winner.stall} • {award.winner.category}
                        </p>
                      </div>

                      <Link
                        href={`/vendors/${award.winner.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
                        className="text-xs font-display font-bold text-orange-600 hover:text-orange-700 underline"
                      >
                        Explore stall details →
                      </Link>
                    </div>
                  </div>
                )}

                {/* Nominees Grid */}
                {isRevealed && award.nominees && award.nominees.length > 0 && (
                  <div className="space-y-2.5 pt-3 border-t border-slate-100">
                    <h4 className="text-[11px] font-display font-bold text-slate-500 uppercase tracking-wider">
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
                                ? "bg-amber-50 border-amber-300 text-amber-900 font-bold shadow-2xs"
                                : "bg-slate-50 border-slate-200 text-slate-800 hover:bg-slate-100"
                            }`}
                          >
                            <div className="font-display font-extrabold flex items-center justify-between">
                              <span className="truncate">{nom.name}</span>
                              {isNomWinner && <Crown className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0" />}
                            </div>
                            <div className="text-[10px] font-mono text-slate-500 mt-0.5">
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
