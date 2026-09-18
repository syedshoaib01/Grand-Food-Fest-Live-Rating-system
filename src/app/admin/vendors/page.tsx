"use client";

import React, { useState, useEffect } from "react";
import {
  Utensils,
  Plus,
  Search,
  Edit2,
  CheckCircle,
  XCircle,
  PauseCircle,
  RefreshCw,
  Star,
  MapPin,
  X,
} from "lucide-react";

export default function AdminVendorsPage() {
  const [vendors, setVendors] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [isLoading, setIsLoading] = useState(true);

  // Modal form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<any>(null);
  const [formName, setFormName] = useState("");
  const [formStall, setFormStall] = useState("");
  const [formCategory, setFormCategory] = useState("Biryani & Pulao");
  const [formCuisine, setFormCuisine] = useState("");
  const [formType, setFormType] = useState("FOOD");
  const [formDesc, setFormDesc] = useState("");
  const [formStatus, setFormStatus] = useState("ACTIVE");
  const [formSaving, setFormSaving] = useState(false);

  const fetchVendors = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      params.set("type", filterType);
      params.set("status", filterStatus);
      params.set("limit", "200");

      const res = await fetch(`/api/vendors?${params.toString()}`);
      const data = await res.json();
      if (res.ok) {
        setVendors(data.vendors || []);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVendors();
  }, [filterType, filterStatus]);

  const openCreateModal = () => {
    setEditingVendor(null);
    setFormName("");
    setFormStall(`A-${vendors.length + 1}`);
    setFormCategory("Biryani & Pulao");
    setFormCuisine("Hyderabadi");
    setFormType("FOOD");
    setFormDesc("");
    setFormStatus("ACTIVE");
    setIsModalOpen(true);
  };

  const openEditModal = (v: any) => {
    setEditingVendor(v);
    setFormName(v.name);
    setFormStall(v.stallNumber);
    setFormCategory(v.category);
    setFormCuisine(v.cuisine || "");
    setFormType(v.vendorType);
    setFormDesc(v.description || "");
    setFormStatus(v.status);
    setIsModalOpen(true);
  };

  const handleToggleStatus = async (vendorId: string, currentStatus: string) => {
    const nextStatus = currentStatus === "ACTIVE" ? "PAUSED" : "ACTIVE";
    try {
      const res = await fetch(`/api/vendors/${vendorId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (res.ok) {
        fetchVendors();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSaving(true);

    try {
      if (editingVendor) {
        // Update
        await fetch(`/api/vendors/${editingVendor.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formName,
            stallNumber: formStall,
            category: formCategory,
            cuisine: formCuisine,
            vendorType: formType,
            description: formDesc,
            status: formStatus,
          }),
        });
      } else {
        // Create
        await fetch("/api/vendors", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formName,
            stallNumber: formStall,
            category: formCategory,
            cuisine: formCuisine,
            vendorType: formType,
            description: formDesc,
            status: formStatus,
          }),
        });
      }

      setIsModalOpen(false);
      fetchVendors();
    } finally {
      setFormSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-fest-border pb-6">
        <div>
          <h1 className="text-2xl font-black text-white">Vendor Management</h1>
          <p className="text-xs text-gray-400 mt-1">
            Manage festival stalls, assign stall numbers, configure cuisines, and control status.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={openCreateModal}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-fest-gold text-black font-bold text-xs shadow-lg shadow-amber-500/20"
          >
            <Plus className="w-4 h-4" />
            Add New Vendor
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchVendors()}
            placeholder="Search stall name or number..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-fest-card border border-fest-border text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-fest-gold"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 rounded-xl bg-fest-card border border-fest-border text-xs text-gray-300 focus:outline-none"
          >
            <option value="ALL">All Types</option>
            <option value="FOOD">Food Only</option>
            <option value="LIFESTYLE">Lifestyle Only</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 rounded-xl bg-fest-card border border-fest-border text-xs text-gray-300 focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="PAUSED">Paused</option>
            <option value="CLOSED">Closed</option>
          </select>

          <button
            onClick={fetchVendors}
            className="p-2 rounded-xl bg-fest-card border border-fest-border text-gray-300 hover:text-white"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Vendors Table */}
      <div className="glass-panel rounded-2xl border border-fest-border overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-300">
            <thead className="bg-fest-dark text-[11px] uppercase tracking-wider text-gray-400 border-b border-fest-border">
              <tr>
                <th className="py-3 px-4">Stall</th>
                <th className="py-3 px-4">Vendor Name</th>
                <th className="py-3 px-4">Category / Cuisine</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4 text-center">Ratings & Avg</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-fest-border/50 font-medium">
              {vendors.map((v) => (
                <tr key={v.id} className="hover:bg-fest-cardHover/40 transition">
                  <td className="py-3 px-4 font-mono font-bold text-amber-400">
                    {v.stallNumber}
                  </td>
                  <td className="py-3 px-4 font-bold text-white">
                    {v.name}
                  </td>
                  <td className="py-3 px-4 text-gray-400">
                    {v.category} {v.cuisine && `• ${v.cuisine}`}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        v.vendorType === "FOOD"
                          ? "bg-amber-500/15 text-amber-400"
                          : "bg-purple-500/15 text-purple-400"
                      }`}
                    >
                      {v.vendorType}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    {v.vendorType === "FOOD" ? (
                      <span className="font-semibold text-white">
                        ⭐ {v.ratingAverage.toFixed(2)}{" "}
                        <span className="text-gray-400 font-normal">({v.ratingCount})</span>
                      </span>
                    ) : (
                      <span className="text-gray-500">—</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        v.status === "ACTIVE"
                          ? "bg-green-500/15 text-green-400 border border-green-500/30"
                          : v.status === "PAUSED"
                          ? "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                          : "bg-red-500/15 text-red-400 border border-red-500/30"
                      }`}
                    >
                      {v.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleToggleStatus(v.id, v.status)}
                        className={`p-1.5 rounded-lg border text-xs transition ${
                          v.status === "ACTIVE"
                            ? "border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
                            : "border-green-500/30 text-green-400 hover:bg-green-500/10"
                        }`}
                        title={v.status === "ACTIVE" ? "Pause Stall" : "Activate Stall"}
                      >
                        {v.status === "ACTIVE" ? (
                          <PauseCircle className="w-3.5 h-3.5" />
                        ) : (
                          <CheckCircle className="w-3.5 h-3.5" />
                        )}
                      </button>

                      <button
                        onClick={() => openEditModal(v)}
                        className="p-1.5 rounded-lg border border-fest-border text-gray-300 hover:text-white hover:bg-fest-card"
                        title="Edit Stall"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit / Create Vendor Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-fest-card border border-fest-border rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-fest-border pb-4">
              <h2 className="text-lg font-black text-white">
                {editingVendor ? "Edit Vendor Stall" : "Add New Festival Stall"}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveVendor} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-300 font-semibold mb-1">Stall Number</label>
                  <input
                    type="text"
                    required
                    value={formStall}
                    onChange={(e) => setFormStall(e.target.value)}
                    placeholder="e.g. A-01"
                    className="w-full px-3 py-2 rounded-xl bg-fest-dark border border-fest-border text-white"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 font-semibold mb-1">Vendor Type</label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-fest-dark border border-fest-border text-white"
                  >
                    <option value="FOOD">Food Vendor</option>
                    <option value="LIFESTYLE">Lifestyle Stall</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-gray-300 font-semibold mb-1">Vendor Brand Name</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Spice Route"
                  className="w-full px-3 py-2 rounded-xl bg-fest-dark border border-fest-border text-white text-sm font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-300 font-semibold mb-1">Category</label>
                  <input
                    type="text"
                    required
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    placeholder="e.g. Biryani & Pulao"
                    className="w-full px-3 py-2 rounded-xl bg-fest-dark border border-fest-border text-white"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 font-semibold mb-1">Cuisine Style</label>
                  <input
                    type="text"
                    value={formCuisine}
                    onChange={(e) => setFormCuisine(e.target.value)}
                    placeholder="e.g. Hyderabadi"
                    className="w-full px-3 py-2 rounded-xl bg-fest-dark border border-fest-border text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-300 font-semibold mb-1">Status</label>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-fest-dark border border-fest-border text-white"
                >
                  <option value="ACTIVE">ACTIVE (Accepting Ratings)</option>
                  <option value="PAUSED">PAUSED (Temporarily Paused)</option>
                  <option value="CLOSED">CLOSED (Closed for Day)</option>
                  <option value="WITHDRAWN">WITHDRAWN</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-300 font-semibold mb-1">Description</label>
                <textarea
                  rows={3}
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="Signature dishes and stall highlights..."
                  className="w-full px-3 py-2 rounded-xl bg-fest-dark border border-fest-border text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-fest-border">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-fest-dark border border-fest-border text-gray-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSaving}
                  className="px-5 py-2 rounded-xl bg-fest-gold text-black font-bold shadow"
                >
                  {formSaving ? "Saving..." : "Save Stall"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
