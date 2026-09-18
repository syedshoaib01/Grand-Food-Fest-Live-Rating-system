"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "@/lib/SessionContext";
import { ChevronDown, ChevronUp, ShieldCheck } from "lucide-react";

export default function DevBar() {
  const isDevMode = process.env.NEXT_PUBLIC_DEV_MODE === "true";
  if (!isDevMode) {
    return null;
  }

  const { passToken, loginWithPass, ratedCount, refreshSession } = useSession();
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

  const activeDayNumber = eventData?.activeDay?.dayNumber || 1;
  const eventStatus = eventData?.event?.status || "LIVE";

  return (
    <div
      aria-label="Developer Toolbar"
      className="relative z-devTools w-full bg-stone-900 border-b border-stone-800 text-stone-300 font-mono text-xs select-none"
    >
      {/* Compact DevBar Strip (in normal document flow, reserving its own height) */}
      <div className="max-w-7xl mx-auto px-4 py-1.5 flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2 text-[11px]">
          <span className="px-1.5 py-0.5 rounded bg-amber-500 text-stone-950 font-sans font-bold text-[10px] tracking-wider">
            DEV MODE
          </span>
          <span className="hidden sm:inline text-stone-600">|</span>
          <span className="text-stone-300">
            Day {activeDayNumber} ({eventStatus})
          </span>
          <span className="hidden sm:inline text-stone-600">|</span>
          <span className="text-stone-400">
            Pass: <strong className="text-stone-200">{passToken || "None"}</strong> ({ratedCount}/5)
          </span>
        </div>

        <div className="flex items-center gap-2">
          <a
            href="/admin"
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-stone-800 hover:bg-stone-700 text-stone-300 text-[11px] transition"
          >
            <ShieldCheck className="w-3 h-3 text-amber-400" />
            <span>Admin</span>
          </a>
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-stone-800 hover:bg-stone-700 text-amber-400 text-[11px] transition"
          >
            <span>{isOpen ? "Close" : "Controls"}</span>
            {isOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>
      </div>

      {/* Expanded Controls Panel (expands in document flow, pushing header down naturally) */}
      {isOpen && (
        <div className="bg-stone-950 border-t border-stone-800 px-4 py-3 space-y-3">
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-4 text-[11px]">
            {/* Pass Switcher */}
            <div>
              <span className="text-stone-400 block mb-1 font-semibold uppercase tracking-wider text-[10px]">
                Quick Attendee
              </span>
              <div className="flex flex-wrap gap-1">
                {samplePasses.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => handleSelectPass(p)}
                    className={`px-2 py-0.5 rounded text-[11px] transition ${
                      passToken === p
                        ? "bg-amber-500 text-stone-950 font-bold"
                        : "bg-stone-800 hover:bg-stone-700 text-stone-300 border border-stone-700"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Event Day Switcher */}
            <div>
              <span className="text-stone-400 block mb-1 font-semibold uppercase tracking-wider text-[10px]">
                Event Day
              </span>
              <div className="flex gap-1.5">
                {eventData?.days?.map((day: any) => (
                  <button
                    key={day.id}
                    type="button"
                    disabled={isUpdating}
                    onClick={() => handleSwitchDay(day.id)}
                    className={`px-2.5 py-0.5 rounded text-[11px] transition ${
                      day.status === "LIVE"
                        ? "bg-emerald-600 text-white font-bold"
                        : "bg-stone-800 hover:bg-stone-700 text-stone-300 border border-stone-700"
                    }`}
                  >
                    Day {day.dayNumber} {day.status === "LIVE" && "(LIVE)"}
                  </button>
                ))}
              </div>
            </div>

            {/* Event Status Switcher */}
            <div>
              <span className="text-stone-400 block mb-1 font-semibold uppercase tracking-wider text-[10px]">
                Event Status
              </span>
              <div className="flex gap-1.5">
                {["LIVE", "CLOSING", "FINALIZED"].map((s) => (
                  <button
                    key={s}
                    type="button"
                    disabled={isUpdating}
                    onClick={() => handleSwitchStatus(s)}
                    className={`px-2.5 py-0.5 rounded text-[11px] transition ${
                      eventData?.event?.status === s
                        ? "bg-amber-600 text-white font-bold"
                        : "bg-stone-800 hover:bg-stone-700 text-stone-300 border border-stone-700"
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
