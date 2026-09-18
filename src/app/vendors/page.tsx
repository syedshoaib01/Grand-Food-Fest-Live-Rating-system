"use client";

import React, { useState, useEffect } from "react";
import VendorCard from "@/components/VendorCard";
import { Search, Filter, Utensils, ShoppingBag, X } from "lucide-react";
import { useSession } from "@/lib/SessionContext";
import Link from "next/link";

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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Title & Type Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-fest-border pb-6">
        <div>
          <h1 className="text-3xl font-black text-white">
            Festival <span className="gold-gradient-text">Vendor Directory</span>
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Browse 150+ food & lifestyle stalls at Grand Food Fest Hyderabad 2026.
          </p>
        </div>

        {/* Food vs Lifestyle toggle */}
        <div className="flex items-center gap-1.5 p-1 bg-fest-card rounded-xl border border-fest-border self-start">
          <button
            onClick={() => {
              setVendorType("FOOD");
              setSelectedCategory("All");
            }}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
              vendorType === "FOOD"
                ? "bg-fest-gold text-black shadow"
                : "text-gray-300 hover:text-white"
            }`}
          >
            <Utensils className="w-3.5 h-3.5" />
            Food Vendors (110+)
          </button>
          <button
            onClick={() => {
              setVendorType("LIFESTYLE");
              setSelectedCategory("All");
            }}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
              vendorType === "LIFESTYLE"
                ? "bg-fest-gold text-black shadow"
                : "text-gray-300 hover:text-white"
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            Lifestyle & Crafts (40+)
          </button>
        </div>
      </div>

      {/* Search and Category Filter Bar */}
      <div className="space-y-3">
        {/* Search Input */}
        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search vendor name, stall (e.g. A-01), cuisine..."
            className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-fest-card border border-fest-border text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-fest-gold"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                selectedCategory === cat
                  ? "bg-amber-500 text-black shadow-md shadow-amber-500/20"
                  : "bg-fest-card hover:bg-fest-cardHover border border-fest-border text-gray-300 hover:text-white"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Vendors Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="glass-panel p-5 rounded-2xl border border-fest-border animate-pulse space-y-4 h-48"
            >
              <div className="h-4 bg-gray-800 rounded w-1/3" />
              <div className="h-6 bg-gray-800 rounded w-2/3" />
              <div className="h-3 bg-gray-800/60 rounded w-full" />
            </div>
          ))}
        </div>
      ) : vendors.length === 0 ? (
        <div className="glass-panel rounded-2xl p-12 text-center text-gray-400 space-y-3">
          <Utensils className="w-10 h-10 mx-auto text-amber-500/50" />
          <h3 className="font-bold text-lg text-white">No stalls match your search</h3>
          <p className="text-xs max-w-sm mx-auto">
            Try adjusting your search terms or picking another category.
          </p>
          <button
            onClick={() => {
              setSearch("");
              setSelectedCategory("All");
            }}
            className="px-4 py-2 rounded-xl bg-fest-card hover:bg-fest-cardHover border border-fest-border text-sm font-semibold text-white"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
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
