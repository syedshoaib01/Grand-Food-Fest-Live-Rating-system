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
      <div className="bg-white/95 rounded-full p-1.5 shadow-[0_12px_36px_rgba(234,88,12,0.18),0_2px_8px_rgba(0,0,0,0.06)] border border-orange-200/90 backdrop-blur-md grid grid-cols-4 items-center">
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
                      ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-[0_4px_16px_rgba(249,115,22,0.4)] scale-105"
                      : "bg-orange-50 text-orange-600 hover:bg-orange-100 border border-orange-200"
                  }`}
                >
                  <Icon className="w-4 h-4 stroke-[2.2]" />
                  {item.badge !== null && item.badge !== undefined && (
                    <span className="absolute -top-1 -right-0.5 min-w-[16px] h-[16px] px-1 bg-orange-600 text-white font-mono font-bold text-[9px] rounded-full flex items-center justify-center leading-none border border-white shadow-2xs">
                      {item.badge}
                    </span>
                  )}
                </div>
                <span className={`text-[10px] tracking-tight mt-1 font-display transition-colors ${
                  isActive ? "text-orange-600 font-bold" : "text-slate-600 font-medium"
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
                isActive ? "text-orange-600" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <div className="relative">
                <Icon
                  className={`w-5 h-5 transition-transform ${
                    isActive ? "text-orange-600 scale-110 stroke-[2.2]" : "text-slate-500 stroke-[1.75]"
                  }`}
                />
              </div>
              <span className={`text-[10px] tracking-tight mt-1 font-display transition-colors ${
                isActive ? "font-bold text-orange-600" : "font-medium text-slate-500"
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
