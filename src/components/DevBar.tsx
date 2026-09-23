"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "@/lib/SessionContext";
import { ChevronDown, ChevronUp, ShieldCheck, Wrench } from "lucide-react";

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
      await refreshSession();
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
      className="relative z-devTools w-full bg-fest-charcoal border-b border-white/10 text-stone-300 font-mono text-xs select-none"
    >
      <div className="max-w-4xl mx-auto px-4 py-1.5 flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2 text-[11px]">
          <span className="px-1.5 py-0.5 rounded bg-fest-terracotta text-white font-display font-bold text-[10px] tracking-wider uppercase">
            Dev Bar
          </span>
          <span className="text-stone-300 font-medium">
            Day {activeDayNumber} ({eventStatus})
          </span>
          <span className="hidden sm:inline text-stone-500">•</span>
          <span className="text-stone-400">
            Pass: <strong className="text-fest-turmeric">{passToken || "None"}</strong> ({ratedCount}/5)
          </span>
        </div>

        <div className="flex items-center gap-2">
          <a
            href="/admin"
            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 text-[11px] font-sans font-medium transition"
          >
            <ShieldCheck className="w-3 h-3 text-fest-turmeric" />
            <span>Admin</span>
          </a>
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-fest-turmeric text-[11px] font-sans font-semibold transition"
          >
            <Wrench className="w-3 h-3" />
            <span>{isOpen ? "Hide" : "Test Tools"}</span>
            {isOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="bg-[#12100E] border-t border-white/10 px-4 py-3 space-y-3">
          <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-4 text-[11px]">
            {/* Pass Switcher */}
            <div>
              <span className="text-stone-400 block mb-1.5 font-display font-bold uppercase tracking-wider text-[10px]">
                Switch Test Pass
              </span>
              <div className="flex flex-wrap gap-1">
                {samplePasses.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => handleSelectPass(p)}
                    className={`px-2 py-0.5 rounded-md text-[11px] transition ${
                      passToken === p
                        ? "bg-fest-terracotta text-white font-bold"
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
              <span className="text-stone-400 block mb-1.5 font-display font-bold uppercase tracking-wider text-[10px]">
                Festival Day
              </span>
              <div className="flex gap-1.5">
                {eventData?.days?.map((day: any) => (
                  <button
                    key={day.id}
                    type="button"
                    disabled={isUpdating}
                    onClick={() => handleSwitchDay(day.id)}
                    className={`px-2.5 py-0.5 rounded-md text-[11px] transition ${
                      day.status === "LIVE"
                        ? "bg-emerald-600 text-white font-bold"
                        : "bg-stone-800 hover:bg-stone-700 text-stone-300 border border-stone-700"
                    }`}
                  >
                    Day {day.dayNumber} {day.status === "LIVE" && "●"}
                  </button>
                ))}
              </div>
            </div>

            {/* Event Status Switcher */}
            <div>
              <span className="text-stone-400 block mb-1.5 font-display font-bold uppercase tracking-wider text-[10px]">
                Event Status
              </span>
              <div className="flex gap-1.5">
                {["LIVE", "CLOSING", "FINALIZED"].map((s) => (
                  <button
                    key={s}
                    type="button"
                    disabled={isUpdating}
                    onClick={() => handleSwitchStatus(s)}
                    className={`px-2.5 py-0.5 rounded-md text-[11px] transition ${
                      eventData?.event?.status === s
                        ? "bg-fest-saffron text-white font-bold"
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
