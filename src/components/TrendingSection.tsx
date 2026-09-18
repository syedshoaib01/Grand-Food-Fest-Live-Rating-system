"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Star } from "lucide-react";

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
    <section className="space-y-3">
      <div className="flex items-baseline justify-between">
        <h2 className="text-sm font-semibold tracking-tight text-stone-900 flex items-center gap-1.5">
          <span>🔥 Trending now</span>
        </h2>
        <span className="text-[11px] text-stone-400">Past 30 min activity</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
        {isLoading
          ? [1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="bg-white p-3 rounded-xl border border-stone-200/70 animate-pulse space-y-2 h-20"
              >
                <div className="h-3 bg-stone-200 rounded w-24" />
                <div className="h-3 bg-stone-100 rounded w-16" />
              </div>
            ))
          : trending.map((item) => (
              <Link
                key={item.vendorId}
                href={`/vendors/${item.slug}`}
                className="group bg-white p-3.5 rounded-xl border border-stone-200/70 hover:border-amber-400/80 shadow-2xs hover:shadow-xs transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <h3 className="font-semibold text-sm text-stone-900 group-hover:text-amber-700 transition truncate">
                      {item.name}
                    </h3>
                    <span className="text-[10px] font-mono text-stone-500 bg-stone-100 px-1.5 py-0.5 rounded">
                      {item.stallNumber}
                    </span>
                  </div>
                  <p className="text-xs font-medium text-amber-700">
                    +{item.recentRatingCount} ratings in the last 30 min
                  </p>
                </div>

                <div className="mt-2 pt-2 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-500">
                  <span>{item.category}</span>
                  <div className="flex items-center gap-1">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-500" />
                    <span className="font-medium text-stone-700">
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
