"use client";

import React, { useState, useEffect } from "react";
import {
  AlertTriangle,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  Clock,
  XCircle,
  AlertOctagon,
} from "lucide-react";

export default function AdminAnomaliesPage() {
  const [anomalies, setAnomalies] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const fetchAnomalies = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/anomalies");
      const data = await res.json();
      if (res.ok) {
        setAnomalies(data.anomalies || []);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnomalies();
  }, []);

  const handleResolve = async (
    anomalyId: string,
    vendorId: string,
    action: "INVALIDATE_RECENT_RATINGS" | "DISMISS_ANOMALY"
  ) => {
    try {
      const res = await fetch("/api/admin/anomalies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ anomalyId, vendorId, action }),
      });
      const data = await res.json();
      if (res.ok) {
        setActionMessage(data.message);
        fetchAnomalies();
      }
    } catch (err: any) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-fest-border pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-500/15 text-red-400 border border-red-500/30 flex items-center gap-1">
              <AlertOctagon className="w-3.5 h-3.5" />
              Real-Time Security & Fair Voting
            </span>
          </div>
          <h1 className="text-2xl font-black text-white">Anomaly Detection Logs</h1>
          <p className="text-xs text-gray-400 mt-1">
            Flags abnormal voting velocity spikes and vote concentration for organizer review.
          </p>
        </div>

        <button
          onClick={fetchAnomalies}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-fest-card hover:bg-fest-cardHover border border-fest-border text-xs font-bold text-gray-300"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Run Fresh Scan
        </button>
      </div>

      {actionMessage && (
        <div className="p-4 rounded-2xl bg-green-500/10 border border-green-500/30 text-green-400 text-xs flex items-center justify-between">
          <span>{actionMessage}</span>
          <button onClick={() => setActionMessage(null)} className="text-green-300 font-bold">
            Dismiss
          </button>
        </div>
      )}

      {/* Anomalies List */}
      {isLoading ? (
        <div className="space-y-3 animate-pulse">
          {[1, 2].map((i) => (
            <div key={i} className="glass-panel p-6 rounded-2xl border border-fest-border h-32" />
          ))}
        </div>
      ) : anomalies.length === 0 ? (
        <div className="glass-panel rounded-2xl p-12 text-center text-gray-400 space-y-3">
          <ShieldCheck className="w-12 h-12 mx-auto text-green-400/60" />
          <h3 className="font-bold text-lg text-white">No Voting Anomalies Detected</h3>
          <p className="text-xs max-w-sm mx-auto">
            Rating patterns across all stalls are within healthy bounds.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {anomalies.map((anom) => (
            <div
              key={anom.id}
              className={`p-6 rounded-2xl border transition-all ${
                anom.resolved
                  ? "bg-fest-card/50 border-fest-border opacity-70"
                  : "bg-red-500/[0.06] border-red-500/40 shadow-lg"
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        anom.severity === "HIGH"
                          ? "bg-red-600 text-white"
                          : "bg-amber-500 text-black font-extrabold"
                      }`}
                    >
                      {anom.severity} SEVERITY
                    </span>
                    <span className="font-mono text-xs text-amber-400 font-bold">
                      Stall {anom.stallNumber}
                    </span>
                    <span className="text-xs text-gray-500">•</span>
                    <span className="text-xs text-gray-400">
                      {new Date(anom.createdAt).toLocaleTimeString()}
                    </span>
                  </div>

                  <h3 className="text-lg font-black text-white flex items-center gap-2">
                    <span>⚠️ POTENTIAL ANOMALY: {anom.vendorName}</span>
                  </h3>

                  <p className="text-xs text-gray-300">
                    {anom.details?.message || "Abnormal rating velocity detected."}
                  </p>

                  {anom.resolved && (
                    <p className="text-[11px] text-green-400 pt-1 font-semibold">
                      ✓ Resolved by {anom.resolvedBy} at{" "}
                      {new Date(anom.resolvedAt).toLocaleTimeString()}
                    </p>
                  )}
                </div>

                {/* Actions */}
                {!anom.resolved && (
                  <div className="flex items-center gap-2 self-start md:self-center shrink-0">
                    <button
                      onClick={() =>
                        handleResolve(anom.id, anom.vendorId, "INVALIDATE_RECENT_RATINGS")
                      }
                      className="px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-md shadow-red-600/20 transition"
                    >
                      Invalidate Suspicious Ratings
                    </button>
                    <button
                      onClick={() =>
                        handleResolve(anom.id, anom.vendorId, "DISMISS_ANOMALY")
                      }
                      className="px-3.5 py-2 rounded-xl bg-fest-dark hover:bg-fest-card border border-fest-border text-gray-300 text-xs font-semibold"
                    >
                      Dismiss as Benign
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
