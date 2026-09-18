"use client";

import React, { useState } from "react";
import { Download, FileText, Table, CheckCircle2 } from "lucide-react";

export default function AdminExportsPage() {
  const [downloading, setDownloading] = useState<string | null>(null);

  const exportTypes = [
    {
      id: "leaderboard",
      title: "Official Leaderboard",
      desc: "Final standings with ranks, Bayesian confidence scores, raw rating averages, and vote counts.",
    },
    {
      id: "vendors",
      title: "Vendor Master & Statistics",
      desc: "All 150+ food & lifestyle vendors with stall numbers, categories, status, and overall metrics.",
    },
    {
      id: "ratings",
      title: "Raw Ratings Telemetry",
      desc: "Individual rating events with timestamps, vendor, star rating, and anonymous pass token (no PII).",
    },
    {
      id: "summary",
      title: "Executive Festival Summary",
      desc: "High-level festival aggregates, total verified attendee sessions, total votes, and active days.",
    },
  ];

  const handleDownload = (type: string, format: "csv" | "json") => {
    setDownloading(`${type}-${format}`);
    window.location.href = `/api/admin/exports/${type}?format=${format}`;
    setTimeout(() => {
      setDownloading(null);
    }, 1500);
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-fest-border pb-6">
        <h1 className="text-2xl font-black text-white">Festival Data Export Center</h1>
        <p className="text-xs text-gray-400 mt-1">
          Download festival telemetry, official leaderboard standings, and audit logs in CSV or JSON format.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {exportTypes.map((item) => (
          <div
            key={item.id}
            className="glass-panel p-6 rounded-2xl border border-fest-border flex flex-col justify-between space-y-4 shadow-lg"
          >
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-fest-gold flex items-center justify-center">
                  <Table className="w-4 h-4" />
                </div>
                <h3 className="font-extrabold text-base text-white">{item.title}</h3>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed">{item.desc}</p>
            </div>

            <div className="pt-3 border-t border-fest-border/50 flex items-center gap-2.5">
              <button
                onClick={() => handleDownload(item.id, "csv")}
                disabled={downloading === `${item.id}-csv`}
                className="flex-1 py-2 rounded-xl bg-fest-card hover:bg-fest-cardHover border border-fest-border text-xs font-bold text-white flex items-center justify-center gap-1.5 transition"
              >
                <Download className="w-3.5 h-3.5 text-fest-gold" />
                <span>CSV</span>
              </button>

              <button
                onClick={() => handleDownload(item.id, "json")}
                disabled={downloading === `${item.id}-json`}
                className="flex-1 py-2 rounded-xl bg-fest-card hover:bg-fest-cardHover border border-fest-border text-xs font-bold text-white flex items-center justify-center gap-1.5 transition"
              >
                <FileText className="w-3.5 h-3.5 text-amber-400" />
                <span>JSON</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
