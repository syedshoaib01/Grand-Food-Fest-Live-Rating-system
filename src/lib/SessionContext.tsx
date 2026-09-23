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
  const [isLoading, setIsLoading] = useState(true);

  const fetchSession = async () => {
    try {
      const res = await fetch("/api/voting/session", { cache: "no-store" });
      const data = await res.json();
      if (data.authenticated && data.session) {
        setAuthenticated(true);
        setPassToken(data.session.passToken);
        setSessionId(data.session.id);
        setAttendeeName(data.attendeeName || localStorage.getItem("gff_attendee_name") || null);
        setDayNumber(data.session.dayNumber);
        setRemainingQuota(data.limits.remainingQuotaToday);
        setRatedCount(data.limits.ratedCountToday);
        setMaxPerDay(data.limits.maxPerDay);
        setRatedVendors(data.ratedVendorsToday || []);
      } else {
        setAuthenticated(false);
        setPassToken(null);
        setSessionId(null);
        setAttendeeName(null);
        setRatedVendors([]);
        setRemainingQuota(5);
        setRatedCount(0);
      }
    } catch {
      setAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSession();
  }, []);

  const loginWithName = async (name: string, dayId?: string) => {
    const trimmed = name.trim();
    if (!trimmed) {
      return { success: false, error: "Please enter your name." };
    }
    try {
      setIsLoading(true);
      const res = await fetch("/api/voting/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed, eventDayId: dayId }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || "Login failed" };
      }
      try {
        localStorage.setItem("gff_attendee_name", trimmed);
      } catch {}
      setAttendeeName(trimmed);
      await fetchSession();
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message || "Network error" };
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithPass = async (token: string, dayId?: string) => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/voting/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passToken: token, eventDayId: dayId }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || "Verification failed" };
      }
      await fetchSession();
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message || "Network error" };
    } finally {
      setIsLoading(false);
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
