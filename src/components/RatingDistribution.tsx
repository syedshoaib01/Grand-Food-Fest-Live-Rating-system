"use client";

import React from "react";
import { Star } from "lucide-react";

interface RatingDistributionProps {
  distribution: Record<number, number>;
  percentages: Record<number, number>;
  totalRatings: number;
}

export default function RatingDistribution({
  distribution,
  percentages,
  totalRatings,
}: RatingDistributionProps) {
  const stars = [5, 4, 3, 2, 1];

  return (
    <div className="space-y-2">
      {stars.map((star) => {
        const count = distribution[star] || 0;
        const pct = percentages[star] || 0;

        return (
          <div key={star} className="flex items-center gap-2.5 text-xs">
            {/* Star label */}
            <div className="flex items-center gap-1 w-9 shrink-0 font-bold text-stone-700">
              <span>{star}</span>
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
            </div>

            {/* Progress bar */}
            <div className="flex-1 h-2.5 bg-stone-100 rounded-full overflow-hidden border border-stone-200">
              <div
                className="h-full rounded-full transition-all duration-500 bg-amber-500"
                style={{ width: `${pct}%` }}
              />
            </div>

            {/* Percent & Count */}
            <div className="w-16 text-right shrink-0 flex items-center justify-end gap-1 font-mono text-stone-500 text-[11px]">
              <span className="font-semibold text-stone-800">{pct}%</span>
              <span>({count})</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
