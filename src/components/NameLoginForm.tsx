"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/SessionContext";
import { Utensils, ArrowRight, Sparkles, AlertCircle } from "lucide-react";

interface NameLoginFormProps {
  onSuccess?: () => void;
  redirectTo?: string;
  title?: string;
  subtitle?: string;
}

export default function NameLoginForm({
  onSuccess,
  redirectTo,
  title = "Grand Food Fest 2026",
  subtitle = "Enter your name to explore 160+ stadium stalls and score live tastings across Gachibowli.",
}: NameLoginFormProps) {
  const router = useRouter();
  const { loginWithName } = useSession();
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Please enter your name to continue.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const result = await loginWithName(trimmed);
    setIsSubmitting(false);

    if (result.success) {
      if (onSuccess) {
        onSuccess();
      }
      if (redirectTo) {
        router.push(redirectTo);
      }
    } else {
      setError(result.error || "Could not log in. Please try again.");
    }
  };

  return (
    <div className="w-full max-w-md mx-auto px-4 py-8 sm:py-16">
      <div className="bg-white p-7 sm:p-8 rounded-3xl border border-orange-100 shadow-xl shadow-orange-500/5 space-y-6 relative overflow-hidden">
        {/* Subtle orange accent orb */}
        <div className="absolute -top-12 -right-12 w-40 h-40 bg-orange-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Festival Brand Header */}
        <div className="text-center space-y-3 relative z-10">
          <div className="w-12 h-12 rounded-2xl bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-500 mx-auto shadow-xs">
            <svg
              viewBox="0 0 24 24"
              className="w-6 h-6 text-orange-500"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 18h18" />
              <path d="M4 18c0-5 3.6-9 8-9s8 4 8 9" />
              <path d="M12 9V5" />
              <path d="M10 5h4" />
            </svg>
          </div>

          <div>
            <h1 className="text-xl sm:text-2xl font-display font-black text-slate-900 tracking-tight">
              Grand Food Fest 2026
            </h1>
            <p className="text-xs text-slate-500 max-w-xs mx-auto mt-1 leading-relaxed">
              Enter your name to explore 160+ stadium stalls and score live tastings across Gachibowli.
            </p>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 stroke-[1.75]" />
            <span className="font-medium">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
          <div>
            <label
              htmlFor="attendeeNameInput"
              className="block text-xs font-display font-bold uppercase tracking-wider text-slate-700 mb-2"
            >
              Your Name
            </label>
            <div className="relative">
              <input
                id="attendeeNameInput"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name (e.g. Alex, Ruwaiz)..."
                autoFocus
                autoComplete="name"
                disabled={isSubmitting}
                className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm font-sans text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-orange-500 focus:bg-white transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !name.trim()}
            className="w-full h-12 rounded-xl font-display font-bold text-xs tracking-wide bg-gradient-to-r from-orange-500 to-amber-500 hover:opacity-95 active:scale-[0.98] text-white transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-orange-500/20"
          >
            <span>{isSubmitting ? "Entering Festival..." : "Continue to Festival"}</span>
            <ArrowRight className="w-4 h-4 stroke-[1.75]" />
          </button>
        </form>

        <div className="pt-3 border-t border-slate-100 text-center text-[11px] text-slate-400 flex items-center justify-center gap-2">
          <span>Gachibowli Stadium, Hyderabad • Live Attendee Voting</span>
        </div>
      </div>
    </div>
  );
}
