"use client";

import React, { useState, useEffect } from "react";
import { Star, Search, Filter, RefreshCw, CheckCircle2, XCircle, ShieldAlert } from "lucide-react";

export default function AdminRatingsPage() {
  const [ratings, setRatings] = useState<any[]>([]);
  const [searchSession, setSearchSession] = useState("");
  const [filterRating, setFilterRating] = useState<string>("ALL");
  const [filterValid, setFilterValid] = useState<string>("ALL");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const fetchRatings = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", "30");
      if (searchSession) params.set("searchSession", searchSession);
      if (filterRating !== "ALL") params.set("rating", filterRating);
      if (filterValid !== "ALL") params.set("isValid", filterValid);

      const res = await fetch(`/api/admin/ratings?${params.toString()}`);
      const data = await res.json();
      if (res.ok) {
        setRatings(data.ratings || []);
        setTotalPages(data.pagination.totalPages || 1);
        setTotalCount(data.pagination.total || 0);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRatings();
  }, [page, filterRating, filterValid]);

  const toggleRatingValidity = async (ratingId: string, currentValid: boolean) => {
    try {
      const res = await fetch("/api/admin/ratings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ratingId, isValid: !currentValid }),
      });
      if (res.ok) {
        setRatings(
          ratings.map((r) => (r.id === ratingId ? { ...r, isValid: !currentValid } : r))
        );
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-fest-border pb-6">
        <div>
          <h1 className="text-2xl font-black text-white">Ratings Telemetry Inspector</h1>
          <p className="text-xs text-gray-400 mt-1">
            Audit individual rating events across festival days • Total: {totalCount.toLocaleString()} ratings logged
          </p>
        </div>

        <button
          onClick={fetchRatings}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-fest-card hover:bg-fest-cardHover border border-fest-border text-xs font-bold text-gray-300"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh Stream
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={searchSession}
            onChange={(e) => setSearchSession(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchRatings()}
            placeholder="Search Pass (e.g. PASS-000001)..."
            className="px-3 py-2 rounded-xl bg-fest-card border border-fest-border text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-fest-gold"
          />
          <button
            onClick={fetchRatings}
            className="px-3 py-2 rounded-xl bg-fest-card border border-fest-border text-xs font-bold text-gray-300"
          >
            Filter
          </button>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={filterRating}
            onChange={(e) => setFilterRating(e.target.value)}
            className="px-3 py-2 rounded-xl bg-fest-card border border-fest-border text-xs text-gray-300 focus:outline-none"
          >
            <option value="ALL">All Star Scores</option>
            <option value="5">5 Stars Only</option>
            <option value="4">4 Stars</option>
            <option value="3">3 Stars</option>
            <option value="2">2 Stars</option>
            <option value="1">1 Star</option>
          </select>

          <select
            value={filterValid}
            onChange={(e) => setFilterValid(e.target.value)}
            className="px-3 py-2 rounded-xl bg-fest-card border border-fest-border text-xs text-gray-300 focus:outline-none"
          >
            <option value="ALL">All Records</option>
            <option value="true">Valid Only</option>
            <option value="false">Flagged / Invalidated</option>
          </select>
        </div>
      </div>

      {/* Ratings Table */}
      <div className="glass-panel rounded-2xl border border-fest-border overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-300">
            <thead className="bg-fest-dark text-[11px] uppercase tracking-wider text-gray-400 border-b border-fest-border">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Event Day</th>
                <th className="py-3 px-4">Vendor & Stall</th>
                <th className="py-3 px-4 text-center">Score</th>
                <th className="py-3 px-4">Attendee Token</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Audit Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-fest-border/50 font-medium font-mono">
              {ratings.map((r) => (
                <tr
                  key={r.id}
                  className={`hover:bg-fest-cardHover/40 transition ${
                    !r.isValid ? "bg-red-500/[0.04] text-gray-500" : ""
                  }`}
                >
                  <td className="py-3 px-4 font-sans text-gray-400">
                    {new Date(r.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })}
                  </td>
                  <td className="py-3 px-4 font-sans text-gray-300">
                    Day {r.eventDay.dayNumber}
                  </td>
                  <td className="py-3 px-4 font-sans">
                    <span className="font-bold text-white">{r.vendor.name}</span>
                    <span className="text-amber-400 ml-2 font-mono text-[11px]">
                      (Stall {r.vendor.stall})
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="inline-flex items-center gap-1 font-bold text-fest-gold">
                      {r.rating} <Star className="w-3.5 h-3.5 fill-fest-gold" />
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-300">
                    {r.attendee.passToken}{" "}
                    <span className="text-[10px] text-gray-500">
                      ({r.attendee.anonymousHash})
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center font-sans">
                    {r.isValid ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-500/15 text-green-400 border border-green-500/30">
                        Valid
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/15 text-red-400 border border-red-500/30">
                        Invalidated
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right font-sans">
                    <button
                      onClick={() => toggleRatingValidity(r.id, r.isValid)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                        r.isValid
                          ? "bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30"
                          : "bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/30"
                      }`}
                    >
                      {r.isValid ? "Invalidate" : "Restore"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination controls */}
        <div className="p-4 bg-fest-dark/50 border-t border-fest-border flex items-center justify-between text-xs text-gray-400">
          <span>
            Page {page} of {totalPages}
          </span>
          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1.5 rounded-lg bg-fest-card border border-fest-border disabled:opacity-40"
            >
              Previous
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1.5 rounded-lg bg-fest-card border border-fest-border disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
