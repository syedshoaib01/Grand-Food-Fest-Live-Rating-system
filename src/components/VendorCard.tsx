"use client";

import React from "react";
import Link from "next/link";
import { Star, MapPin, ArrowRight, Utensils, Award } from "lucide-react";

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
    <div className="glass-panel p-5 rounded-2xl border border-fest-border hover:border-amber-500/40 hover:bg-fest-cardHover/70 transition duration-200 flex flex-col justify-between shadow-md">
      <div>
        {/* Top Header: Stall Number & Status */}
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-mono font-semibold bg-fest-dark border border-fest-border text-amber-400">
            <MapPin className="w-3 h-3" />
            Stall {vendor.stallNumber}
          </span>

          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-gray-800 text-gray-300">
            {vendor.category}
          </span>
        </div>

        {/* Vendor Name */}
        <Link href={`/vendors/${vendor.slug}`} className="group block">
          <h3 className="font-extrabold text-lg text-white group-hover:text-fest-gold transition line-clamp-1">
            {vendor.name}
          </h3>
        </Link>

        {vendor.cuisine && (
          <p className="text-xs font-medium text-amber-500/90 mt-0.5">
            {vendor.cuisine} Style
          </p>
        )}

        {/* Description */}
        {vendor.description && (
          <p className="text-xs text-gray-400 mt-2 line-clamp-2 leading-relaxed">
            {vendor.description}
          </p>
        )}
      </div>

      {/* Bottom Row: Ratings & Action */}
      <div className="mt-4 pt-3 border-t border-fest-border/50 flex items-center justify-between">
        {isFood ? (
          <div>
            <div className="flex items-center gap-1.5">
              <Star className="w-4 h-4 fill-fest-gold text-fest-gold" />
              <span className="font-extrabold text-sm text-white">
                {vendor.ratingCount > 0 ? vendor.ratingAverage.toFixed(2) : "New"}
              </span>
              <span className="text-[11px] text-gray-400">
                ({vendor.ratingCount})
              </span>
            </div>
            {userRatedScore && (
              <span className="text-[10px] text-green-400 font-semibold block mt-0.5">
                You rated: {userRatedScore}★
              </span>
            )}
          </div>
        ) : (
          <span className="text-xs text-gray-400 font-medium">Lifestyle Stall</span>
        )}

        <div className="flex items-center gap-2">
          {isFood && onRate && (
            <button
              onClick={() => onRate(vendor.id, vendor.name)}
              className="px-3 py-1 rounded-xl text-xs font-bold bg-fest-gold/15 hover:bg-fest-gold text-fest-gold hover:text-black border border-fest-gold/40 transition"
            >
              {userRatedScore ? "Change Rating" : "Rate"}
            </button>
          )}
          <Link
            href={`/vendors/${vendor.slug}`}
            className="p-1.5 rounded-xl bg-fest-card hover:bg-fest-border text-gray-400 hover:text-white transition"
            title="View Details"
          >
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
