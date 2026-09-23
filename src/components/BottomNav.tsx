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
      className="md:hidden fixed bottom-0 left-0 right-0 z-bottomNav bg-[#FAF7F2]/95 backdrop-blur-lg border-t border-fest-border shadow-[0_-4px_20px_rgba(26,22,20,0.06)] pb-safe"
    >
      <div className="grid grid-cols-4 h-16 max-w-md mx-auto px-3 items-center">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          if (item.isCenter) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center justify-center -mt-3 relative active:scale-95 transition-transform"
              >
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-stamp transition-all ${
                    isActive
                      ? "bg-gradient-to-tr from-fest-terracotta to-fest-ember text-white ring-4 ring-fest-cream scale-105"
                      : "bg-gradient-to-tr from-fest-terracotta to-fest-turmeric text-white ring-2 ring-fest-cream"
                  }`}
                >
                  <Icon className="w-5 h-5 fill-white/30 stroke-[2.25]" />
                  {item.badge !== null && item.badge !== undefined && (
                    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-fest-charcoal text-white font-display font-extrabold text-[10px] rounded-full flex items-center justify-center leading-none border-2 border-fest-cream shadow-xs">
                      {item.badge}
                    </span>
                  )}
                </div>
                <span className={`text-[10px] tracking-tight mt-1 font-display font-bold ${
                  isActive ? "text-fest-terracotta" : "text-fest-charcoal"
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
              className={`flex flex-col items-center justify-center py-1.5 transition-all active:scale-90 ${
                isActive ? "text-fest-terracotta font-bold" : "text-fest-charcoalMuted hover:text-fest-charcoal"
              }`}
            >
              <div className="relative">
                <Icon
                  className={`w-5 h-5 transition-transform ${
                    isActive ? "text-fest-terracotta scale-110 stroke-[2.5]" : "text-fest-charcoalTertiary stroke-[1.75]"
                  }`}
                />
              </div>
              <span className={`text-[10px] tracking-tight mt-1 font-display ${isActive ? "font-bold text-fest-charcoal" : "font-medium"}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
