"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

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

  return (
    <div className="bg-white p-4 rounded-xl border border-stone-200/70 hover:border-stone-300 shadow-2xs hover:shadow-xs transition flex flex-col justify-between">
      <div>
        {/* Stall Number & Cuisine */}
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <span className="font-mono text-[10px] font-bold text-stone-500 bg-stone-100 px-1.5 py-0.5 rounded">
            {vendor.stallNumber}
          </span>
          <span className="text-[11px] text-stone-400 font-medium truncate">
            {vendor.cuisine || vendor.category}
          </span>
        </div>

        {/* Vendor Name */}
        <Link href={`/vendors/${vendor.slug}`} className="group block">
          <h3 className="font-bold text-base text-stone-950 group-hover:text-amber-700 transition line-clamp-1">
            {vendor.name}
          </h3>
        </Link>
      </div>

      {/* Rating line & Action */}
      <div className="mt-3 pt-2.5 border-t border-stone-100 flex items-center justify-between">
        {isFood ? (
          <div>
            <div className="text-xs text-stone-600 font-medium">
              ⭐ {vendor.ratingCount > 0 ? vendor.ratingAverage.toFixed(2) : "New"} · {vendor.ratingCount} ratings
            </div>
            {userRatedScore && (
              <span className="text-[10px] text-emerald-700 font-semibold block mt-0.5">
                Your rating: {userRatedScore}★
              </span>
            )}
          </div>
        ) : (
          <span className="text-xs text-stone-400 font-medium">Lifestyle showcase</span>
        )}

        <div className="flex items-center gap-2">
          {isFood && (
            <Link
              href={`/vote?vendorId=${vendor.id}`}
              className="text-xs font-semibold text-amber-700 hover:text-amber-800 transition flex items-center gap-0.5"
            >
              <span>{userRatedScore ? "Re-rate" : "Rate"}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
