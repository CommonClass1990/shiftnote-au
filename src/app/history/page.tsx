"use client";

// ============================================================================
// ShiftNote AU - NDIS Commission Audit History (Glass UI Redesign)
// ============================================================================

import React, { useEffect, useState } from "react";
import {
  Download,
  FileSpreadsheet,
  FileText,
  CheckCircle2,
  Clock,
  TrendingUp,
} from "lucide-react";
import {
  DEMO_INITIAL_SHIFTS,
  DEMO_PARTICIPANTS,
  DEMO_WORKER_PROFILE,
} from "@/lib/demo-data";
import {
  getStoredParticipants,
  getStoredShifts,
  getStoredWorkerProfile,
} from "@/lib/local-store";
import type { Participant, ShiftAndClaim, WorkerProfile } from "@/lib/types";

const statusStyle: Record<string, React.CSSProperties> = {
  draft: { background: "rgba(100,116,139,0.15)", border: "1px solid rgba(148,163,184,0.20)", color: "#94a3b8" },
  approved: { background: "rgba(13,148,136,0.12)", border: "1px solid rgba(20,184,166,0.25)", color: "#5eead4" },
  xero_synced: { background: "rgba(79,70,229,0.12)", border: "1px solid rgba(129,140,248,0.25)", color: "#a5b4fc" },
  pdf_emailed: { background: "rgba(99,102,241,0.12)", border: "1px solid rgba(129,140,248,0.22)", color: "#c7d2fe" },
  paid: { background: "rgba(5,150,105,0.15)", border: "1px solid rgba(52,211,153,0.28)", color: "#6ee7b7" },
  voided: { background: "rgba(127,29,29,0.15)", border: "1px solid rgba(248,113,113,0.22)", color: "#fca5a5" },
};

