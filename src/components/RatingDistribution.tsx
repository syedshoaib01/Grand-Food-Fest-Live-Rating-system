"use client";

import React from "react";
import { Star } from "lucide-react";

interface RatingDistributionProps {
  distribution: Record<number, number>; // { 5: count, 4: count, ... }
  percentages: Record<number, number>; // { 5: %, 4: %, ... }
  totalRatings: number;
}

export default function RatingDistribution({
  distribution,
  percentages,
  totalRatings,
}: RatingDistributionProps) {
  const stars = [5, 4, 3, 2, 1];

  return (
    <div className="space-y-2.5">
      {stars.map((star) => {
        const count = distribution[star] || 0;
        const pct = percentages[star] || 0;

        return (
          <div key={star} className="flex items-center gap-3 text-xs">
            {/* Star label */}
            <div className="flex items-center gap-1 w-10 shrink-0 font-bold text-gray-300">
              <span>{star}</span>
              <Star className="w-3.5 h-3.5 fill-fest-gold text-fest-gold" />
            </div>

            {/* Progress bar */}
            <div className="flex-1 h-3 bg-fest-dark rounded-full overflow-hidden border border-fest-border/50">
              <div
                className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-amber-500 to-orange-500"
                style={{ width: `${pct}%` }}
              />
            </div>

            {/* Percent & Count */}
            <div className="w-20 text-right shrink-0 flex items-center justify-end gap-1.5 font-mono text-gray-400">
              <span className="font-semibold text-gray-200">{pct}%</span>
              <span className="text-[11px] text-gray-500">({count})</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
