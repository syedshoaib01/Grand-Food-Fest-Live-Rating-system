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
  remainingQuota: number;
  ratedCount: number;
  maxPerDay: number;
  dayNumber: number;
  ratedVendors: RatedVendorInfo[];
  isLoading: boolean;
  loginWithPass: (pass: string, dayId?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [authenticated, setAuthenticated] = useState(false);
  const [passToken, setPassToken] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
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
        setDayNumber(data.session.dayNumber);
        setRemainingQuota(data.limits.remainingQuotaToday);
        setRatedCount(data.limits.ratedCountToday);
        setMaxPerDay(data.limits.maxPerDay);
        setRatedVendors(data.ratedVendorsToday || []);
      } else {
        setAuthenticated(false);
        setPassToken(null);
        setSessionId(null);
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
    await fetch("/api/voting/session", { method: "DELETE" });
    setAuthenticated(false);
    setPassToken(null);
    setSessionId(null);
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
        remainingQuota,
        ratedCount,
        maxPerDay,
        dayNumber,
        ratedVendors,
        isLoading,
        loginWithPass,
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
