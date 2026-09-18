"use client";

import React, { useState, useEffect } from "react";
import { Award, Plus, Crown, Sparkles, Check, X, Trophy } from "lucide-react";

export default function AdminAwardsPage() {
  const [awards, setAwards] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Create award state
  const [isCreating, setIsCreating] = useState(false);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Biryani & Nizami Heritage");
  const [description, setDescription] = useState("");
  const [selectedNominees, setSelectedNominees] = useState<string[]>([]);

  const fetchAwards = async () => {
    setIsLoading(true);
    try {
      const [resAwards, resVendors] = await Promise.all([
        fetch("/api/admin/awards"),
        fetch("/api/vendors?type=FOOD&limit=150"),
      ]);
      const dataAwards = await resAwards.json();
      const dataVendors = await resVendors.json();

      if (resAwards.ok) setAwards(dataAwards.awards || []);
      if (resVendors.ok) setVendors(dataVendors.vendors || []);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAwards();
  }, []);

  const handleCreateAward = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    await fetch("/api/admin/awards", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "CREATE_AWARD",
        name,
        category,
        description,
        nomineeVendorIds: selectedNominees,
      }),
    });

    setIsCreating(false);
    setName("");
    setDescription("");
    setSelectedNominees([]);
    fetchAwards();
  };

  const handleUpdateStatus = async (
    awardId: string,
    status: string,
    winnerVendorId?: string
  ) => {
    await fetch("/api/admin/awards", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "UPDATE_STATUS",
        awardId,
        status,
        winnerVendorId,
      }),
    });
    fetchAwards();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-fest-border pb-6">
        <div>
          <h1 className="text-2xl font-black text-white">Oscars-Style Awards Center</h1>
          <p className="text-xs text-gray-400 mt-1">
            Configure festival honor categories, assign nominees, and crown winners.
          </p>
        </div>

        <button
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-fest-gold text-black font-bold text-xs shadow-lg shadow-amber-500/20"
        >
          <Plus className="w-4 h-4" />
          Create Award Category
        </button>
      </div>

      {/* Create Modal */}
      {isCreating && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-fest-card border border-fest-border rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-fest-border pb-3">
              <h2 className="text-lg font-black text-white">Create Festival Award</h2>
              <button onClick={() => setIsCreating(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAward} className="space-y-4 text-xs">
              <div>
                <label className="block text-gray-300 font-semibold mb-1">Award Title</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Best Biryani of Hyderabad 2026"
                  className="w-full px-3 py-2 rounded-xl bg-fest-dark border border-fest-border text-white text-sm font-bold"
                />
              </div>

              <div>
                <label className="block text-gray-300 font-semibold mb-1">Category</label>
                <input
                  type="text"
                  required
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="e.g. Biryani & Nizami Heritage"
                  className="w-full px-3 py-2 rounded-xl bg-fest-dark border border-fest-border text-white"
                />
              </div>

              <div>
                <label className="block text-gray-300 font-semibold mb-1">Description</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Significance of this honor..."
                  className="w-full px-3 py-2 rounded-xl bg-fest-dark border border-fest-border text-white"
                />
              </div>

              <div>
                <label className="block text-gray-300 font-semibold mb-1">
                  Select Initial Nominees ({selectedNominees.length} selected)
                </label>
                <div className="max-h-40 overflow-y-auto border border-fest-border rounded-xl bg-fest-dark p-2 space-y-1">
                  {vendors.slice(0, 30).map((v) => {
                    const isSelected = selectedNominees.includes(v.id);
                    return (
                      <button
                        type="button"
                        key={v.id}
                        onClick={() => {
                          setSelectedNominees(
                            isSelected
                              ? selectedNominees.filter((id) => id !== v.id)
                              : [...selectedNominees, v.id]
                          );
                        }}
                        className={`w-full text-left p-2 rounded-lg flex items-center justify-between text-xs transition ${
                          isSelected ? "bg-amber-500 text-black font-bold" : "text-gray-300 hover:bg-fest-card"
                        }`}
                      >
                        <span>
                          {v.name} ({v.stallNumber})
                        </span>
                        <span>{isSelected ? "✓" : "+"}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-fest-border">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-4 py-2 rounded-xl bg-fest-dark border border-fest-border text-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-fest-gold text-black font-bold shadow"
                >
                  Create Award
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Awards Cards */}
      <div className="space-y-6">
        {awards.map((award) => (
          <div
            key={award.id}
            className="glass-panel p-6 rounded-2xl border border-fest-border space-y-4 shadow-lg"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-fest-border pb-4">
              <div>
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">
                  {award.category}
                </span>
                <h3 className="text-xl font-black text-white">{award.name}</h3>
                {award.description && (
                  <p className="text-xs text-gray-400 mt-0.5">{award.description}</p>
                )}
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-gray-400">Status:</span>
                <select
                  value={award.status}
                  onChange={(e) => handleUpdateStatus(award.id, e.target.value, award.winner?.id)}
                  className="px-3 py-1.5 rounded-xl bg-fest-dark border border-fest-border text-xs text-white focus:outline-none"
                >
                  <option value="DRAFT">DRAFT (Hidden)</option>
                  <option value="NOMINEES_REVEALED">NOMINEES REVEALED</option>
                  <option value="WINNER_ANNOUNCED">WINNER ANNOUNCED</option>
                </select>
              </div>
            </div>

            {/* Winner Selection */}
            <div className="p-4 rounded-xl bg-fest-dark border border-fest-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs text-gray-300">
                <Crown className="w-4 h-4 text-amber-400" />
                <span className="font-bold">Crown Winner Stall:</span>
                <span className="text-fest-gold font-extrabold">
                  {award.winner ? `${award.winner.name} (Stall ${award.winner.stall})` : "None declared yet"}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={award.winner?.id || ""}
                  onChange={(e) =>
                    handleUpdateStatus(award.id, "WINNER_ANNOUNCED", e.target.value)
                  }
                  className="px-3 py-1.5 rounded-xl bg-fest-card border border-fest-border text-xs text-white"
                >
                  <option value="">Select Winner from Nominees</option>
                  {award.nominees.map((n: any) => (
                    <option key={n.id} value={n.id}>
                      🏆 {n.name} (Stall {n.stall})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Nominees list */}
            <div>
              <span className="text-xs font-bold text-gray-400 block mb-2">
                Nominated Stalls ({award.nominees.length}):
              </span>
              <div className="flex flex-wrap gap-2">
                {award.nominees.map((nom: any) => (
                  <span
                    key={nom.id}
                    className={`px-3 py-1.5 rounded-xl text-xs border flex items-center gap-1.5 ${
                      award.winner?.id === nom.id
                        ? "bg-amber-500 text-black border-amber-400 font-bold"
                        : "bg-fest-dark border-fest-border text-gray-300"
                    }`}
                  >
                    {award.winner?.id === nom.id && <Crown className="w-3.5 h-3.5" />}
                    <span>{nom.name}</span>
                    <span className="text-[10px] opacity-70">({nom.stall})</span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
