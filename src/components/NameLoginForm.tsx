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
      <div className="ticket-stub p-6 sm:p-8 border border-fest-border shadow-ticket space-y-6 bg-white">
        {/* Festival Crest Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-display font-extrabold bg-fest-terracottaLight text-fest-terracottaDark border border-fest-terracotta/20 shadow-2xs">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Grand Food Fest 2026</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-display font-black text-fest-charcoal tracking-tight">
            Welcome, Foodie!
          </h1>
          <p className="text-xs sm:text-sm text-fest-charcoalMuted max-w-xs mx-auto leading-relaxed">
            Enter your name to explore 160+ stadium stalls and rate your favorite festival bites.
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span className="font-medium">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="attendeeNameInput"
              className="block text-xs font-display font-bold uppercase tracking-wider text-fest-charcoal mb-2"
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
                className="w-full px-4 py-3 rounded-xl bg-fest-parchment/60 border border-fest-border text-sm font-sans text-fest-charcoal placeholder:text-fest-charcoalTertiary focus:outline-hidden focus:ring-2 focus:ring-fest-saffron focus:bg-white transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !name.trim()}
            className="w-full h-12 rounded-xl font-display font-black text-sm bg-gradient-to-r from-fest-terracotta to-fest-ember hover:opacity-95 active:scale-[0.98] text-white shadow-xs transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <span>{isSubmitting ? "Entering Festival..." : "Continue to Festival"}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="pt-3 border-t border-fest-parchment text-center text-[11px] text-fest-charcoalMuted flex items-center justify-center gap-2">
          <Utensils className="w-3.5 h-3.5 text-fest-saffron" />
          <span>Gachibowli Stadium, Hyderabad • Live Attendee Voting</span>
        </div>
      </div>
    </div>
  );
}
