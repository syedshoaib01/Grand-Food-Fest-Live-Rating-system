"use client";

import React, { useState, useEffect } from "react";
import { Award, Crown } from "lucide-react";
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
      {/* Restrained Ceremonial Header */}
      <div className="space-y-1 pb-3 border-b border-stone-200/80">
        <h1 className="text-2xl sm:text-3xl font-bold text-stone-950 tracking-tight">
          Grand Food Fest Awards
        </h1>
        <p className="text-xs sm:text-sm text-stone-500">
          Official festival honors celebrating culinary craft across Hyderabad.
        </p>
      </div>

      {/* Awards List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white p-5 rounded-2xl border border-stone-200/70 animate-pulse space-y-2.5">
              <div className="h-3 bg-stone-100 rounded w-1/5" />
              <div className="h-5 bg-stone-200 rounded w-1/3" />
              <div className="h-16 bg-stone-50 rounded-xl" />
            </div>
          ))}
        </div>
      ) : awards.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center border border-stone-200/80 space-y-2">
          <Award className="w-8 h-8 mx-auto text-amber-600/70" />
          <h3 className="font-semibold text-sm text-stone-900">Awards ceremony upcoming</h3>
          <p className="text-xs text-stone-400 max-w-sm mx-auto">
            Festival nominations and honorees will be revealed as voting progresses.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {awards.map((award) => {
            const hasWinner = award.status === "WINNER_ANNOUNCED" && award.winner;
            const isRevealed = award.status === "NOMINEES_REVEALED" || hasWinner;

            return (
              <div
                key={award.id}
                className="bg-white rounded-2xl p-5 border border-stone-200/80 shadow-2xs space-y-4"
              >
                {/* Category Header */}
                <div className="flex items-baseline justify-between gap-2">
                  <div>
                    <span className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider">
                      {award.category}
                    </span>
                    <h2 className="text-lg sm:text-xl font-bold text-stone-950 mt-0.5">
                      {award.name}
                    </h2>
                  </div>

                  <span
                    className={`px-2.5 py-0.5 rounded text-[11px] font-semibold ${
                      hasWinner
                        ? "bg-amber-100 text-amber-900"
                        : isRevealed
                        ? "bg-stone-100 text-stone-800"
                        : "bg-stone-50 text-stone-400"
                    }`}
                  >
                    {hasWinner ? "Winner announced" : isRevealed ? "Nominees revealed" : "Upcoming"}
                  </span>
                </div>

                {/* Winner Spotlight (If Announced) */}
                {hasWinner && (
                  <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200/70 space-y-2">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-800 uppercase tracking-wider">
                      <Crown className="w-3.5 h-3.5 fill-amber-500 text-amber-600" />
                      <span>Winner</span>
                    </div>

                    <div className="flex items-baseline justify-between flex-wrap gap-2">
                      <div>
                        <h3 className="text-base sm:text-lg font-bold text-stone-950">
                          {award.winner.name}
                        </h3>
                        <p className="text-xs text-stone-500">
                          Stall {award.winner.stall} • {award.winner.category}
                        </p>
                      </div>

                      <Link
                        href={`/vendors/${award.winner.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
                        className="text-xs font-semibold text-amber-800 hover:text-amber-900 underline"
                      >
                        View stall →
                      </Link>
                    </div>
                  </div>
                )}

                {/* Nominees Grid */}
                {isRevealed && award.nominees && award.nominees.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-stone-100">
                    <h4 className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider">
                      Nominees
                    </h4>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {award.nominees.map((nom: any) => {
                        const isNomWinner = hasWinner && award.winner.id === nom.id;

                        return (
                          <div
                            key={nom.id}
                            className={`p-2.5 rounded-lg border text-xs transition ${
                              isNomWinner
                                ? "bg-amber-50/50 border-amber-300 font-semibold"
                                : "bg-stone-50/60 border-stone-200/70"
                            }`}
                          >
                            <div className="font-medium text-stone-900 flex items-center justify-between">
                              <span className="truncate">{nom.name}</span>
                              {isNomWinner && <Crown className="w-3 h-3 text-amber-600 fill-amber-500 shrink-0" />}
                            </div>
                            <div className="text-[10px] text-stone-400 mt-0.5">
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
