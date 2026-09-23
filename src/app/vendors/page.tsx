"use client";

import React, { useState, useEffect } from "react";
import VendorCard from "@/components/VendorCard";
import { Search, Utensils, ShoppingBag, X, Sparkles } from "lucide-react";
import { useSession } from "@/lib/SessionContext";

export default function VendorsPage() {
  const { ratedVendors } = useSession();
  const [vendors, setVendors] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [vendorType, setVendorType] = useState<"FOOD" | "LIFESTYLE">("FOOD");
  const [isLoading, setIsLoading] = useState(true);

  const fetchVendors = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (selectedCategory !== "All") params.set("category", selectedCategory);
      params.set("type", vendorType);
      params.set("limit", "150");

      const res = await fetch(`/api/vendors?${params.toString()}`);
      const data = await res.json();
      if (res.ok) {
        setVendors(data.vendors || []);
        if (data.categories && data.categories.length > 0) {
          setCategories(["All", ...data.categories]);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVendors();
  }, [selectedCategory, vendorType]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchVendors();
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Build map of rated scores by attendee
  const ratedMap = new Map<string, number>();
  for (const r of ratedVendors) {
    ratedMap.set(r.vendorId, r.rating);
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6 overflow-x-hidden w-full">
      {/* Top Header Area */}
      <div className="space-y-4 pb-4 border-b border-white/8">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-display font-black tracking-wider uppercase text-amber-400">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Gachibowli Stadium Food Grounds</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-display font-black text-white tracking-tight mt-0.5">
              Explore 160+ Stalls
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              Discover authentic regional flavors across stadium zones.
            </p>
          </div>

          {/* Food vs Lifestyle toggle */}
          <div className="flex items-center gap-1 p-1 bg-white/5 rounded-full border border-white/10">
            <button
              type="button"
              onClick={() => {
                setVendorType("FOOD");
                setSelectedCategory("All");
              }}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-display font-semibold transition active-press ${
                vendorType === "FOOD"
                  ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-xs font-bold"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Utensils className="w-3.5 h-3.5 stroke-[1.75]" />
              <span>Food Stalls ({vendors.length})</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setVendorType("LIFESTYLE");
                setSelectedCategory("All");
              }}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-display font-semibold transition active-press ${
                vendorType === "LIFESTYLE"
                  ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-xs font-bold"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5 stroke-[1.75]" />
              <span>Lifestyle</span>
            </button>
          </div>
        </div>

        {/* Search Input - Glassmorphic */}
        <div className="relative w-full glass-panel rounded-2xl shadow-xs border border-white/10">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search stalls (e.g. Spice Route, 042, Haleem, Kulfi)..."
            className="w-full pl-10 pr-9 py-3 rounded-2xl bg-transparent border-0 text-xs sm:text-sm text-white placeholder:text-slate-500 focus:outline-hidden focus:ring-0 transition"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Category Chips Container */}
        {categories.length > 0 && (
          <div className="w-full overflow-x-auto no-scrollbar py-0.5">
            <div className="flex items-center gap-1.5 w-max">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1 rounded-full text-xs font-display font-medium whitespace-nowrap transition active-press ${
                    selectedCategory === cat
                      ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold shadow-xs"
                      : "bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Vendors Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="glass-panel p-5 rounded-3xl border border-white/10 animate-pulse space-y-3 h-36"
            >
              <div className="h-3 bg-white/10 rounded w-16" />
              <div className="h-5 bg-white/10 rounded w-36" />
              <div className="h-3 bg-white/5 rounded w-full" />
            </div>
          ))}
        </div>
      ) : vendors.length === 0 ? (
        <div className="glass-panel rounded-3xl p-10 text-center border border-white/10 shadow-xl space-y-3">
          <Utensils className="w-10 h-10 mx-auto text-amber-400" />
          <h3 className="font-display font-extrabold text-white text-base">
            No stalls match your search
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Try searching for another dish (e.g. Biryani, Seekh Kebab, Shawarma) or reset the category filter.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearch("");
              setSelectedCategory("All");
            }}
            className="mt-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-display font-bold border border-white/10 transition active-press"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {vendors.map((vendor) => (
            <VendorCard
              key={vendor.id}
              vendor={vendor}
              userRatedScore={ratedMap.get(vendor.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
