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

  // Lock body scroll and listen for Escape key when mobile drawer is open
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = "hidden";
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") setSidebarOpen(false);
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => {
        document.body.style.overflow = "";
        window.removeEventListener("keydown", handleKeyDown);
      };
    } else {
      document.body.style.overflow = "";
    }
  }, [sidebarOpen]);

  const handleLogout = async () => {
    await fetch("/api/admin/auth", { method: "DELETE" });
    router.push("/admin/login");
  };

  if (isLoginPage) {
    return <>{children}</>;
  }

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-[#121110] flex items-center justify-center text-stone-400 text-xs">
        Authenticating Administrator...
      </div>
    );
  }

  const navItems = [
    { href: "/admin", label: "Overview", icon: LayoutDashboard },
    { href: "/admin/vendors", label: "Vendors", icon: Utensils },
    { href: "/admin/ratings", label: "Ratings", icon: Star },
    { href: "/admin/anomalies", label: "Anomalies", icon: AlertTriangle },
    { href: "/admin/awards", label: "Awards", icon: Award },
    { href: "/admin/exports", label: "Exports", icon: Download },
    { href: "/admin/settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-[#121110] flex flex-col md:flex-row text-stone-100">
      {/* Mobile Top App Bar */}
      <header className="md:hidden flex items-center justify-between px-4 py-3 bg-[#1C1917] border-b border-stone-800 sticky top-0 z-header">
        <div className="flex items-center gap-2 font-bold text-white text-xs tracking-wider">
          <ShieldAlert className="w-4 h-4 text-amber-500" />
          <span>FESTIVAL ADMIN</span>
        </div>
        <button
          type="button"
          onClick={() => setSidebarOpen(true)}
          className="p-1.5 rounded-lg bg-stone-800 text-stone-300 hover:text-white transition active:scale-95"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>
      </header>

      {/* Mobile Backdrop Overlay */}
      {sidebarOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/80 backdrop-blur-xs z-backdrop transition-opacity"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Solid Opaque Drawer on Mobile (z-drawer: 60) / Persistent Sidebar on Desktop */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-drawer w-[85%] max-w-xs bg-[#1C1917] border-r border-stone-800 p-4 flex flex-col justify-between shadow-2xl transition-transform duration-200 ease-in-out pb-safe
          md:static md:translate-x-0 md:w-64 md:flex md:z-0 md:shadow-none shrink-0
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}
      >
        <div className="space-y-6">
          {/* Drawer Header */}
          <div className="flex items-center justify-between pb-2 border-b border-stone-800">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-500 flex items-center justify-center text-stone-950 font-bold text-xs">
                GF
              </div>
              <div>
                <h2 className="font-bold text-xs text-white leading-tight">
                  Festival Admin
                </h2>
                <span className="text-[10px] text-amber-400 font-mono">
                  GFF Hyderabad 2026
                </span>
              </div>
            </div>

            {/* Mobile close button */}
            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              className="md:hidden p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition"
              aria-label="Close menu"
            >
              <X className="w-4 h-4" />
            </button>
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
                      ? "bg-amber-500 text-stone-950 font-bold"
                      : "text-stone-300 hover:text-white hover:bg-stone-800"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-stone-950" : "text-stone-400"}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom actions */}
        <div className="pt-4 border-t border-stone-800 space-y-1.5">
          <Link
            href="/"
            onClick={() => setSidebarOpen(false)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-stone-400 hover:text-white hover:bg-stone-800 transition"
          >
            <span>← Public Festival</span>
          </Link>

          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-red-400 hover:text-red-300 hover:bg-stone-800 transition"
          >
            <LogOut className="w-4 h-4" />
            <span>Log out</span>
          </button>
        </div>
      </aside>

      {/* Main admin content area */}
      <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 overflow-y-auto z-content">
        {children}
      </main>
    </div>
  );
}
