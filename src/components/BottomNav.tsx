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
      label: "Rate",
      icon: Star,
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
      className="md:hidden fixed bottom-0 left-0 right-0 z-bottomNav bg-white/95 backdrop-blur-md border-t border-stone-200/80 shadow-[0_-2px_10px_rgba(0,0,0,0.03)] pb-safe"
    >
      <div className="grid grid-cols-4 h-14 max-w-md mx-auto px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center py-1 transition-colors active:scale-95 relative ${
                isActive ? "text-amber-700 font-semibold" : "text-stone-400 hover:text-stone-700"
              }`}
            >
              <div className="relative">
                <Icon
                  className={`w-5 h-5 transition-transform ${
                    isActive ? "text-amber-600 scale-105 stroke-[2.25]" : "text-stone-400 stroke-[1.75]"
                  }`}
                />
                {item.badge !== null && item.badge !== undefined && (
                  <span className="absolute -top-1 -right-2 min-w-[15px] h-[15px] px-1 bg-amber-600 text-white font-bold text-[9px] rounded-full flex items-center justify-center leading-none shadow-xs">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className={`text-[10px] tracking-tight mt-1 ${isActive ? "text-stone-900 font-semibold" : "text-stone-500 font-medium"}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
