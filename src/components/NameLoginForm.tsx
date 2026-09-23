"use client";

import React, { useState } from "react";
import { useSession } from "@/lib/SessionContext";
import { Utensils, ArrowRight, Sparkles, AlertCircle } from "lucide-react";

interface NameLoginFormProps {
  onSuccess?: () => void;
}

export default function NameLoginForm({ onSuccess }: NameLoginFormProps) {
  const { loginWithName } = useSession();
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
      if (onSuccess) onSuccess();
    } else {
      setError(result.error || "Could not log in. Please try again.");
    }
  };

  return (
    <div className="w-full max-w-md mx-auto px-4 py-8 sm:py-16">
      <div className="glass-panel float-card p-7 sm:p-8 rounded-3xl border border-white/10 shadow-2xl space-y-6 relative overflow-hidden">
        {/* Glow orb */}
        <div className="absolute -top-12 -right-12 w-40 h-40 bg-amber-500/15 rounded-full blur-2xl pointer-events-none" />

        {/* Festival Brand Header */}
        <div className="text-center space-y-3 relative z-10">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500/20 to-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto shadow-xs">
            <svg
              viewBox="0 0 24 24"
              className="w-6 h-6 text-amber-400"
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
            <h1 className="text-xl sm:text-2xl font-display font-black text-white tracking-tight">
              Grand Food Fest 2026
            </h1>
            <p className="text-xs text-slate-400 max-w-xs mx-auto mt-1 leading-relaxed">
              Enter your name to explore 160+ stadium stalls and score live tastings across Gachibowli.
            </p>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 stroke-[1.75]" />
            <span className="font-medium">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
          <div>
            <label
              htmlFor="attendeeNameInput"
              className="block text-xs font-display font-bold uppercase tracking-wider text-slate-300 mb-2"
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
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm font-sans text-white placeholder:text-slate-500 focus:outline-hidden focus:border-amber-400/60 focus:bg-white/10 transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !name.trim()}
            className="w-full h-12 rounded-xl font-display font-bold text-xs tracking-wide bg-gradient-to-r from-orange-500 to-amber-500 hover:opacity-95 active:scale-[0.98] text-white transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-amber-500/10"
          >
            <span>{isSubmitting ? "Entering Festival..." : "Continue to Festival"}</span>
            <ArrowRight className="w-4 h-4 stroke-[1.75]" />
          </button>
        </form>

        <div className="pt-3 border-t border-white/5 text-center text-[11px] text-slate-500 flex items-center justify-center gap-2">
          <span>Gachibowli Stadium, Hyderabad • Live Attendee Voting</span>
        </div>
      </div>
    </div>
  );
}
