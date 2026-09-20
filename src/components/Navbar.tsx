"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "@/lib/SessionContext";
import { Trophy, UtensilsCrossed, Award, Star } from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();
  const { authenticated, passToken, remainingQuota } = useSession();
  const [eventData, setEventData] = useState<any>(null);

  useEffect(() => {
    fetch("/api/event")
      .then((res) => res.json())
      .then((data) => setEventData(data))
      .catch(() => {});
  }, []);

  // Hide standard navbar on kiosk
  if (pathname === "/kiosk") {
    return null;
  }

  const activeDay = eventData?.activeDay;
  const isLive = activeDay?.status === "LIVE" && eventData?.event?.status === "LIVE";

  const navLinks = [
    { href: "/leaderboard", label: "Top 10", icon: Trophy },
    { href: "/vendors", label: "Explore", icon: UtensilsCrossed },
    { href: "/awards", label: "Awards", icon: Award },
  ];

  return (
    <header className="sticky top-0 z-header bg-white/95 backdrop-blur-md border-b border-stone-200/80 shadow-subtle h-14">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
        <div className="flex items-center justify-between h-full gap-2">
          {/* Brand Logo & Live Pill */}
          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-7 h-7 rounded-lg bg-amber-600 flex items-center justify-center text-white shrink-0">
                <UtensilsCrossed className="w-4 h-4" />
              </div>
              <div className="flex flex-col leading-tight">
                <span className="font-bold text-xs sm:text-sm tracking-tight text-stone-950">
                  GRAND FOOD FEST
                </span>
                <span className="text-[9px] tracking-wider text-amber-700 font-semibold uppercase">
                  HYDERABAD 2026
                </span>
              </div>
            </Link>

            {/* Live Indicator */}
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/70">
              <span className={`w-1.5 h-1.5 rounded-full ${isLive ? "bg-emerald-600 animate-pulse" : "bg-stone-400"}`} />
              <span>
                {isLive ? `Day ${activeDay?.dayNumber || 1} LIVE` : "Closed"}
              </span>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                    isActive
                      ? "bg-stone-100 text-stone-950 font-semibold"
                      : "text-stone-600 hover:text-stone-950 hover:bg-stone-50"
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? "text-amber-600" : "text-stone-400"}`} />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right Action / Pass status */}
          <div className="flex items-center gap-2 shrink-0">
            {authenticated ? (
              <Link
                href="/vote"
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs bg-amber-50 text-amber-900 border border-amber-200/70 hover:bg-amber-100/70 transition"
              >
                <div className="flex flex-col text-right leading-none">
                  <span className="font-mono text-[10px] font-bold text-stone-800">
                    {passToken?.startsWith("ATT-")
                      ? passToken
                      : passToken
                      ? `ATT-••••-${passToken.slice(-4)}`
                      : "Verified"}
                  </span>
                  <span className="text-[9px] text-amber-700 font-medium mt-0.5">
                    {remainingQuota} left
                  </span>
                </div>
                <Star className="w-3.5 h-3.5 text-amber-600 fill-amber-500 shrink-0" />
              </Link>
            ) : (
              <Link
                href="/vote"
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white shadow-xs transition active:scale-95"
              >
                <span>Rate Food</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
