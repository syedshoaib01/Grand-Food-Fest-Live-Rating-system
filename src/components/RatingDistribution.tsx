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
}: RatingDistributionProps) {
  const stars = [5, 4, 3, 2, 1];

  const barColors: Record<number, string> = {
    5: "bg-gradient-to-r from-fest-terracotta to-fest-ember",
    4: "bg-gradient-to-r from-fest-saffron to-fest-turmeric",
    3: "bg-amber-400",
    2: "bg-stone-300",
    1: "bg-stone-200",
  };

  return (
    <div className="space-y-2.5">
      {stars.map((star) => {
        const count = distribution[star] || 0;
        const pct = percentages[star] || 0;

        return (
          <div key={star} className="flex items-center gap-3 text-xs">
            {/* Star label */}
            <div className="flex items-center gap-1 w-9 shrink-0 font-display font-bold text-fest-charcoal">
              <span>{star}</span>
              <Star className="w-3.5 h-3.5 fill-fest-turmeric text-fest-saffron" />
            </div>

            {/* Progress bar */}
            <div className="flex-1 h-3 bg-fest-parchment rounded-full overflow-hidden border border-fest-border">
              <div
                className={`h-full rounded-full transition-all duration-500 ${barColors[star]}`}
                style={{ width: `${pct}%` }}
              />
            </div>

            {/* Percent & Count */}
            <div className="w-20 text-right shrink-0 flex items-center justify-end gap-1 font-mono text-fest-charcoalMuted text-[11px]">
              <span className="font-bold text-fest-charcoal">{pct}%</span>
              <span>({count})</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
