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
          <div className="w-6 h-6 rounded-lg bg-fest-terracottaLight flex items-center justify-center text-fest-terracotta">
            <Flame className="w-3.5 h-3.5 fill-fest-terracotta" />
          </div>
          <h2 className="font-display font-black text-base sm:text-lg text-fest-charcoal tracking-tight">
            Buzzing Right Now
          </h2>
        </div>
        <span className="text-[11px] font-medium text-fest-charcoalMuted bg-fest-parchment px-2.5 py-0.5 rounded-full border border-fest-border">
          Rolling 30-min rush
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {isLoading
          ? [1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="bg-white p-4 rounded-2xl border border-fest-border animate-pulse space-y-3 h-24"
              >
                <div className="h-4 bg-fest-parchment rounded w-3/4" />
                <div className="h-3 bg-fest-parchment rounded w-1/2" />
              </div>
            ))
          : trending.map((item) => (
              <Link
                key={item.vendorId}
                href={`/vendors/${item.slug}`}
                className="group bg-white p-4 rounded-2xl border border-fest-border hover:border-fest-terracotta/60 shadow-card hover:shadow-warm transition-all duration-200 flex flex-col justify-between active-press"
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1.5">
                    <span className="font-display text-[10px] font-black text-fest-charcoal bg-fest-parchment px-1.5 py-0.5 rounded border border-fest-border">
                      Stall {item.stallNumber}
                    </span>
                    <ArrowUpRight className="w-3.5 h-3.5 text-fest-charcoalTertiary group-hover:text-fest-terracotta transition-colors" />
                  </div>

                  <h3 className="font-display font-extrabold text-sm text-fest-charcoal group-hover:text-fest-terracotta transition-colors truncate">
                    {item.name}
                  </h3>

                  <div className="mt-1 flex items-center gap-1.5">
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-fest-terracotta bg-fest-terracottaLight/70 px-2 py-0.5 rounded-md">
                      <Flame className="w-3 h-3 fill-fest-terracotta text-fest-terracotta" />
                      +{item.recentRatingCount} tastings
                    </span>
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-fest-parchment flex items-center justify-between text-xs">
                  <span className="text-fest-charcoalMuted text-[11px] truncate font-medium">
                    {item.cuisine || item.category}
                  </span>
                  <div className="flex items-center gap-1 font-display font-bold text-fest-charcoal text-xs">
                    <Star className="w-3 h-3 fill-fest-turmeric text-fest-saffron" />
                    <span>{item.recentAverage.toFixed(1)}</span>
                  </div>
                </div>
              </Link>
            ))}
      </div>
    </section>
  );
}
