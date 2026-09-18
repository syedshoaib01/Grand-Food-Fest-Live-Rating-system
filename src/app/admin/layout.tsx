"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Utensils,
  Star,
  AlertTriangle,
  Award,
  Download,
  Settings,
  LogOut,
  ShieldAlert,
  Menu,
  X,
} from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isLoginPage = pathname === "/admin/login";

  useEffect(() => {
    if (isLoginPage) {
      setIsAuthenticated(true);
      return;
    }

    fetch("/api/admin/auth")
      .then((res) => {
        if (!res.ok) {
          setIsAuthenticated(false);
          router.push("/admin/login");
        } else {
          setIsAuthenticated(true);
        }
      })
      .catch(() => {
        setIsAuthenticated(false);
        router.push("/admin/login");
      });
  }, [pathname]);

  const handleLogout = async () => {
    await fetch("/api/admin/auth", { method: "DELETE" });
    router.push("/admin/login");
  };

  if (isLoginPage) {
    return <>{children}</>;
  }

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-fest-dark flex items-center justify-center text-gray-400 text-sm">
        Authenticating Administrator...
      </div>
    );
  }

  const navItems = [
    { href: "/admin", label: "Live Overview", icon: LayoutDashboard },
    { href: "/admin/vendors", label: "Vendor Management", icon: Utensils },
    { href: "/admin/ratings", label: "Ratings Inspector", icon: Star },
    { href: "/admin/anomalies", label: "Anomaly Flags", icon: AlertTriangle },
    { href: "/admin/awards", label: "Awards Center", icon: Award },
    { href: "/admin/exports", label: "Data Exports", icon: Download },
    { href: "/admin/settings", label: "Event Settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-fest-dark flex flex-col md:flex-row">
      {/* Mobile admin header */}
      <div className="md:hidden flex items-center justify-between p-4 bg-fest-card border-b border-fest-border">
        <div className="flex items-center gap-2 font-bold text-white text-sm">
          <ShieldAlert className="w-5 h-5 text-amber-500" />
          <span>FESTIVAL ADMIN</span>
        </div>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-1.5 rounded-lg bg-fest-dark text-gray-300"
        >
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Admin Sidebar */}
      <aside
        className={`w-64 bg-fest-card border-r border-fest-border p-4 flex flex-col justify-between shrink-0 ${
          sidebarOpen ? "block" : "hidden md:flex"
        }`}
      >
        <div className="space-y-6">
          {/* Header */}
          <div className="px-2 pt-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center text-black font-extrabold text-sm">
                GF
              </div>
              <div>
                <h2 className="font-extrabold text-sm text-white leading-none">
                  FESTIVAL ADMIN
                </h2>
                <span className="text-[10px] text-amber-400 font-mono font-semibold">
                  GFF Hyderabad 2026
                </span>
              </div>
            </div>
          </div>

          {/* Nav list */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition ${
                    isActive
                      ? "bg-fest-gold text-black shadow font-bold"
                      : "text-gray-300 hover:text-white hover:bg-fest-cardHover"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-black" : "text-gray-400"}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom actions */}
        <div className="pt-4 border-t border-fest-border space-y-2">
          <Link
            href="/"
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-gray-400 hover:text-white hover:bg-fest-cardHover transition"
          >
            <span>← Public Festival Site</span>
          </Link>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-red-400 hover:bg-red-500/10 transition text-left"
          >
            <LogOut className="w-4 h-4" />
            <span>Log Out Admin</span>
          </button>
        </div>
      </aside>

      {/* Main Admin Content */}
      <main className="flex-1 p-4 sm:p-8 overflow-y-auto">{children}</main>
    </div>
  );
}
