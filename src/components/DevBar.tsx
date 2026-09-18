"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "@/lib/SessionContext";
import { Sparkles, Calendar, Key, ShieldCheck, ChevronDown, ChevronUp } from "lucide-react";

export default function DevBar() {
  const { passToken, loginWithPass, authenticated, remainingQuota, ratedCount, refreshSession } =
    useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [eventData, setEventData] = useState<any>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchEvent = async () => {
    try {
      const res = await fetch("/api/event");
      const data = await res.json();
      if (res.ok) setEventData(data);
    } catch {}
  };

  useEffect(() => {
    fetchEvent();
  }, []);

  const handleSelectPass = async (token: string) => {
    await loginWithPass(token);
  };

  const handleSwitchDay = async (dayId: string) => {
    setIsUpdating(true);
    try {
      await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activeDayId: dayId }),
      });
      await fetchEvent();
      await refreshSession();
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSwitchStatus = async (status: string) => {
    setIsUpdating(true);
    try {
      await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventStatus: status }),
      });
      await fetchEvent();
    } finally {
      setIsUpdating(false);
    }
  };

  const samplePasses = [
    "PASS-000001",
    "PASS-000002",
    "PASS-000003",
    "PASS-000004",
    "PASS-000005",
    "PASS-000010",
  ];

  return (
    <div className="bg-fest-card border-b border-fest-border text-xs z-50 sticky top-0">
      <div className="max-w-7xl mx-auto px-4 py-1.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 font-semibold text-fest-gold">
            <Sparkles className="w-3.5 h-3.5" />
            DEV MODE
          </span>
          <span className="hidden sm:inline text-gray-400">|</span>
          <span className="hidden sm:inline text-gray-300">
            Active: <strong className="text-white">{eventData?.activeDay ? `Day ${eventData.activeDay.dayNumber} (Oct ${8 + eventData.activeDay.dayNumber})` : "Day 1"}</strong>
          </span>
          <span className="hidden md:inline text-gray-400">|</span>
          <span className="hidden md:inline text-gray-300">
            Pass: <strong className="text-white">{passToken || "None"}</strong> ({ratedCount}/5 rated)
          </span>
        </div>

        <div className="flex items-center gap-2">
          <a
            href="/admin"
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-fest-border hover:bg-fest-cardHover text-gray-200 transition"
          >
            <ShieldCheck className="w-3 h-3 text-fest-gold" />
            Admin
          </a>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/10 hover:bg-amber-500/20 text-fest-gold transition"
          >
            Switchers
            {isOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="bg-fest-dark/95 border-t border-fest-border px-4 py-3 space-y-3">
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Pass Switcher */}
            <div>
              <label className="text-gray-400 block mb-1 font-medium flex items-center gap-1">
                <Key className="w-3 h-3 text-fest-gold" />
                Quick Attendee Pass
              </label>
              <div className="flex flex-wrap gap-1.5">
                {samplePasses.map((p) => (
                  <button
                    key={p}
                    onClick={() => handleSelectPass(p)}
                    className={`px-2 py-1 rounded text-xs transition ${
                      passToken === p
                        ? "bg-fest-gold text-black font-bold"
                        : "bg-fest-card hover:bg-fest-cardHover text-gray-300 border border-fest-border"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Event Day Switcher */}
            <div>
              <label className="text-gray-400 block mb-1 font-medium flex items-center gap-1">
                <Calendar className="w-3 h-3 text-fest-gold" />
                Active Event Day
              </label>
              <div className="flex gap-1.5">
                {eventData?.days?.map((day: any) => (
                  <button
                    key={day.id}
                    disabled={isUpdating}
                    onClick={() => handleSwitchDay(day.id)}
                    className={`px-2.5 py-1 rounded text-xs font-medium transition ${
                      day.status === "LIVE"
                        ? "bg-green-600 text-white shadow-sm"
                        : "bg-fest-card hover:bg-fest-cardHover text-gray-300 border border-fest-border"
                    }`}
                  >
                    Day {day.dayNumber} {day.status === "LIVE" && "(LIVE)"}
                  </button>
                ))}
              </div>
            </div>

            {/* Event Status Switcher */}
            <div>
              <label className="text-gray-400 block mb-1 font-medium">Festival Status</label>
              <div className="flex gap-1.5">
                {["LIVE", "CLOSING", "FINALIZED"].map((s) => (
                  <button
                    key={s}
                    disabled={isUpdating}
                    onClick={() => handleSwitchStatus(s)}
                    className={`px-2.5 py-1 rounded text-xs font-medium transition ${
                      eventData?.event?.status === s
                        ? "bg-amber-600 text-white"
                        : "bg-fest-card hover:bg-fest-cardHover text-gray-300 border border-fest-border"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
