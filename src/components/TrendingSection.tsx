"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Flame, Star } from "lucide-react";

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
  velocityLabel: string;
  surgeReason: string;
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
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-orange-100 text-orange-700 flex items-center justify-center">
          <Flame className="w-4 h-4 fill-current" />
        </div>
        <div>
          <h2 className="font-extrabold text-base sm:text-lg text-stone-900">
            Trending now
          </h2>
          <p className="text-[11px] text-stone-500">
            Highest rating activity in the last 30 minutes
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3.5">
        {isLoading
          ? [1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="bg-white p-3.5 rounded-xl border border-stone-200 animate-pulse space-y-2"
              >
                <div className="h-3 bg-stone-200 rounded w-16" />
                <div className="h-4 bg-stone-200 rounded w-28" />
                <div className="h-3 bg-stone-100 rounded w-20" />
              </div>
            ))
          : trending.map((item) => (
              <Link
                key={item.vendorId}
                href={`/vendors/${item.slug}`}
                className="group bg-white p-3.5 rounded-xl border border-stone-200 hover:border-amber-400 shadow-sm hover:shadow transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="text-[10px] font-mono font-bold text-stone-500 bg-stone-100 px-1.5 py-0.5 rounded">
                      {item.stallNumber}
                    </span>
                    <span className="text-[10px] font-bold text-orange-700 bg-orange-50 px-1.5 py-0.5 rounded">
                      +{item.recentRatingCount} in 30m
                    </span>
                  </div>

                  <h3 className="font-bold text-sm text-stone-900 group-hover:text-amber-700 transition truncate">
                    {item.name}
                  </h3>
                  <p className="text-[11px] text-stone-500 truncate">
                    {item.category}
                  </p>
                </div>

                <div className="mt-2 pt-2 border-t border-stone-100 flex items-center justify-between text-xs">
                  <span className="text-stone-500 text-[11px]">Avg:</span>
                  <div className="flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                    <span className="font-bold text-stone-900 font-mono text-xs">
                      {item.recentAverage.toFixed(1)}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
      </div>
    </section>
  );
}
