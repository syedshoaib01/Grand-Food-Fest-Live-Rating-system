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
    5: "bg-linear-to-r from-amber-500 to-orange-500 shadow-[0_0_10px_rgba(245,158,11,0.4)]",
    4: "bg-linear-to-r from-amber-400 to-amber-500",
    3: "bg-amber-400/80",
    2: "bg-slate-600",
    1: "bg-slate-700",
  };

  return (
    <div className="space-y-2.5">
      {stars.map((star) => {
        const count = distribution[star] || 0;
        const pct = percentages[star] || 0;

        return (
          <div key={star} className="flex items-center gap-3 text-xs">
            {/* Star label */}
            <div className="flex items-center gap-1 w-8 shrink-0 font-display font-bold text-slate-200">
              <span>{star}</span>
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-300 stroke-[1.5]" />
            </div>

            {/* Progress bar */}
            <div className="flex-1 h-2 bg-slate-900/80 border border-white/5 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ease-out ${barColors[star]}`}
                style={{ width: `${pct}%` }}
              />
            </div>

            {/* Percent & Count */}
            <div className="w-20 text-right shrink-0 flex items-center justify-end gap-1.5 font-mono text-[11px]">
              <span className="font-bold text-slate-200">{pct}%</span>
              <span className="text-slate-500">({count})</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
