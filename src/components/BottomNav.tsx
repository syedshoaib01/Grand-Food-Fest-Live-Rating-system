"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Trophy, UtensilsCrossed, Award, Star } from "lucide-react";
import { useSession } from "@/lib/SessionContext";

export default function BottomNav() {
  const pathname = usePathname();
  const { authenticated, remainingQuota } = useSession();

  // Hide on kiosk and admin surfaces
  if (pathname === "/kiosk" || pathname?.startsWith("/admin")) {
    return null;
  }

  const navItems = [
    {
      href: "/leaderboard",
      label: "Top 10",
      icon: Trophy,
    },
    {
      href: "/vendors",
      label: "Explore",
      icon: UtensilsCrossed,
    },
    {
      href: "/vote",
      label: "Rate Food",
      icon: Star,
      isCenter: true,
      badge: authenticated && remainingQuota > 0 ? remainingQuota : null,
    },
    {
      href: "/awards",
      label: "Awards",
      icon: Award,
    },
  ];

  return (
    <nav
      aria-label="Mobile Navigation"
      className="md:hidden fixed bottom-3 inset-x-3 max-w-sm mx-auto z-bottomNav"
    >
      <div className="glass-panel rounded-full p-1.5 shadow-[0_16px_40px_rgba(0,0,0,0.7),0_0_20px_rgba(245,158,11,0.06)] border border-white/12 backdrop-blur-2xl grid grid-cols-4 items-center">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          if (item.isCenter) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center justify-center relative active:scale-95 transition-transform"
              >
                <div
                  className={`w-11 h-11 rounded-full flex items-center justify-center transition-all ${
                    isActive
                      ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-[0_0_20px_rgba(245,158,11,0.5)] scale-105"
                      : "bg-white/10 text-white hover:bg-white/15 border border-white/10"
                  }`}
                >
                  <Icon className="w-4 h-4 stroke-[2.2]" />
                  {item.badge !== null && item.badge !== undefined && (
                    <span className="absolute -top-1 -right-0.5 min-w-[16px] h-[16px] px-1 bg-fest-terracotta text-white font-mono font-bold text-[9px] rounded-full flex items-center justify-center leading-none border border-slate-900 shadow-xs">
                      {item.badge}
                    </span>
                  )}
                </div>
                <span className={`text-[10px] tracking-tight mt-1 font-display transition-colors ${
                  isActive ? "text-amber-400 font-bold" : "text-slate-400 font-medium"
                }`}>
                  {item.label}
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center py-1.5 rounded-full transition-all active:scale-90 ${
                isActive ? "text-amber-400" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <div className="relative">
                <Icon
                  className={`w-5 h-5 transition-transform ${
                    isActive ? "text-amber-400 scale-110 stroke-[2.2] drop-shadow-[0_0_8px_rgba(245,158,11,0.4)]" : "text-slate-400 stroke-[1.75]"
                  }`}
                />
              </div>
              <span className={`text-[10px] tracking-tight mt-1 font-display transition-colors ${
                isActive ? "font-bold text-amber-400" : "font-medium text-slate-400"
              }`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
