"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

export interface RatedVendorInfo {
  ratingId: string;
  vendorId: string;
  vendorName: string;
  rating: number;
  updatedAt: string;
}

export interface SessionContextType {
  authenticated: boolean;
  passToken: string | null;
  sessionId: string | null;
  attendeeName: string | null;
  remainingQuota: number;
  ratedCount: number;
  maxPerDay: number;
  dayNumber: number;
  ratedVendors: RatedVendorInfo[];
  isLoading: boolean;
  loginWithPass: (pass: string, dayId?: string) => Promise<{ success: boolean; error?: string }>;
  loginWithName: (name: string, dayId?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [authenticated, setAuthenticated] = useState(false);
  const [passToken, setPassToken] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [attendeeName, setAttendeeName] = useState<string | null>(null);
  const [remainingQuota, setRemainingQuota] = useState(5);
  const [ratedCount, setRatedCount] = useState(0);
  const [maxPerDay, setMaxPerDay] = useState(5);
  const [dayNumber, setDayNumber] = useState(1);
  const [ratedVendors, setRatedVendors] = useState<RatedVendorInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const applySessionData = (data: any, nameFallback?: string) => {
    setAuthenticated(true);
    if (data.session) {
      setPassToken(data.session.passToken);
      setSessionId(data.session.id);
      setDayNumber(data.session.dayNumber);
    }
    const finalName =
      data.attendeeName ||
      nameFallback ||
      (typeof window !== "undefined" ? localStorage.getItem("gff_attendee_name") : null);
    if (finalName) {
      setAttendeeName(finalName);
      try {
        localStorage.setItem("gff_attendee_name", finalName);
      } catch {}
    }
    if (data.limits) {
      setRemainingQuota(data.limits.remainingQuotaToday);
      setRatedCount(data.limits.ratedCountToday);
      setMaxPerDay(data.limits.maxPerDay);
    }
    if (data.ratedVendorsToday) {
      setRatedVendors(data.ratedVendorsToday);
    }
  };

  const fetchSession = async () => {
    try {
      const res = await fetch("/api/voting/session", { cache: "no-store" });
      const data = await res.json();
      if (data.authenticated && data.session) {
        applySessionData(data);
      } else {
        // Auto-restore session from stored attendee name if available on device
        const savedName = typeof window !== "undefined" ? localStorage.getItem("gff_attendee_name") : null;
        if (savedName && savedName.trim()) {
          const autoRes = await fetch("/api/voting/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: savedName.trim() }),
          });
          const autoData = await autoRes.json();
          if (autoRes.ok && autoData.authenticated && autoData.session) {
            applySessionData(autoData, savedName.trim());
            return;
          }
        }

        // Only clear authentication if no saved name was ever stored locally
        if (!savedName) {
          setAuthenticated(false);
          setPassToken(null);
          setSessionId(null);
          setAttendeeName(null);
          setRatedVendors([]);
          setRemainingQuota(5);
          setRatedCount(0);
        }
      }
    } catch {
      const savedName = typeof window !== "undefined" ? localStorage.getItem("gff_attendee_name") : null;
      if (!savedName) {
        setAuthenticated(false);
      }
    }
  };

  useEffect(() => {
    // Immediate hydration from localStorage on mount — zero flash of unauthenticated state
    try {
      const stored = localStorage.getItem("gff_attendee_name");
      if (stored && stored.trim()) {
        setAttendeeName(stored.trim());
        setAuthenticated(true);
      }
    } catch {}
    fetchSession();
  }, []);

  const loginWithName = async (name: string, dayId?: string) => {
    const trimmed = name.trim();
    if (!trimmed) {
      return { success: false, error: "Please enter your name." };
    }

    // Instantly set authenticated state locally so user experiences 0ms lag
    setAttendeeName(trimmed);
    setAuthenticated(true);
    try {
      localStorage.setItem("gff_attendee_name", trimmed);
    } catch {}

    try {
      const res = await fetch("/api/voting/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed, eventDayId: dayId }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || "Login failed" };
      }

      // Immediately apply complete server-verified session state
      applySessionData(data, trimmed);
      return { success: true };
    } catch {
      // Retain optimistic login state even if network blips
      return { success: true };
    }
  };

  const loginWithPass = async (token: string, dayId?: string) => {
    const trimmed = token.trim();
    if (!trimmed) {
      return { success: false, error: "Please enter your name or pass." };
    }
    setAttendeeName(trimmed);
    setAuthenticated(true);
    try {
      localStorage.setItem("gff_attendee_name", trimmed);
    } catch {}

    try {
      const res = await fetch("/api/voting/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passToken: trimmed, name: trimmed, eventDayId: dayId }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || "Verification failed" };
      }

      applySessionData(data, trimmed);
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message || "Network error" };
    }
  };

  const logout = async () => {
    try {
      localStorage.removeItem("gff_attendee_name");
    } catch {}
    await fetch("/api/voting/session", { method: "DELETE" });
    setAuthenticated(false);
    setPassToken(null);
    setSessionId(null);
    setAttendeeName(null);
    setRatedVendors([]);
    setRemainingQuota(5);
    setRatedCount(0);
  };

  return (
    <SessionContext.Provider
      value={{
        authenticated,
        passToken,
        sessionId,
        attendeeName,
        remainingQuota,
        ratedCount,
        maxPerDay,
        dayNumber,
        ratedVendors,
        isLoading,
        loginWithPass,
        loginWithName,
        logout,
        refreshSession: fetchSession,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error("useSession must be used within a SessionProvider");
  }
  return context;
}
