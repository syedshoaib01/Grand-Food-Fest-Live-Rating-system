"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Flame, Star, TrendingUp, Sparkles } from "lucide-react";

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
    fetch("/api/trending?window=60&limit=4")
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
    <section className="my-8">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-orange-500/20 text-orange-400 flex items-center justify-center">
            <Flame className="w-5 h-5 text-orange-500 fill-orange-500 animate-pulse" />
          </div>
          <div>
            <h2 className="font-extrabold text-xl text-white flex items-center gap-2">
              <span>🔥 TRENDING NOW</span>
            </h2>
            <p className="text-xs text-gray-400">
              Highest rating velocity in the last 60 minutes
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading
          ? [1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="glass-panel p-4 rounded-xl border border-fest-border animate-pulse space-y-3"
              >
                <div className="h-4 bg-gray-800 rounded w-1/2" />
                <div className="h-3 bg-gray-800/60 rounded w-3/4" />
                <div className="h-8 bg-gray-800 rounded" />
              </div>
            ))
          : trending.map((item, idx) => (
              <Link
                key={item.vendorId}
                href={`/vendors/${item.slug}`}
                className="group glass-panel p-4 rounded-2xl border border-fest-border hover:border-orange-500/50 hover:bg-fest-cardHover transition duration-200 shadow-lg relative overflow-hidden flex flex-col justify-between"
              >
                {/* Glow accent */}
                <div className="absolute -top-10 -right-10 w-24 h-24 bg-orange-500/10 rounded-full blur-xl group-hover:bg-orange-500/20 transition" />

                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-orange-500/15 text-orange-400 border border-orange-500/30 flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      {item.velocityLabel}
                    </span>
                    <span className="text-[11px] font-mono text-gray-400">
                      Stall {item.stallNumber}
                    </span>
                  </div>

                  <h3 className="font-extrabold text-base text-white group-hover:text-amber-400 transition truncate">
                    {item.name}
                  </h3>
                  <p className="text-xs text-gray-400 truncate mt-0.5">
                    {item.category} {item.cuisine && `• ${item.cuisine}`}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-fest-border/50 flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-fest-gold text-fest-gold" />
                    <span className="font-bold text-sm text-white">
                      {item.recentAverage.toFixed(2)}
                    </span>
                  </div>
                  <span className="text-xs text-amber-400/90 font-medium">
                    {item.recentRatingCount} recent votes
                  </span>
                </div>
              </Link>
            ))}
      </div>
    </section>
  );
}
