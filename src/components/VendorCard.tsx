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
    <div className="contain-card float-card rounded-3xl p-5 border border-slate-200/90 hover:border-orange-300 flex flex-col justify-between group shadow-sm bg-white">
      <div>
        {/* Top Meta Bar: Stall Tag + Cuisine + Dietary Marker */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5">
            <span className="font-display text-[11px] font-bold text-orange-800 bg-orange-50 px-2 py-0.5 rounded-lg border border-orange-200">
              Stall {vendor.stallNumber}
            </span>
            {isFood && (
              <span
                className={isVegCategory ? "dot-veg" : "dot-nonveg"}
                title={isVegCategory ? "Vegetarian / Dessert friendly" : "Non-Veg / Meat available"}
              />
            )}
          </div>

          <span className="text-[11px] font-medium text-slate-500 bg-slate-50 px-2.5 py-0.5 rounded-full border border-slate-100 truncate max-w-[150px]">
            {vendor.cuisine ? `${vendor.cuisine} • ${vendor.category}` : vendor.category}
          </span>
        </div>

        {/* Vendor Name */}
        <Link href={`/vendors/${vendor.slug}`} className="block">
          <h3 className="font-display font-extrabold text-base text-slate-900 group-hover:text-orange-600 transition-colors line-clamp-1">
            {vendor.name}
          </h3>
        </Link>

        {/* Stall Description */}
        {vendor.description && (
          <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 leading-relaxed font-sans">
            {vendor.description}
          </p>
        )}
      </div>

      {/* Bottom Rating Line & Action */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
        {isFood ? (
          <div>
            <div className="flex items-center gap-1.5 text-xs text-slate-900 font-semibold">
              <div className="flex items-center gap-0.5 text-slate-900">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500 stroke-[1.5]" />
                <span className="font-display font-black">
                  {vendor.ratingCount > 0 ? vendor.ratingAverage.toFixed(2) : "New Stall"}
                </span>
              </div>
              <span className="text-slate-300">•</span>
              <span className="text-slate-500 text-[11px]">
                {vendor.ratingCount} {vendor.ratingCount === 1 ? "tasting" : "tastings"}
              </span>
            </div>

            {userRatedScore && (
              <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 bg-emerald-50 font-bold px-2 py-0.5 rounded border border-emerald-200 mt-1">
                Your score: {userRatedScore}★
              </span>
            )}
          </div>
        ) : (
          <span className="text-xs text-slate-400 font-medium">
            Lifestyle pavilion
          </span>
        )}

        <div className="flex items-center shrink-0">
          {isFood && (
            <Link
              href={`/rate/${vendor.slug || vendor.id}`}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-display font-bold transition active-press ${
                userRatedScore
                  ? "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200"
                  : "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-xs hover:opacity-95"
              }`}
            >
              <span>{userRatedScore ? "Update" : "Rate"}</span>
              <ArrowRight className="w-3.5 h-3.5 stroke-[2]" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
