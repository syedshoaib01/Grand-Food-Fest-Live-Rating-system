"use client";

import React, { useState, useEffect } from "react";
import { Settings, Calendar, ShieldCheck, CheckCircle2, Lock, Sparkles } from "lucide-react";

export default function AdminSettingsPage() {
  const [event, setEvent] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeDayId, setActiveDayId] = useState("");
  const [eventStatus, setEventStatus] = useState("LIVE");
  const [minRatings, setMinRatings] = useState(20);
  const [dailyLimit, setDailyLimit] = useState(5);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/settings");
      const data = await res.json();
      if (res.ok && data.event) {
        setEvent(data.event);
        setEventStatus(data.event.status);
        setMinRatings(data.event.minimumRatingsForLeaderboard);
        setDailyLimit(data.event.ratingLimitPerAttendeePerDay);

        const liveDay = data.event.days.find((d: any) => d.status === "LIVE");
        if (liveDay) setActiveDayId(liveDay.id);
        else if (data.event.days[0]) setActiveDayId(data.event.days[0].id);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveMessage(null);

    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventStatus,
          activeDayId,
          minimumRatingsForLeaderboard: minRatings,
          ratingLimitPerAttendeePerDay: dailyLimit,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setSaveMessage("Festival configuration updated successfully.");
        fetchSettings();
      }
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 bg-gray-800 rounded w-48" />
        <div className="h-64 bg-gray-800 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div className="border-b border-fest-border pb-6">
        <h1 className="text-2xl font-black text-white">Festival Configuration & Controls</h1>
        <p className="text-xs text-gray-400 mt-1">
          Manage event days, active voting state, freeze/finalize leaderboard, and rating limits.
        </p>
      </div>

      {saveMessage && (
        <div className="p-4 rounded-2xl bg-green-500/10 border border-green-500/30 text-green-400 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{saveMessage}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="glass-panel p-6 sm:p-8 rounded-3xl border border-fest-border space-y-6 shadow-xl text-xs">
        {/* Event Day Control */}
        <div className="space-y-3">
          <label className="text-sm font-bold text-white flex items-center gap-2">
            <Calendar className="w-4 h-4 text-fest-gold" />
            <span>Active Festival Day (Voting Target)</span>
          </label>
          <p className="text-gray-400">
            Select which event day is currently LIVE. Attendee sessions and daily 5-vendor rating limits are partitioned per event day.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {event?.days?.map((day: any) => {
              const isSelected = activeDayId === day.id;
              const dateStr = new Date(day.date).toLocaleDateString([], {
                month: "short",
                day: "numeric",
              });

              return (
                <button
                  key={day.id}
                  type="button"
                  onClick={() => setActiveDayId(day.id)}
                  className={`p-4 rounded-2xl border text-left transition ${
                    isSelected
                      ? "bg-amber-500 text-black border-amber-400 font-bold shadow-lg"
                      : "bg-fest-dark border-fest-border text-gray-300 hover:bg-fest-card"
                  }`}
                >
                  <div className="font-extrabold text-sm">Day {day.dayNumber}</div>
                  <div className={`text-xs mt-0.5 ${isSelected ? "text-black/80" : "text-gray-400"}`}>
                    {dateStr}, 2026
                  </div>
                  <span
                    className={`inline-block mt-2 px-2 py-0.5 rounded text-[10px] uppercase tracking-wider font-bold ${
                      day.status === "LIVE" ? "bg-green-600 text-white" : "bg-gray-800 text-gray-400"
                    }`}
                  >
                    {day.status}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Festival Lifecycle & Leaderboard Freeze */}
        <div className="space-y-3 pt-4 border-t border-fest-border">
          <label className="text-sm font-bold text-white flex items-center gap-2">
            <Lock className="w-4 h-4 text-fest-gold" />
            <span>Festival Status & Finalization</span>
          </label>
          <p className="text-gray-400">
            Control the overall state of the live voting platform:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { id: "LIVE", label: "LIVE", desc: "Voting is active. Real-time updates flowing." },
              { id: "CLOSING", label: "CLOSING", desc: "Voting winding down. Final votes being tallied." },
              { id: "FINALIZED", label: "FINALIZED", desc: "Results frozen. Awards ready for announcement." },
            ].map((st) => (
              <button
                key={st.id}
                type="button"
                onClick={() => setEventStatus(st.id)}
                className={`p-4 rounded-2xl border text-left transition ${
                  eventStatus === st.id
                    ? "bg-amber-500 text-black border-amber-400 font-bold shadow-lg"
                    : "bg-fest-dark border-fest-border text-gray-300 hover:bg-fest-card"
                }`}
              >
                <div className="font-extrabold text-sm">{st.label}</div>
                <div className={`text-xs mt-1 ${eventStatus === st.id ? "text-black/80" : "text-gray-400"}`}>
                  {st.desc}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Leaderboard & Scoring Thresholds */}
        <div className="space-y-4 pt-4 border-t border-fest-border">
          <label className="text-sm font-bold text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-fest-gold" />
            <span>Leaderboard Algorithm Parameters</span>
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-300 font-semibold mb-1">
                Minimum Ratings for Official Top 10 ($m$ weight)
              </label>
              <input
                type="number"
                min={1}
                max={100}
                value={minRatings}
                onChange={(e) => setMinRatings(parseInt(e.target.value, 10))}
                className="w-full px-3 py-2 rounded-xl bg-fest-dark border border-fest-border text-white text-sm font-bold"
              />
              <span className="text-[11px] text-gray-500 mt-0.5 block">
                Vendors with fewer votes will not qualify for official Top 10.
              </span>
            </div>

            <div>
              <label className="block text-gray-300 font-semibold mb-1">
                Max Food Vendors Rated Per Attendee Per Day
              </label>
              <input
                type="number"
                min={1}
                max={20}
                value={dailyLimit}
                onChange={(e) => setDailyLimit(parseInt(e.target.value, 10))}
                className="w-full px-3 py-2 rounded-xl bg-fest-dark border border-fest-border text-white text-sm font-bold"
              />
              <span className="text-[11px] text-gray-500 mt-0.5 block">
                Default: 5 food stalls per person per festival day.
              </span>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-fest-border flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-black font-extrabold text-sm shadow-lg shadow-amber-500/25 hover:scale-[1.02] transition"
          >
            {isSaving ? "Saving..." : "Save Festival Settings"}
          </button>
        </div>
      </form>
    </div>
  );
}
