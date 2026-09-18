"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, Lock, Mail, ArrowRight, AlertCircle } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const isDevMode = process.env.NEXT_PUBLIC_DEV_MODE === "true";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Authentication failed");
      }

      router.push("/admin");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-stone-850 bg-stone-800 rounded-2xl p-6 sm:p-8 border border-stone-700 shadow-xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto border border-amber-500/30">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white">Organizer Admin Portal</h1>
          <p className="text-xs text-stone-400">
            Grand Food Fest Hyderabad 2026 Management Console
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-950/60 border border-red-800 text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-stone-300 mb-1">
              Admin Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@grandfoodfest.com"
                autoComplete="email"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-stone-900 border border-stone-700 text-sm text-white placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-300 mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                autoComplete="current-password"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-stone-900 border border-stone-700 text-sm text-white placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 rounded-xl font-bold bg-amber-600 hover:bg-amber-500 active:scale-[0.98] text-white text-sm transition shadow flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <span>{isLoading ? "Signing In..." : "Log In to Console"}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Development helper ONLY */}
        {isDevMode && (
          <div className="pt-3 border-t border-stone-700 text-center text-xs text-stone-500">
            <p className="font-mono text-stone-400 text-[11px]">
              Dev Mode Credentials: <span className="text-amber-400">admin@grandfoodfest.com</span> / <span className="text-amber-400">admin123</span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
