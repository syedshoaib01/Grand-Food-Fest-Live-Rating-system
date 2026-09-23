"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Star, Flame, ArrowUpRight } from "lucide-react";

export interface TrendingVendor {
  vendorId: string;
  name: string;
  slug: string;
  category: string;
  cuisine: string | null;
  stallNumber: string;
  recentRatingCount: number;
  recentAverage: number;
  trendingScore: number;
}

export default function TrendingSection() {
  const [trending, setTrending] = useState<TrendingVendor[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/trending?window=30&limit=4")
      .then((res) => res.json())
      .then((data) => {
        setTrending(data.trending || []);
      })
      .catch((e) => console.error("Error fetching trending:", e))
      .finally(() => setIsLoading(false));
  }, []);

  if (!isLoading && trending.length === 0) {
    return null;
  }

  return (
    <section className="space-y-3.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-orange-500/15 border border-orange-500/30 flex items-center justify-center text-orange-400 shadow-xs">
            <Flame className="w-4 h-4 fill-orange-400" />
          </div>
          <h2 className="font-display font-black text-base sm:text-lg text-white tracking-tight">
            Buzzing Right Now
          </h2>
        </div>
        <span className="text-[11px] font-medium text-slate-400 bg-white/5 px-2.5 py-0.5 rounded-full border border-white/10">
          Rolling 30-min rush
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {isLoading
          ? [1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="glass-panel p-4 rounded-2xl border border-white/10 animate-pulse space-y-3 h-24"
              >
                <div className="h-4 bg-white/10 rounded w-3/4" />
                <div className="h-3 bg-white/5 rounded w-1/2" />
              </div>
            ))
          : trending.map((item) => (
              <Link
                key={item.vendorId}
                href={`/vendors/${item.slug}`}
                className="glass-panel float-card p-4 rounded-2xl border border-white/10 hover:border-amber-400/40 flex flex-col justify-between active-press group"
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1.5">
                    <span className="font-display text-[10px] font-bold text-slate-300 bg-white/10 px-1.5 py-0.5 rounded border border-white/10">
                      Stall {item.stallNumber}
                    </span>
                    <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-amber-400 transition-colors stroke-[1.75]" />
                  </div>

                  <h3 className="font-display font-extrabold text-sm text-white group-hover:text-amber-400 transition-colors truncate">
                    {item.name}
                  </h3>

                  <div className="mt-1 flex items-center gap-1.5">
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded-full border border-orange-500/20">
                      +{item.recentRatingCount} tastings
                    </span>
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-white/8 flex items-center justify-between text-xs">
                  <span className="text-slate-400 text-[11px] truncate font-medium">
                    {item.cuisine || item.category}
                  </span>
                  <div className="flex items-center gap-1 font-display font-bold text-white text-xs">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400 stroke-[1.5]" />
                    <span>{item.recentAverage.toFixed(1)}</span>
                  </div>
                </div>
              </Link>
            ))}
      </div>
    </section>
  );
}
