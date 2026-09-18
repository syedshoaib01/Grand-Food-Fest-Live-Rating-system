"use client";

import React, { useState } from "react";
import { Star } from "lucide-react";

interface StarRatingProps {
  value: number;
  onChange?: (rating: number) => void;
  readOnly?: boolean;
  size?: "sm" | "md" | "lg" | "xl";
  showLabel?: boolean;
}

const STAR_LABELS: Record<number, string> = {
  1: "1 Star — Very Poor",
  2: "2 Stars — Poor",
  3: "3 Stars — Average",
  4: "4 Stars — Good",
  5: "5 Stars — Excellent!",
};

export default function StarRating({
  value,
  onChange,
  readOnly = false,
  size = "md",
  showLabel = false,
}: StarRatingProps) {
  const [hoverRating, setHoverRating] = useState<number | null>(null);

  const starSizes = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
    xl: "w-11 h-11",
  };

  const buttonPaddings = {
    sm: "p-0.5",
    md: "p-1",
    lg: "p-2",
    xl: "p-2.5",
  };

  const activeScore = hoverRating !== null ? hoverRating : value;

  return (
    <div className="inline-flex flex-col items-start gap-1">
      <div
        className="inline-flex items-center gap-1"
        role={readOnly ? "img" : "radiogroup"}
        aria-label={readOnly ? `Rating: ${value} out of 5 stars` : "Rate from 1 to 5 stars"}
      >
        {[1, 2, 3, 4, 5].map((star) => {
          const isFilled = star <= activeScore;

          if (readOnly) {
            return (
              <span key={star} className="text-fest-gold">
                <Star
                  className={`${starSizes[size]} ${
                    isFilled ? "fill-fest-gold text-fest-gold" : "text-gray-600 fill-transparent"
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
              className={`${buttonPaddings[size]} rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-fest-gold transition transform active:scale-95`}
            >
              <Star
                className={`${starSizes[size]} transition duration-150 ${
                  isFilled
                    ? "fill-fest-gold text-fest-gold filter drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]"
                    : "text-gray-500 hover:text-fest-gold/60"
                }`}
              />
            </button>
          );
        })}
      </div>

      {showLabel && activeScore > 0 && (
        <span className="text-xs font-semibold text-fest-goldLight animate-fadeIn">
          {STAR_LABELS[activeScore]}
        </span>
      )}
    </div>
  );
}
