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
    <header className="sticky top-0 z-header bg-[#FAF7F2]/90 backdrop-blur-md border-b border-fest-border shadow-subtle h-14">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 h-full">
        <div className="flex items-center justify-between h-full gap-2">
          {/* Brand Logo & Live Pill */}
          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
            <Link href="/" className="flex items-center gap-2 group active-press">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-fest-terracotta to-fest-ember flex items-center justify-center text-white shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                <Flame className="w-4 h-4 fill-white/20" />
              </div>
              <div className="flex flex-col leading-tight">
                <div className="flex items-center gap-1.5">
                  <span className="font-display font-black text-sm tracking-tight text-fest-charcoal">
                    GRAND FOOD FEST
                  </span>
                  <span className="text-[10px] font-extrabold text-fest-terracotta bg-fest-terracottaLight px-1 rounded-sm">
                    '26
                  </span>
                </div>
                <span className="text-[9px] tracking-widest text-fest-charcoalMuted font-semibold uppercase">
                  GACHIBOWLI • HYD
                </span>
              </div>
            </Link>

            {/* Live Indicator */}
            <div className="hidden xs:flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-300/60 shadow-2xs">
              <span className={`w-1.5 h-1.5 rounded-full ${isLive ? "bg-emerald-600 animate-pulse" : "bg-stone-400"}`} />
              <span>
                {isLive ? `Day ${activeDay?.dayNumber || 1} LIVE` : "Festival Closed"}
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
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition active-press ${
                    isActive
                      ? "bg-white text-fest-charcoal shadow-xs border border-fest-border font-bold"
                      : "text-fest-charcoalMuted hover:text-fest-charcoal hover:bg-fest-parchment"
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? "text-fest-terracotta" : "text-fest-charcoalTertiary"}`} />
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
                className="flex items-center gap-2 px-3 py-1 rounded-xl text-xs bg-white text-fest-charcoal border border-fest-saffron/40 shadow-xs hover:border-fest-saffron transition active-press group"
              >
                <div className="flex flex-col text-right leading-none">
                  <span className="font-display font-extrabold text-[11px] text-fest-charcoal">
                    {attendeeName ? attendeeName : passToken?.startsWith("ATT-") ? passToken : passToken ? `ATT-••••-${passToken.slice(-4)}` : "Verified Pass"}
                  </span>
                  <span className="text-[9px] text-fest-terracotta font-bold mt-0.5">
                    {remainingQuota} {remainingQuota === 1 ? "rating" : "ratings"} left
                  </span>
                </div>
                <div className="w-6 h-6 rounded-full bg-fest-saffronLight flex items-center justify-center text-fest-saffron shrink-0 group-hover:scale-105 transition-transform">
                  <Star className="w-3.5 h-3.5 fill-fest-turmeric text-fest-saffron" />
                </div>
              </Link>
            ) : (
              <Link
                href="/vote"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-fest-terracotta to-fest-ember hover:opacity-95 text-white shadow-xs transition active-press"
              >
                <Star className="w-3.5 h-3.5 fill-white/40" />
                <span>Rate Food</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
