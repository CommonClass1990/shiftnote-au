"use client";

// ============================================================================
// ShiftNote AU - NDIS Participants Directory (Glass UI Redesign)
// ============================================================================

import React, { useEffect, useState } from "react";
import { UserPlus, Target, Mail, Hash, CheckCircle2, X } from "lucide-react";
import { DEMO_PARTICIPANTS, DEMO_WORKER_PROFILE } from "@/lib/demo-data";
import { getStoredParticipants, saveStoredParticipants } from "@/lib/local-store";
import type { FundingType, Participant } from "@/lib/types";

const fundingBadge: Record<FundingType, { label: string; style: React.CSSProperties }> = {
  plan_managed: {
    label: "Plan Managed",
    style: { background: "rgba(13,148,136,0.12)", border: "1px solid rgba(20,184,166,0.25)", color: "#5eead4" },
  },
  self_managed: {
    label: "Self Managed",
    style: { background: "rgba(99,102,241,0.12)", border: "1px solid rgba(129,140,248,0.25)", color: "#a5b4fc" },
  },
  ndia_managed: {
    label: "NDIA Managed",
    style: { background: "rgba(245,158,11,0.10)", border: "1px solid rgba(251,191,36,0.22)", color: "#fcd34d" },
  },
};

export default function ParticipantsPage() {
  const [participants, setParticipants] = useState<Participant[]>(DEMO_PARTICIPANTS);
  const [showAddForm, setShowAddForm] = useState(false);
  const [fullName, setFullName] = useState("");
  const [ndisNumber, setNdisNumber] = useState("");
  const [fundingType, setFundingType] = useState<FundingType>("plan_managed");
  const [planManagerName, setPlanManagerName] = useState("");
  const [planManagerEmail, setPlanManagerEmail] = useState("");
  const [goalsSummary, setGoalsSummary] = useState("");
  const [savedNotice, setSavedNotice] = useState<string | null>(null);

  useEffect(() => {
    setParticipants(getStoredParticipants());
  }, []);

  const handleCreateParticipant = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanNdis = ndisNumber.replace(/\D/g, "").slice(0, 9);
    if (!fullName.trim() || cleanNdis.length !== 9) {
      setSavedNotice("Please provide a full name and a valid 9-digit NDIS number.");
      return;
    }

    const newParticipant: Participant = {
      id:
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `participant-${Date.now()}`,
      worker_id: DEMO_WORKER_PROFILE.id,
      full_name: fullName.trim(),
      ndis_number: cleanNdis,
      funding_type: fundingType,
      plan_manager_name: planManagerName.trim() || null,
      plan_manager_email: planManagerEmail.trim() || null,
      xero_contact_id: null,
      ndis_goals_summary:
        goalsSummary.trim() ||
        "Support daily living independence and community participation.",
    };

    const next = [newParticipant, ...participants];
    setParticipants(next);
    saveStoredParticipants(next);
    setFullName("");
    setNdisNumber("");
    setPlanManagerName("");
    setPlanManagerEmail("");
    setGoalsSummary("");
    setShowAddForm(false);
    setSavedNotice(`Added ${newParticipant.full_name} (NDIS# ${cleanNdis}).`);
  };

  const inputCls =
    "w-full rounded-xl glass-input px-3.5 py-2.5 text-xs focus:outline-none";

  return (
    <div className="space-y-4">

      {/* ── HEADER ──────────────────────────────────────────────── */}
      <header className="glass relative overflow-hidden rounded-3xl px-5 py-4 flex items-center justify-between">
        <div
          className="pointer-events-none absolute -top-8 -left-8 h-28 w-36 rounded-full opacity-25"
          style={{ background: "radial-gradient(circle, rgba(13,148,136,0.50) 0%, transparent 70%)" }}
        />
        <div className="relative">
          <h1 className="text-base font-black text-white">NDIS Participants</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Plan Manager contacts & NDIS goals injected into Gemini 4 Argon
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowAddForm((prev) => !prev)}
          className="relative inline-flex items-center gap-1.5 rounded-2xl px-4 py-2.5 text-xs font-bold text-white transition-all hover:brightness-110 active:scale-95"
          style={{
            background: "linear-gradient(135deg, rgba(13,148,136,0.85) 0%, rgba(5,150,105,0.90) 100%)",
            border: "1px solid rgba(20,184,166,0.30)",
            boxShadow: "0 4px 16px rgba(13,148,136,0.22)",
          }}
        >
          {showAddForm ? <X className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
          {showAddForm ? "Cancel" : "Add Participant"}
        </button>
      </header>

      {/* ── NOTICE ──────────────────────────────────────────────── */}
      {savedNotice && (
        <div
          className="flex items-center gap-2.5 rounded-2xl px-4 py-3 text-xs text-emerald-200"
          style={{
            background: "rgba(6,78,59,0.35)",
            border: "1px solid rgba(52,211,153,0.22)",
            backdropFilter: "blur(12px)",
          }}
        >
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>{savedNotice}</span>
        </div>
      )}

      {/* ── ADD FORM ────────────────────────────────────────────── */}
      {showAddForm && (
        <form
          onSubmit={handleCreateParticipant}
          className="glass-strong rounded-3xl px-5 py-5 space-y-4"
        >
          <div className="flex items-center gap-2 mb-1">
            <div className="h-4 w-1 rounded-full bg-gradient-to-b from-teal-400 to-teal-600" />
            <h2 className="text-xs font-bold uppercase tracking-widest text-teal-400">
              New Participant Profile
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                Full Name *
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Noah Williams"
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                9-Digit NDIS Number *
              </label>
              <input
                type="text"
                required
                maxLength={11}
                value={ndisNumber}
                onChange={(e) => setNdisNumber(e.target.value)}
                placeholder="430123456"
                className={inputCls}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                Funding Management
              </label>
              <select
                value={fundingType}
                onChange={(e) => setFundingType(e.target.value as FundingType)}
                className={inputCls}
              >
                <option value="plan_managed">Plan Managed</option>
                <option value="self_managed">Self Managed</option>
                <option value="ndia_managed">NDIA Agency Managed</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                Plan Manager Name
              </label>
              <input
                type="text"
                value={planManagerName}
                onChange={(e) => setPlanManagerName(e.target.value)}
                placeholder="MyIntegra Plan Management"
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                Plan Manager Email
              </label>
              <input
                type="email"
                value={planManagerEmail}
                onChange={(e) => setPlanManagerEmail(e.target.value)}
                placeholder="claims@myintegra.com.au"
                className={inputCls}
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
              NDIS Plan Goals (used for case note alignment)
            </label>
            <textarea
              rows={3}
              value={goalsSummary}
              onChange={(e) => setGoalsSummary(e.target.value)}
              placeholder="Goal 1: Increase independence in community shopping…"
              className="w-full rounded-2xl glass-input px-3.5 py-2.5 text-xs leading-relaxed focus:outline-none resize-none"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-2xl py-3 text-xs font-bold text-white transition-all hover:brightness-110 active:scale-95"
            style={{
              background:
                "linear-gradient(135deg, rgba(13,148,136,0.85) 0%, rgba(5,150,105,0.90) 100%)",
              border: "1px solid rgba(20,184,166,0.30)",
              boxShadow: "0 4px 16px rgba(13,148,136,0.20)",
            }}
          >
            Save NDIS Participant
          </button>
        </form>
      )}

      {/* ── PARTICIPANT LIST ─────────────────────────────────────── */}
      <div className="space-y-3">
        {participants.map((p) => {
          const badge = fundingBadge[p.funding_type];
          return (
            <article
              key={p.id}
              className="glass rounded-3xl px-5 py-4 space-y-3 hover:brightness-105 transition-all"
            >
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-sm font-bold text-white">{p.full_name}</h2>
                <div className="flex items-center gap-2">
                  <span
                    className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold"
                    style={badge.style}
                  >
                    {badge.label}
                  </span>
                  <span
                    className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-mono font-semibold"
                    style={{
                      background: "rgba(13,148,136,0.10)",
                      border: "1px solid rgba(20,184,166,0.22)",
                      color: "#5eead4",
                    }}
                  >
                    <Hash className="h-2.5 w-2.5" />
                    {p.ndis_number}
                  </span>
                </div>
              </div>

              {(p.plan_manager_name || p.plan_manager_email) && (
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                  {p.plan_manager_name && (
                    <span className="text-slate-300">{p.plan_manager_name}</span>
                  )}
                  {p.plan_manager_email && (
                    <span className="inline-flex items-center gap-1 text-teal-400">
                      <Mail className="h-3 w-3" />
                      {p.plan_manager_email}
                    </span>
                  )}
                </div>
              )}

              <div
                className="rounded-2xl px-4 py-3 space-y-1.5 text-xs"
                style={{
                  background: "rgba(2,6,23,0.50)",
                  border: "1px solid rgba(148,163,184,0.09)",
                }}
              >
                <div className="flex items-center gap-1.5 text-teal-400 font-semibold">
                  <Target className="h-3.5 w-3.5" />
                  Stated NDIS Plan Goals
                </div>
                <p className="text-slate-300 leading-relaxed">{p.ndis_goals_summary}</p>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