export default function HistoryPage() {
  const [shifts, setShifts] = useState<ShiftAndClaim[]>(DEMO_INITIAL_SHIFTS);
  const [participants, setParticipants] = useState<Participant[]>(DEMO_PARTICIPANTS);
  const [worker, setWorker] = useState<WorkerProfile>(DEMO_WORKER_PROFILE);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  useEffect(() => {
    setShifts(getStoredShifts());
    setParticipants(getStoredParticipants());
    setWorker(getStoredWorkerProfile());
  }, []);

  const getParticipantForShift = (participantId: string): Participant =>
    participants.find((p) => p.id === participantId) ?? DEMO_PARTICIPANTS[0]!;

  const handleExportAuditCsv = () => {
    const headers = [
      "Invoice Number", "Shift Date", "Start Time", "End Time", "Duration Hours",
      "KM Travelled", "Participant Name", "NDIS Number", "NDIS Item Codes",
      "Total Amount (AUD GST-Free)", "Claim Status", "Xero Invoice ID",
      "Case Note - Activities", "Case Note - Engagement", "Case Note - Goals Alignment",
    ];

    const escapeCsv = (val: string | number | null | undefined) => {
      const str = String(val ?? "").replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = shifts.map((s) => {
      const p = getParticipantForShift(s.participant_id);
      const codes = s.line_items.map((li) => li.ndis_code).join("; ");
      return [
        s.invoice_number, s.shift_date, s.start_time, s.end_time,
        s.duration_hours, s.km_travelled, p.full_name, p.ndis_number,
        codes, s.total_amount.toFixed(2), s.status, s.xero_invoice_id ?? "",
        s.case_note_activities, s.case_note_engagement, s.case_note_goals,
      ]
        .map(escapeCsv)
        .join(",");
    });

    const csvContent = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `ShiftNote_AU_NDIS_Audit_Export_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const handleDownloadShiftPdf = async (claim: ShiftAndClaim) => {
    setDownloadingId(claim.id);
    try {
      const participant = getParticipantForShift(claim.participant_id);
      const response = await fetch("/api/claims/generate-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ claim, participant, worker }),
      });

      if (!response.ok) throw new Error("Failed to generate PDF.");

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${claim.invoice_number}_NDIS_Audit.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } finally {
      setDownloadingId(null);
    }
  };

  const totalClaimedAud = shifts.reduce((acc, s) => acc + s.total_amount, 0);

  return (
    <div className="space-y-4">

      {/* ── HEADER ──────────────────────────────────────────────── */}
      <header className="glass relative overflow-hidden rounded-3xl px-5 py-4">
        <div
          className="pointer-events-none absolute -top-6 -right-6 h-28 w-36 rounded-full opacity-20"
          style={{ background: "radial-gradient(circle, rgba(99,102,241,0.55) 0%, transparent 70%)" }}
        />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-base font-black text-white">
              NDIS Audit & Claims History
            </h1>
            <div className="flex items-center gap-3 mt-1">
              <p className="text-xs text-slate-400">
                {shifts.length} shift{shifts.length !== 1 ? "s" : ""} recorded
              </p>
              <div className="flex items-center gap-1 text-xs text-teal-300 font-semibold">
                <TrendingUp className="h-3 w-3" />
                ${totalClaimedAud.toFixed(2)} AUD GST-Free
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleExportAuditCsv}
            className="inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-bold text-white transition-all hover:brightness-110 active:scale-95"
            style={{
              background: "linear-gradient(135deg, rgba(13,148,136,0.85) 0%, rgba(5,150,105,0.90) 100%)",
              border: "1px solid rgba(20,184,166,0.30)",
              boxShadow: "0 4px 16px rgba(13,148,136,0.22)",
            }}
          >
            <FileSpreadsheet className="h-4 w-4" />
            Export Audit CSV
          </button>
        </div>
      </header>

      {/* ── SHIFTS LIST ─────────────────────────────────────────── */}
      <div className="space-y-3">
        {shifts.map((shift) => {
          const participant = getParticipantForShift(shift.participant_id);
          const sStyle = statusStyle[shift.status] ?? statusStyle["draft"]!;

          return (
            <article
              key={shift.id}
              className="glass rounded-3xl px-5 py-4 space-y-3 hover:brightness-105 transition-all"
            >
              {/* Shift header row */}
              <div
                className="flex flex-wrap items-start justify-between gap-2 pb-3"
                style={{ borderBottom: "1px solid rgba(148,163,184,0.09)" }}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white">
                      {participant.full_name}
                    </span>
                    <span className="text-xs text-slate-500 font-mono">
                      NDIS# {participant.ndis_number}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                    <Clock className="h-3.5 w-3.5 text-teal-400" />
                    {shift.shift_date} · {shift.start_time}–{shift.end_time} (
                    {shift.duration_hours}h
                    {shift.km_travelled > 0 ? ` + ${shift.km_travelled}km` : ""})
                  </div>
                </div>

                <div className="text-right space-y-1">
                  <div
                    className="text-lg font-black tabular-nums drop-shadow-[0_0_8px_rgba(20,184,166,0.30)]"
                    style={{
                      background: "linear-gradient(135deg, #5eead4 0%, #14b8a6 100%)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                    }}
                  >
                    ${shift.total_amount.toFixed(2)}
                  </div>
                  <div className="flex items-center justify-end gap-1.5">
                    <span
                      className="rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                      style={sStyle}
                    >
                      {shift.status.replace(/_/g, " ")}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono">
                    {shift.invoice_number}
                  </div>
                </div>
              </div>

              {/* 3-part case note preview */}
              <div
                className="rounded-2xl px-4 py-3 space-y-2 text-xs"
                style={{
                  background: "rgba(2,6,23,0.50)",
                  border: "1px solid rgba(148,163,184,0.08)",
                }}
              >
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-teal-400 shrink-0" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-teal-400">
                    3-Part Clinical Case Note
                  </span>
                </div>
                <p className="text-slate-300 leading-relaxed">
                  <strong className="text-slate-400">Activities: </strong>
                  {shift.case_note_activities}
                </p>
                <p className="text-slate-400 leading-relaxed">
                  <strong className="text-slate-500">Engagement: </strong>
                  {shift.case_note_engagement}
                </p>
                <p className="text-slate-400 leading-relaxed">
                  <strong className="text-slate-500">Goals: </strong>
                  {shift.case_note_goals}
                </p>
              </div>

              {/* Line items & download */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap gap-1.5">
                  {shift.line_items.map((li, i) => (
                    <span
                      key={i}
                      className="rounded-xl px-2.5 py-1 text-[10px] font-mono font-semibold"
                      style={{
                        background: "rgba(13,148,136,0.09)",
                        border: "1px solid rgba(20,184,166,0.18)",
                        color: "#5eead4",
                      }}
                    >
                      {li.ndis_code} ({li.quantity}{li.unit})
                    </span>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => handleDownloadShiftPdf(shift)}
                  disabled={downloadingId === shift.id}
                  className="glass inline-flex items-center gap-1.5 rounded-2xl px-3.5 py-2 text-xs font-semibold text-teal-300 transition-all hover:brightness-110 disabled:opacity-40"
                >
                  {downloadingId === shift.id ? (
                    <FileText className="h-3.5 w-3.5 animate-pulse" />
                  ) : (
                    <Download className="h-3.5 w-3.5" />
                  )}
                  Download Audit PDF
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
