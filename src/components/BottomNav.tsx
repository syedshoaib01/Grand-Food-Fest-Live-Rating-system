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
      isPrimary: true,
      badge: authenticated && remainingQuota > 0 ? `${remainingQuota}` : null,
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
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-stone-200 shadow-[0_-4px_12px_rgba(0,0,0,0.04)] pb-safe"
    >
      <div className="grid grid-cols-4 h-16 max-w-lg mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          if (item.isPrimary) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="relative flex flex-col items-center justify-center -top-2"
              >
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center shadow-md transition-transform active:scale-95 ${
                    isActive
                      ? "bg-gradient-to-tr from-amber-600 to-orange-500 text-white shadow-amber-500/30"
                      : "bg-stone-900 text-amber-400 hover:bg-stone-800"
                  }`}
                >
                  <Icon className="w-5 h-5 fill-current" />
                  {item.badge && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-amber-500 text-stone-900 font-bold text-[10px] rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                      {item.badge}
                    </span>
                  )}
                </div>
                <span
                  className={`text-[11px] font-semibold mt-0.5 ${
                    isActive ? "text-amber-700" : "text-stone-700"
                  }`}
                >
                  {item.label}
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center transition-colors active:scale-95 ${
                isActive ? "text-amber-700 font-bold" : "text-stone-500 hover:text-stone-800"
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? "text-amber-600" : "text-stone-400"}`} />
              <span className="text-[11px] font-medium mt-1">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
