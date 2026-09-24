"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "@/lib/SessionContext";
import { Trophy, UtensilsCrossed, Award, Star, Flame } from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();
  const { authenticated, passToken, attendeeName, remainingQuota } = useSession();
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
    { href: "/vendors", label: "Explore Stalls", icon: UtensilsCrossed },
    { href: "/awards", label: "Festival Awards", icon: Award },
  ];

  return (
    <header className="sticky top-0 z-header bg-white/95 backdrop-blur-md border-b border-orange-100 shadow-xs h-14">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 h-full">
        <div className="flex items-center justify-between h-full gap-2">
          {/* Brand Logo & Live Pill */}
          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
            <Link href="/" className="flex items-center gap-2.5 group active-press">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center text-white shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                {/* Professional Fine Dining Cloche Symbol */}
                <svg
                  viewBox="0 0 24 24"
                  className="w-4 h-4 text-white"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M3 18h18" />
                  <path d="M4 18c0-5 3.6-9 8-9s8 4 8 9" />
                  <path d="M12 9V5" />
                  <path d="M10 5h4" />
                </svg>
              </div>
              <div className="flex flex-col leading-tight">
                <div className="flex items-center gap-1.5">
                  <span className="font-display font-extrabold text-xs tracking-tight text-slate-900">
                    GRAND FOOD FEST
                  </span>
                  <span className="text-[9px] font-bold text-orange-600 tracking-wider">
                    2026
                  </span>
                </div>
                <span className="text-[9px] tracking-widest text-slate-500 font-medium uppercase">
                  GACHIBOWLI • HYD
                </span>
              </div>
            </Link>

            {/* Live Indicator - Professional & Minimalist */}
            <div className="hidden xs:flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className={`w-1.5 h-1.5 rounded-full ${isLive ? "bg-emerald-500 animate-pulse shadow-[0_0_6px_#10B981]" : "bg-slate-400"}`} />
              <span>
                {isLive ? `Day ${activeDay?.dayNumber || 1} Live` : "Closed"}
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
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs transition active-press ${
                    isActive
                      ? "bg-orange-50 text-orange-600 font-bold border border-orange-200 shadow-2xs"
                      : "text-slate-600 hover:text-orange-600 hover:bg-orange-50/50 font-medium"
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 stroke-[2] ${isActive ? "text-orange-600" : "text-slate-500"}`} />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right Action / Pass status - Minimalist Button Layout */}
          <div className="flex items-center gap-2 shrink-0">
            {authenticated ? (
              <Link
                href="/vote"
                className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs bg-orange-50 text-slate-900 border border-orange-200 hover:border-orange-300 transition active-press group shadow-2xs"
              >
                <div className="flex flex-col text-right leading-none">
                  <span className="font-display font-bold text-[11px] text-slate-900">
                    {attendeeName ? attendeeName : passToken?.startsWith("ATT-") ? passToken : passToken ? `ATT-••••-${passToken.slice(-4)}` : "Verified Pass"}
                  </span>
                  <span className="text-[9px] text-orange-600 font-bold mt-0.5">
                    {remainingQuota} {remainingQuota === 1 ? "stamp" : "stamps"} left
                  </span>
                </div>
                <div className="w-5 h-5 rounded-full bg-orange-500 text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-2xs">
                  <Star className="w-3 h-3 stroke-[2] fill-white" />
                </div>
              </Link>
            ) : (
              <Link
                href="/vote"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-xs hover:opacity-95 transition active-press"
              >
                <Star className="w-3 h-3 stroke-[2.2]" />
                <span>Rate Food</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
