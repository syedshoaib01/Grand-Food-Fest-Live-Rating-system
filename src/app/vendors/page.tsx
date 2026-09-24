"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import VendorCard from "@/components/VendorCard";
import { Search, Utensils, ShoppingBag, X, Sparkles, ChevronDown } from "lucide-react";
import { useSession } from "@/lib/SessionContext";

const INITIAL_BATCH_SIZE = 24;
const BATCH_INCREMENT = 24;

export default function VendorsPage() {
  const { ratedVendors } = useSession();
  const [vendors, setVendors] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [vendorType, setVendorType] = useState<"FOOD" | "LIFESTYLE">("FOOD");
  const [isLoading, setIsLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(INITIAL_BATCH_SIZE);
  const isInitialMount = useRef(true);

  const fetchVendors = async (query = search, cat = selectedCategory, type = vendorType) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (query.trim()) params.set("search", query.trim());
      if (cat !== "All") params.set("category", cat);
      params.set("type", type);
      params.set("limit", "160");

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

  // Fetch when category or vendorType changes
  useEffect(() => {
    setVisibleCount(INITIAL_BATCH_SIZE);
    fetchVendors(search, selectedCategory, vendorType);
  }, [selectedCategory, vendorType]);

  // Debounced search (skips on initial mount to avoid duplicate request)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    setVisibleCount(INITIAL_BATCH_SIZE);
    const timer = setTimeout(() => {
      fetchVendors(search, selectedCategory, vendorType);
    }, 200);
    return () => clearTimeout(timer);
  }, [search]);

  // Memoize map of rated scores by attendee
  const ratedMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of ratedVendors) {
      map.set(r.vendorId, r.rating);
    }
    return map;
  }, [ratedVendors]);

  const visibleVendors = useMemo(() => {
    return vendors.slice(0, visibleCount);
  }, [vendors, visibleCount]);

  const handleLoadMore = () => {
    setVisibleCount((prev) => Math.min(prev + BATCH_INCREMENT, vendors.length));
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6 overflow-x-hidden w-full">
      {/* Top Header Area */}
      <div className="space-y-4 pb-4 border-b border-orange-100">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-display font-black tracking-wider uppercase text-orange-600">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Gachibowli Stadium Food Grounds</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-display font-black text-slate-900 tracking-tight mt-0.5">
              Explore 160+ Stalls
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Discover authentic regional flavors across stadium zones.
            </p>
          </div>

          {/* Food vs Lifestyle toggle */}
          <div className="flex items-center gap-1 p-1 bg-white rounded-full border border-orange-200 shadow-2xs">
            <button
              type="button"
              onClick={() => {
                setVendorType("FOOD");
                setSelectedCategory("All");
              }}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-display transition active-press ${
                vendorType === "FOOD"
                  ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-xs font-bold"
                  : "text-slate-600 hover:text-slate-900 font-medium"
              }`}
            >
              <Utensils className="w-3.5 h-3.5 stroke-[2]" />
              <span>Food Stalls ({vendorType === "FOOD" ? vendors.length : "138"})</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setVendorType("LIFESTYLE");
                setSelectedCategory("All");
              }}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-display transition active-press ${
                vendorType === "LIFESTYLE"
                  ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-xs font-bold"
                  : "text-slate-600 hover:text-slate-900 font-medium"
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5 stroke-[2]" />
              <span>Lifestyle</span>
            </button>
          </div>
        </div>

        {/* Search Input - Clean White */}
        <div className="relative w-full rounded-2xl shadow-xs border border-orange-100 bg-white">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search stalls (e.g. Paradise, Shah Ghouse, Biryani, Niloufer)..."
            className="w-full pl-10 pr-9 py-3 rounded-2xl bg-white border-0 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-orange-500/20 transition"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1"
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
                  className={`px-3 py-1 rounded-full text-xs font-display transition active-press ${
                    selectedCategory === cat
                      ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold shadow-xs"
                      : "bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:border-orange-200"
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
              className="bg-white p-5 rounded-3xl border border-slate-100 animate-pulse space-y-3 h-36"
            >
              <div className="h-3 bg-slate-100 rounded w-16" />
              <div className="h-5 bg-slate-100 rounded w-36" />
              <div className="h-3 bg-slate-50 rounded w-full" />
            </div>
          ))}
        </div>
      ) : vendors.length === 0 ? (
        <div className="bg-white rounded-3xl p-10 text-center border border-slate-200 shadow-sm space-y-3">
          <Utensils className="w-10 h-10 mx-auto text-orange-500" />
          <h3 className="font-display font-extrabold text-slate-900 text-base">
            No stalls match your search
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Try searching for another dish (e.g. Biryani, Haleem, Shawarma) or reset the category filter.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearch("");
              setSelectedCategory("All");
            }}
            className="mt-2 px-4 py-2 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-700 text-xs font-display font-bold border border-orange-200 transition active-press"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {visibleVendors.map((vendor) => (
              <VendorCard
                key={vendor.id}
                vendor={vendor}
                userRatedScore={ratedMap.get(vendor.id)}
              />
            ))}
          </div>

          {/* Smooth Pagination / Load More button for 120 FPS Mobile Experience */}
          {visibleCount < vendors.length && (
            <div className="text-center pt-2 pb-6">
              <button
                type="button"
                onClick={handleLoadMore}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-white border border-orange-200 hover:border-orange-300 text-orange-600 font-display font-bold text-xs shadow-xs hover:bg-orange-50/50 transition active-press"
              >
                <span>Show More Stalls ({vendors.length - visibleCount} remaining)</span>
                <ChevronDown className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
