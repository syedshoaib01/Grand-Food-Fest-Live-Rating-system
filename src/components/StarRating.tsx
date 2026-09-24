"use client";

import React, { useState } from "react";
import { Star } from "lucide-react";

interface StarRatingProps {
  value: number; // 0 = no rating selected, 1-5 = selected
  onChange?: (rating: number) => void;
  readOnly?: boolean;
  size?: "sm" | "md" | "lg" | "xl";
  showLabel?: boolean;
}

const STAR_LABELS: Record<number, string> = {
  1: "1 • Needs Improvement",
  2: "2 • Fair Tasting",
  3: "3 • Good Flavor",
  4: "4 • Very Delicious",
  5: "5 • Festival Excellence",
};

export default function StarRating({
  value,
  onChange,
  readOnly = false,
  size = "md",
  showLabel = true,
}: StarRatingProps) {
  const [hoverRating, setHoverRating] = useState<number | null>(null);

  const starSizes = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
    xl: "w-10 h-10",
  };

  const buttonSizes = {
    sm: "p-1 min-w-[32px] min-h-[32px]",
    md: "p-1.5 min-w-[44px] min-h-[44px]",
    lg: "p-2 min-w-[48px] min-h-[48px]",
    xl: "p-2.5 min-w-[52px] min-h-[52px]",
  };

  const activeScore = hoverRating !== null ? hoverRating : value;

  return (
    <div className="flex flex-col items-start gap-1">
      <div
        className="inline-flex items-center gap-1 sm:gap-1.5"
        role={readOnly ? "img" : "radiogroup"}
        aria-label={
          readOnly
            ? `Rating: ${value > 0 ? value : "No rating"} out of 5 stars`
            : "Rate from 1 to 5 stars"
        }
      >
        {[1, 2, 3, 4, 5].map((star) => {
          const isFilled = star <= activeScore;

          if (readOnly) {
            return (
              <span key={star} className="p-0.5">
                <Star
                  className={`${starSizes[size]} transition-transform ${
                    isFilled
                      ? "fill-fest-turmeric text-fest-saffron"
                      : "text-fest-border fill-transparent"
                  }`}
                />
              </span>
            );
          }

          return (
            <button
              key={star}
              type="button"
              role="radio"
              aria-checked={value === star}
              aria-label={STAR_LABELS[star]}
              onClick={() => onChange && onChange(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(null)}
              className={`${buttonSizes[size]} flex items-center justify-center rounded-xl focus:outline-hidden focus-visible:ring-2 focus-visible:ring-orange-500 transition-all duration-150 hover:scale-110 active:scale-90 touch-manipulation`}
            >
              <Star
                className={`${starSizes[size]} transition-all duration-150 ${
                  isFilled
                    ? "fill-amber-400 text-amber-500 drop-shadow-[0_0_6px_rgba(245,158,11,0.4)] scale-105"
                    : "text-slate-300 hover:text-amber-400 fill-transparent"
                }`}
              />
            </button>
          );
        })}
      </div>

      {showLabel && !readOnly && (
        <div className="min-h-[22px] flex items-center">
          {activeScore > 0 ? (
            <span className="text-xs font-bold text-orange-800 bg-orange-50 border border-orange-200 px-2.5 py-0.5 rounded-full animate-in fade-in duration-150">
              {STAR_LABELS[activeScore]}
            </span>
          ) : (
            <span className="text-xs font-medium text-slate-500">
              Tap stars to rate (1–5)
            </span>
          )}
        </div>
      )}
    </div>
  );
}
