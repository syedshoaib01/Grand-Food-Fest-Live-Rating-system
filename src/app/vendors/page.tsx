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
      <div className="space-y-4 pb-4 border-b border-fest-border">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-display font-black tracking-wider uppercase text-fest-terracotta">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Gachibowli Stadium Food Grounds</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-display font-black text-fest-charcoal tracking-tight mt-0.5">
              Explore 160+ Stalls
            </h1>
            <p className="text-xs sm:text-sm text-fest-charcoalMuted mt-0.5">
              Discover authentic regional flavors across stadium zones.
            </p>
          </div>

          {/* Food vs Lifestyle toggle */}
          <div className="flex items-center gap-1 p-1 bg-fest-parchment rounded-xl border border-fest-border">
            <button
              type="button"
              onClick={() => {
                setVendorType("FOOD");
                setSelectedCategory("All");
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-display font-bold transition active-press ${
                vendorType === "FOOD"
                  ? "bg-white text-fest-charcoal shadow-xs"
                  : "text-fest-charcoalMuted hover:text-fest-charcoal"
              }`}
            >
              <Utensils className="w-3.5 h-3.5 text-fest-terracotta" />
              <span>Food Stalls ({vendors.length})</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setVendorType("LIFESTYLE");
                setSelectedCategory("All");
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-display font-bold transition active-press ${
                vendorType === "LIFESTYLE"
                  ? "bg-white text-fest-charcoal shadow-xs"
                  : "text-fest-charcoalMuted hover:text-fest-charcoal"
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5 text-fest-charcoalTertiary" />
              <span>Lifestyle</span>
            </button>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative w-full">
          <Search className="w-4 h-4 text-fest-charcoalTertiary absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search stalls (e.g. Spice Route, 042, Haleem, Kulfi)..."
            className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-white border border-fest-border text-xs sm:text-sm text-fest-charcoal placeholder:text-fest-charcoalTertiary focus:outline-hidden focus:ring-2 focus:ring-fest-saffron shadow-2xs transition"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-fest-charcoalTertiary hover:text-fest-charcoal p-1"
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
                  className={`px-3 py-1.5 rounded-xl text-xs font-display font-bold whitespace-nowrap transition active-press ${
                    selectedCategory === cat
                      ? "bg-fest-charcoal text-white shadow-2xs"
                      : "bg-white border border-fest-border text-fest-charcoalMuted hover:text-fest-charcoal hover:bg-fest-parchment shadow-2xs"
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
              className="bg-white p-5 rounded-2xl border border-fest-border animate-pulse space-y-3 h-36 shadow-2xs"
            >
              <div className="h-3 bg-fest-parchment rounded w-16" />
              <div className="h-5 bg-fest-parchment rounded w-36" />
              <div className="h-3 bg-fest-parchment rounded w-full" />
            </div>
          ))}
        </div>
      ) : vendors.length === 0 ? (
        <div className="bg-white rounded-3xl p-10 text-center border border-fest-border shadow-card space-y-3">
          <Utensils className="w-10 h-10 mx-auto text-fest-saffron" />
          <h3 className="font-display font-extrabold text-fest-charcoal text-base">
            No stalls match your search
          </h3>
          <p className="text-xs text-fest-charcoalMuted max-w-sm mx-auto">
            Try searching for another dish (e.g. Biryani, Seekh Kebab, Shawarma) or reset the category filter.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearch("");
              setSelectedCategory("All");
            }}
            className="mt-2 px-4 py-2 rounded-xl bg-fest-parchment hover:bg-fest-linen text-fest-charcoal text-xs font-display font-bold border border-fest-border transition active-press"
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
