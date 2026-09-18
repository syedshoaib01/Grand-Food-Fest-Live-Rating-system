"use client";

import React from "react";
import Link from "next/link";
import { Star, MapPin, ArrowRight } from "lucide-react";

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

export default function VendorCard({ vendor, onRate, userRatedScore }: VendorCardProps) {
  const isFood = vendor.vendorType === "FOOD";

  return (
    <div className="bg-white p-4 rounded-xl border border-stone-200 hover:border-stone-300 shadow-sm transition flex flex-col justify-between">
      <div>
        {/* Top Header: Stall Number & Category */}
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-stone-100 text-stone-700">
            {vendor.stallNumber}
          </span>
          <span className="text-[11px] font-semibold text-stone-500">
            {vendor.category}
          </span>
        </div>

        {/* Vendor Name */}
        <Link href={`/vendors/${vendor.slug}`} className="group block">
          <h3 className="font-bold text-base text-stone-900 group-hover:text-amber-700 transition line-clamp-1">
            {vendor.name}
          </h3>
        </Link>

        {vendor.cuisine && (
          <p className="text-xs text-amber-700/90 font-medium mt-0.5">
            {vendor.cuisine}
          </p>
        )}
      </div>

      {/* Bottom Row: Ratings & Action */}
      <div className="mt-3 pt-2.5 border-t border-stone-100 flex items-center justify-between">
        {isFood ? (
          <div>
            <div className="flex items-center gap-1">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
              <span className="font-bold text-sm text-stone-900">
                {vendor.ratingCount > 0 ? vendor.ratingAverage.toFixed(2) : "New"}
              </span>
              <span className="text-[11px] text-stone-500">
                ({vendor.ratingCount})
              </span>
            </div>
            {userRatedScore && (
              <span className="text-[10px] text-emerald-700 font-bold block">
                You rated: {userRatedScore}★
              </span>
            )}
          </div>
        ) : (
          <span className="text-xs text-stone-500 font-medium">Lifestyle</span>
        )}

        <div className="flex items-center gap-1.5">
          {isFood && (
            <Link
              href={`/vote?vendorId=${vendor.id}`}
              className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200/80 transition"
            >
              {userRatedScore ? "Re-rate" : "Rate"}
            </Link>
          )}
          <Link
            href={`/vendors/${vendor.slug}`}
            className="p-1 rounded-lg text-stone-400 hover:text-stone-800 hover:bg-stone-100 transition"
            aria-label={`Details for ${vendor.name}`}
          >
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
