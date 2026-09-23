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
    <header className="sticky top-0 z-header bg-slate-950/75 backdrop-blur-xl border-b border-white/8 h-14">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 h-full">
        <div className="flex items-center justify-between h-full gap-2">
          {/* Brand Logo & Live Pill */}
          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
            <Link href="/" className="flex items-center gap-2.5 group active-press">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500/20 to-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                {/* Professional Fine Dining Cloche Symbol */}
                <svg
                  viewBox="0 0 24 24"
                  className="w-4 h-4 text-amber-400"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
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
                  <span className="font-display font-extrabold text-xs tracking-tight text-white">
                    GRAND FOOD FEST
                  </span>
                  <span className="text-[9px] font-medium text-amber-400/80 tracking-wider">
                    2026
                  </span>
                </div>
                <span className="text-[9px] tracking-widest text-slate-400 font-medium uppercase">
                  GACHIBOWLI • HYD
                </span>
              </div>
            </Link>

            {/* Live Indicator - Professional & Minimalist */}
            <div className="hidden xs:flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <span className={`w-1.5 h-1.5 rounded-full ${isLive ? "bg-emerald-400 animate-pulse shadow-[0_0_6px_#10B981]" : "bg-slate-500"}`} />
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
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition active-press ${
                    isActive
                      ? "bg-white/10 text-white font-semibold border border-white/10"
                      : "text-slate-400 hover:text-white hover:bg-white/5 font-normal"
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 stroke-[1.75] ${isActive ? "text-amber-400" : "text-slate-400"}`} />
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
                className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs bg-white/5 text-white border border-white/10 hover:border-white/25 transition active-press group"
              >
                <div className="flex flex-col text-right leading-none">
                  <span className="font-display font-bold text-[11px] text-white">
                    {attendeeName ? attendeeName : passToken?.startsWith("ATT-") ? passToken : passToken ? `ATT-••••-${passToken.slice(-4)}` : "Verified Pass"}
                  </span>
                  <span className="text-[9px] text-amber-400 font-medium mt-0.5">
                    {remainingQuota} {remainingQuota === 1 ? "vote" : "votes"} left
                  </span>
                </div>
                <div className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 group-hover:bg-amber-500/30 transition-colors">
                  <Star className="w-3 h-3 stroke-[2] fill-amber-400" />
                </div>
              </Link>
            ) : (
              <Link
                href="/vote"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-xs hover:opacity-95 transition active-press"
              >
                <Star className="w-3 h-3 stroke-[2]" />
                <span>Rate Food</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
