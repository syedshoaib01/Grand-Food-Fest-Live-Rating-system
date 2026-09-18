"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "@/lib/SessionContext";
import { Flame, Trophy, UtensilsCrossed, Award, Monitor, Ticket, CheckCircle2, Menu, X } from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();
  const { authenticated, passToken, remainingQuota, ratedCount } = useSession();
  const [eventData, setEventData] = useState<any>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    fetch("/api/event")
      .then((res) => res.json())
      .then((data) => setEventData(data))
      .catch(() => {});
  }, []);

  const isKiosk = pathname === "/kiosk";
  if (isKiosk) {
    // Hide standard navbar in kiosk mode for immersive touch interface
    return null;
  }

  const activeDay = eventData?.activeDay;
  const isLive = activeDay?.status === "LIVE" && eventData?.event?.status === "LIVE";

  const navLinks = [
    { href: "/leaderboard", label: "Top 10 Live", icon: Trophy },
    { href: "/vendors", label: "All Vendors", icon: UtensilsCrossed },
    { href: "/awards", label: "Awards", icon: Award },
    { href: "/kiosk", label: "Kiosk", icon: Monitor },
  ];

  return (
    <header className="glass-header sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Live status */}
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/20 group-hover:scale-105 transition">
                <UtensilsCrossed className="w-5 h-5 text-black font-bold" />
              </div>
              <div>
                <div className="font-extrabold text-base sm:text-lg tracking-tight flex items-center gap-1.5 text-white">
                  <span>GRAND FOOD FEST</span>
                </div>
                <div className="text-[10px] tracking-widest text-amber-400 font-semibold uppercase">
                  HYDERABAD 2026
                </div>
              </div>
            </Link>

            {/* Live Event Status Badge */}
            <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-fest-card border border-fest-border">
              <span className={`w-2 h-2 rounded-full ${isLive ? "bg-green-500 live-pulse" : "bg-gray-500"}`} />
              <span className={isLive ? "text-green-400" : "text-gray-400"}>
                {isLive ? `Day ${activeDay?.dayNumber || 1} LIVE` : "Voting Closed"}
              </span>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                    isActive
                      ? "bg-fest-cardHover text-fest-gold font-semibold shadow-inner"
                      : "text-gray-300 hover:text-white hover:bg-fest-card"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-fest-gold" : "text-gray-400"}`} />
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Attendee Actions & CTA */}
          <div className="hidden sm:flex items-center gap-3">
            {authenticated ? (
              <div className="flex items-center gap-2">
                <div className="flex flex-col items-end">
                  <div className="flex items-center gap-1 text-xs font-mono font-semibold text-gray-200">
                    <Ticket className="w-3.5 h-3.5 text-fest-gold" />
                    <span>{passToken}</span>
                  </div>
                  <span className="text-[10px] text-amber-400 font-medium">
                    {remainingQuota} of 5 votes left today
                  </span>
                </div>
                <Link
                  href="/vote"
                  className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black shadow-md shadow-amber-500/20 transition transform active:scale-95"
                >
                  Rate Food
                </Link>
              </div>
            ) : (
              <Link
                href="/vote"
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black shadow-md shadow-amber-500/25 transition transform active:scale-95"
              >
                <Ticket className="w-4 h-4" />
                <span>Rate Vendors</span>
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden items-center gap-2">
            <Link
              href="/vote"
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-fest-gold text-black"
            >
              Rate
            </Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg bg-fest-card border border-fest-border text-gray-300 hover:text-white"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-fest-card border-b border-fest-border px-4 pt-2 pb-4 space-y-2">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium ${
                  isActive ? "bg-fest-cardHover text-fest-gold font-semibold" : "text-gray-300"
                }`}
              >
                <Icon className="w-4 h-4 text-fest-gold" />
                {link.label}
              </Link>
            );
          })}
          <div className="pt-2 border-t border-fest-border">
            <Link
              href="/vote"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold bg-gradient-to-r from-amber-500 to-orange-500 text-black text-sm"
            >
              <Ticket className="w-4 h-4" />
              {authenticated ? `Continue Voting (${passToken})` : "Enter Pass to Vote"}
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
