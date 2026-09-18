"use client";

import React, { useState, useEffect } from "react";
import VendorCard from "@/components/VendorCard";
import { Search, Utensils, ShoppingBag, X } from "lucide-react";
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
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-5 overflow-x-hidden w-full">
      {/* Clean Top Area */}
      <div className="space-y-3 pb-3 border-b border-stone-200/80">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-stone-950 tracking-tight">
              Festival food
            </h1>
            <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
              160+ places to discover across Gachibowli Stadium
            </p>
          </div>

          {/* Food vs Lifestyle toggle */}
          <div className="flex items-center gap-1 p-1 bg-stone-100 rounded-xl">
            <button
              type="button"
              onClick={() => {
                setVendorType("FOOD");
                setSelectedCategory("All");
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition active:scale-95 ${
                vendorType === "FOOD"
                  ? "bg-white text-stone-900 shadow-xs"
                  : "text-stone-500 hover:text-stone-900"
              }`}
            >
              <Utensils className="w-3.5 h-3.5 text-amber-600" />
              <span>Food stalls</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setVendorType("LIFESTYLE");
                setSelectedCategory("All");
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition active:scale-95 ${
                vendorType === "LIFESTYLE"
                  ? "bg-white text-stone-900 shadow-xs"
                  : "text-stone-500 hover:text-stone-900"
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5 text-stone-400" />
              <span>Lifestyle</span>
            </button>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative w-full max-w-md">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search vendors, stall (e.g. A-12), or cuisine..."
            className="w-full pl-9 pr-8 py-2 rounded-xl bg-white border border-stone-200 text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Category Chips Container (Strictly bounded horizontal scroll) */}
        {categories.length > 0 && (
          <div className="w-full overflow-x-auto no-scrollbar py-0.5">
            <div className="flex items-center gap-1.5 w-max">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition active:scale-95 ${
                    selectedCategory === cat
                      ? "bg-stone-900 text-white"
                      : "bg-white border border-stone-200/80 text-stone-600 hover:bg-stone-50"
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="bg-white p-4 rounded-xl border border-stone-200/70 animate-pulse space-y-3 h-32"
            >
              <div className="h-3 bg-stone-100 rounded w-16" />
              <div className="h-4 bg-stone-200 rounded w-36" />
              <div className="h-3 bg-stone-100 rounded w-24" />
            </div>
          ))}
        </div>
      ) : vendors.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 text-center border border-stone-200/80 space-y-2">
          <Utensils className="w-8 h-8 mx-auto text-amber-500/60" />
          <h3 className="font-semibold text-stone-900 text-sm">No stalls match your search</h3>
          <p className="text-xs text-stone-500 max-w-sm mx-auto">
            Try a different search term or reset the category filter.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearch("");
              setSelectedCategory("All");
            }}
            className="mt-2 px-3.5 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold transition"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
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
