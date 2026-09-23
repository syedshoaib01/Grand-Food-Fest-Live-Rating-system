"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, Star, MapPin } from "lucide-react";

export interface VendorCardProps {
  vendor: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    category: string;
    cuisine: string | null;
    stallNumber: string;
    vendorType: string;
    status: string;
    ratingCount: number;
    ratingAverage: number;
  };
  onRate?: (vendorId: string, vendorName: string) => void;
  userRatedScore?: number;
}

export default function VendorCard({ vendor, userRatedScore }: VendorCardProps) {
  const isFood = vendor.vendorType === "FOOD";
  const isVegCategory =
    vendor.category?.toLowerCase().includes("dessert") ||
    vendor.category?.toLowerCase().includes("ice cream") ||
    vendor.category?.toLowerCase().includes("beverage") ||
    vendor.category?.toLowerCase().includes("chaat");

  return (
    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-fest-border hover:border-fest-saffron/50 shadow-card hover:shadow-warm transition-all duration-200 flex flex-col justify-between group">
      <div>
        {/* Top Meta Bar: Stall Tag + Cuisine + Dietary Marker */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5">
            <span className="font-display text-[11px] font-black text-fest-charcoal bg-fest-parchment px-2 py-0.5 rounded-md border border-fest-border shadow-2xs">
              Stall {vendor.stallNumber}
            </span>
            {isFood && (
              <span
                className={isVegCategory ? "dot-veg" : "dot-nonveg"}
                title={isVegCategory ? "Vegetarian / Dessert friendly" : "Non-Veg / Meat available"}
              />
            )}
          </div>

          <span className="text-[11px] font-semibold text-fest-saffronDark bg-fest-saffronLight/60 px-2 py-0.5 rounded-full border border-fest-saffron/20 truncate max-w-[150px]">
            {vendor.cuisine ? `${vendor.cuisine} • ${vendor.category}` : vendor.category}
          </span>
        </div>

        {/* Vendor Name */}
        <Link href={`/vendors/${vendor.slug}`} className="block">
          <h3 className="font-display font-extrabold text-base sm:text-lg text-fest-charcoal group-hover:text-fest-terracotta transition-colors line-clamp-1">
            {vendor.name}
          </h3>
        </Link>

        {/* Mouthwatering Stall Description */}
        {vendor.description && (
          <p className="text-xs text-fest-charcoalMuted mt-1.5 line-clamp-2 leading-relaxed font-sans">
            {vendor.description}
          </p>
        )}
      </div>

      {/* Bottom Rating Line & Action */}
      <div className="mt-4 pt-3 border-t border-fest-parchment flex items-center justify-between gap-2">
        {isFood ? (
          <div>
            <div className="flex items-center gap-1.5 text-xs text-fest-charcoal font-semibold">
              <div className="flex items-center gap-0.5 text-fest-saffron">
                <Star className="w-3.5 h-3.5 fill-fest-turmeric text-fest-saffron" />
                <span className="font-display font-bold">
                  {vendor.ratingCount > 0 ? vendor.ratingAverage.toFixed(2) : "New Stall"}
                </span>
              </div>
              <span className="text-fest-charcoalTertiary">•</span>
              <span className="text-fest-charcoalMuted text-[11px]">
                {vendor.ratingCount} {vendor.ratingCount === 1 ? "tasting" : "tastings"}
              </span>
            </div>

            {userRatedScore && (
              <span className="inline-flex items-center gap-1 text-[10px] text-emerald-800 bg-emerald-50 font-bold px-1.5 py-0.5 rounded-md border border-emerald-200 mt-1">
                ✓ Your score: {userRatedScore}★
              </span>
            )}
          </div>
        ) : (
          <span className="text-xs text-fest-charcoalTertiary font-medium">
            Lifestyle pavilion
          </span>
        )}

        <div className="flex items-center shrink-0">
          {isFood && (
            <Link
              href={`/rate/${vendor.id}`}
              className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-display font-bold transition active-press ${
                userRatedScore
                  ? "bg-fest-parchment hover:bg-fest-linen text-fest-charcoal border border-fest-border"
                  : "bg-gradient-to-r from-fest-terracotta to-fest-ember text-white shadow-xs hover:opacity-95"
              }`}
            >
              <span>{userRatedScore ? "Update" : "Rate"}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
