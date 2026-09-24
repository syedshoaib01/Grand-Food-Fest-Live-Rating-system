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
    5: "bg-gradient-to-r from-orange-500 to-amber-500",
    4: "bg-gradient-to-r from-orange-400 to-amber-400",
    3: "bg-amber-400",
    2: "bg-slate-300",
    1: "bg-slate-200",
  };

  return (
    <div className="space-y-2.5">
      {stars.map((star) => {
        const count = distribution[star] || 0;
        const pct = percentages[star] || 0;

        return (
          <div key={star} className="flex items-center gap-3 text-xs">
            {/* Star label */}
            <div className="flex items-center gap-1 w-8 shrink-0 font-display font-bold text-slate-900">
              <span>{star}</span>
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500 stroke-[1.5]" />
            </div>

            {/* Progress bar */}
            <div className="flex-1 h-2.5 bg-slate-100 border border-slate-200 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ease-out ${barColors[star]}`}
                style={{ width: `${pct}%` }}
              />
            </div>

            {/* Percent & Count */}
            <div className="w-20 text-right shrink-0 flex items-center justify-end gap-1.5 font-mono text-[11px]">
              <span className="font-bold text-slate-900">{pct}%</span>
              <span className="text-slate-400">({count})</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
