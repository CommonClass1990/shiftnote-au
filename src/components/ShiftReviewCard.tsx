"use client";

// ============================================================================
// ShiftNote AU - ShiftReviewCard Component (Glass UI Redesign)
// ============================================================================

import React, { useState } from "react";
import {
  CheckCircle2,
  Download,
  FileText,
  Mail,
  Plus,
  Send,
  ShieldCheck,
  Trash2,
  AlertTriangle,
  ChevronDown,
} from "lucide-react";
import {
  ALLOWED_NDIS_CODES,
  NDIS_CATALOGUE,
  enforceNdisPriceCap,
  formatInvoiceReference,
  formatPlanManagerLineDescription,
} from "@/lib/ndis-catalogue";
import type {
  AllowedNdisCode,
  InvoiceLineItem,
  Participant,
  ShiftAndClaim,
  WorkerProfile,
} from "@/lib/types";

export interface ShiftReviewCardProps {
  initialClaim: ShiftAndClaim;
  participant: Participant;
  worker: WorkerProfile;
  demoMode: boolean;
  onClaimUpdated: (updatedClaim: ShiftAndClaim) => void;
}

export function ShiftReviewCard({
  initialClaim,
  participant,
  worker,
  demoMode,
  onClaimUpdated,
}: ShiftReviewCardProps) {
  const [claim, setClaim] = useState<ShiftAndClaim>(initialClaim);
  const [submittingXero, setSubmittingXero] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [bannerMessage, setBannerMessage] = useState<{
    type: "success" | "warning" | "error";
    text: string;
  } | null>(null);

  const invoiceReference = formatInvoiceReference(
    participant.ndis_number,
    participant.full_name
  );

  const recomputeClaimTotals = (
    nextItems: InvoiceLineItem[],
    shiftDate = claim.shift_date,
    startTime = claim.start_time,
    endTime = claim.end_time
  ): ShiftAndClaim => {
    const normalizedItems: InvoiceLineItem[] = nextItems.map((item) => {
      const catalogueEntry = NDIS_CATALOGUE[item.ndis_code];
      const { appliedRate } = enforceNdisPriceCap(item.ndis_code, item.unit_price);
      const qty = Math.max(0, Math.round(Number(item.quantity) * 100) / 100);
      const lineTotal = Math.round(qty * appliedRate * 100) / 100;

      return {
        ...item,
        support_name: catalogueEntry.name,
        unit: catalogueEntry.unit,
        max_price_limit: catalogueEntry.priceCapAud,
        unit_price: appliedRate,
        quantity: qty,
        line_total: lineTotal,
        gst_code: "EXEMPTOUTPUT",
        description: formatPlanManagerLineDescription(
          item.ndis_code,
          catalogueEntry.name,
          shiftDate,
          startTime,
          endTime
        ),
      };
    });

    const totalAmount =
      Math.round(normalizedItems.reduce((sum, item) => sum + item.line_total, 0) * 100) / 100;

    const updated: ShiftAndClaim = {
      ...claim,
      shift_date: shiftDate,
      start_time: startTime,
      end_time: endTime,
      line_items: normalizedItems,
      total_amount: totalAmount,
    };
    setClaim(updated);
    onClaimUpdated(updated);
    return updated;
  };

  const handleFieldChange = <K extends keyof ShiftAndClaim>(
    field: K,
    value: ShiftAndClaim[K]
  ) => {
    const nextClaim = { ...claim, [field]: value };
    if (field === "shift_date" || field === "start_time" || field === "end_time") {
      recomputeClaimTotals(
        nextClaim.line_items,
        field === "shift_date" ? String(value) : nextClaim.shift_date,
        field === "start_time" ? String(value) : nextClaim.start_time,
        field === "end_time" ? String(value) : nextClaim.end_time
      );
      return;
    }
    setClaim(nextClaim);
    onClaimUpdated(nextClaim);
  };

  const handleLineItemCodeChange = (index: number, newCode: AllowedNdisCode) => {
    const catalogueItem = NDIS_CATALOGUE[newCode];
    const nextItems = claim.line_items.map((item, idx) =>
      idx === index
        ? {
            ...item,
            ndis_code: newCode,
            support_name: catalogueItem.name,
            unit: catalogueItem.unit,
            unit_price: catalogueItem.priceCapAud,
            max_price_limit: catalogueItem.priceCapAud,
          }
        : item
    );
    recomputeClaimTotals(nextItems);
  };

  const handleLineItemQuantityChange = (index: number, rawQty: string) => {
    const qty = Number(rawQty);
    const nextItems = claim.line_items.map((item, idx) =>
      idx === index ? { ...item, quantity: Number.isFinite(qty) ? qty : 0 } : item
    );
    recomputeClaimTotals(nextItems);
  };

  const handleLineItemRateChange = (index: number, rawRate: string) => {
    const requested = Number(rawRate);
    const currentItem = claim.line_items[index];
    if (!currentItem) return;

    const { appliedRate, priceCap, wasCapped } = enforceNdisPriceCap(
      currentItem.ndis_code,
      Number.isFinite(requested) ? requested : 0
    );

    if (wasCapped) {
      setBannerMessage({
        type: "warning",
        text: `NDIS Price Limit enforced: ${currentItem.ndis_code} cannot exceed $${priceCap.toFixed(2)} AUD/${currentItem.unit}.`,
      });
    }

    const nextItems = claim.line_items.map((item, idx) =>
      idx === index ? { ...item, unit_price: appliedRate } : item
    );
    recomputeClaimTotals(nextItems);
  };

  const handleAddTravelLine = () => {
    const primaryCode = claim.line_items[0]?.ndis_code ?? "04_104_0125_6_1";
    const travelCode: AllowedNdisCode = primaryCode.startsWith("01_")
      ? "01_799_0107_1_1"
      : "04_799_0125_6_1";
    const cat = NDIS_CATALOGUE[travelCode];
    const kms = claim.km_travelled > 0 ? claim.km_travelled : 10;

    const newItem: InvoiceLineItem = {
      ndis_code: travelCode,
      support_name: cat.name,
      description: formatPlanManagerLineDescription(
        travelCode,
        cat.name,
        claim.shift_date,
        claim.start_time,
        claim.end_time
      ),
      unit: "KM",
      quantity: kms,
      unit_price: cat.priceCapAud,
      max_price_limit: cat.priceCapAud,
      line_total: Math.round(kms * cat.priceCapAud * 100) / 100,
      gst_code: "EXEMPTOUTPUT",
    };

    recomputeClaimTotals([...claim.line_items, newItem]);
  };

  const handleRemoveLineItem = (index: number) => {
    if (claim.line_items.length <= 1) return;
    const nextItems = claim.line_items.filter((_, idx) => idx !== index);
    recomputeClaimTotals(nextItems);
  };

  const handlePushToXero = async () => {
    setSubmittingXero(true);
    setBannerMessage(null);
    try {
      const response = await fetch("/api/xero/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ claim, participant, demoMode }),
      });
      const data = (await response.json()) as {
        error?: string;
        xeroInvoiceId?: string;
        liveXeroPush?: boolean;
      };
      if (!response.ok || data.error) throw new Error(data.error || "Xero submission failed.");

      const updated: ShiftAndClaim = {
        ...claim,
        status: "xero_synced",
        xero_invoice_id: data.xeroInvoiceId ?? `xero-${Date.now()}`,
      };
      setClaim(updated);
      onClaimUpdated(updated);
      setBannerMessage({
        type: "success",
        text: data.liveXeroPush
          ? `Synced to Xero ACCREC (Invoice ID: ${updated.xero_invoice_id}, TaxType: EXEMPTOUTPUT).`
          : `Validated & queued Xero ACCREC payload (${updated.xero_invoice_id}, TaxType: EXEMPTOUTPUT).`,
      });
    } catch (err) {
      setBannerMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to push to Xero.",
      });
    } finally {
      setSubmittingXero(false);
    }
  };

  const handleEmailPlanManager = async () => {
    setSendingEmail(true);
    setBannerMessage(null);
    try {
      const response = await fetch("/api/claims/email-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ claim, participant, worker }),
      });
      const data = (await response.json()) as {
        error?: string;
        recipient?: string;
        simulatedDemoSend?: boolean;
      };
      if (!response.ok || data.error) throw new Error(data.error || "Failed to email Plan Manager.");

      const updated: ShiftAndClaim = { ...claim, status: "pdf_emailed" };
      setClaim(updated);
      onClaimUpdated(updated);
      setBannerMessage({
        type: "success",
        text: data.simulatedDemoSend
          ? `Generated GST-Free PDF Invoice ${claim.invoice_number} for ${data.recipient} (Demo Mode — add RESEND_API_KEY for live dispatch).`
          : `Emailed GST-Free Tax Invoice ${claim.invoice_number} to ${data.recipient} via Resend.`,
      });
    } catch (err) {
      setBannerMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to email PDF invoice to Plan Manager.",
      });
    } finally {
      setSendingEmail(false);
    }
  };

  const handleDownloadPdf = async () => {
    setDownloadingPdf(true);
    setBannerMessage(null);
    try {
      const response = await fetch("/api/claims/generate-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ claim, participant, worker }),
      });
      if (!response.ok) throw new Error("Could not generate PDF invoice.");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${claim.invoice_number}.pdf`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
      setBannerMessage({
        type: "success",
        text: `Downloaded ATO/NDIS GST-Free Tax Invoice ${claim.invoice_number}.pdf.`,
      });
    } catch (err) {
      setBannerMessage({
        type: "error",
        text: err instanceof Error ? err.message : "PDF download failed.",
      });
    } finally {
      setDownloadingPdf(false);
    }
  };

  const inputCls =
    "w-full rounded-xl glass-input px-3 py-2 text-xs focus:outline-none";
  const textareaCls =
    "w-full rounded-2xl glass-input px-3.5 py-2.5 text-xs leading-relaxed focus:outline-none resize-none";

  return (
    <section className="glass-strong rounded-3xl overflow-hidden">
      {/* ── CARD HEADER ─────────────────────────────────────────── */}
      <div
        className="relative flex flex-wrap items-center justify-between gap-2 px-5 py-4"
        style={{
          background:
            "linear-gradient(135deg, rgba(13,148,136,0.12) 0%, rgba(15,23,42,0) 60%)",
          borderBottom: "1px solid rgba(148,163,184,0.10)",
        }}
      >
        <div
          className="pointer-events-none absolute top-0 right-0 h-24 w-32 rounded-bl-full opacity-20"
          style={{ background: "radial-gradient(circle, rgba(99,102,241,0.5) 0%, transparent 70%)" }}
        />
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4.5 w-4.5 text-teal-400 drop-shadow-[0_0_6px_rgba(20,184,166,0.5)]" />
            <h2 className="text-sm font-bold text-white">Shift Review & GST-Free Claim</h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5 pl-6">{invoiceReference}</p>
        </div>
        <span className="glass-pill rounded-full px-3 py-1 text-xs font-bold text-teal-300 tracking-wide">
          {claim.invoice_number} · {claim.status.replace(/_/g, " ").toUpperCase()}
        </span>
      </div>

      <div className="px-5 py-5 space-y-5">

        {/* ── BANNER ────────────────────────────────────────────── */}
        {bannerMessage && (
          <div
            className={`flex items-start gap-2.5 rounded-2xl px-4 py-3 text-xs font-medium backdrop-blur-md ${
              bannerMessage.type === "success"
                ? "text-emerald-200"
                : bannerMessage.type === "warning"
                  ? "text-amber-200"
                  : "text-rose-200"
            }`}
            style={{
              background:
                bannerMessage.type === "success"
                  ? "rgba(6,78,59,0.35)"
                  : bannerMessage.type === "warning"
                    ? "rgba(120,53,15,0.35)"
                    : "rgba(127,29,29,0.35)",
              border:
                bannerMessage.type === "success"
                  ? "1px solid rgba(52,211,153,0.25)"
                  : bannerMessage.type === "warning"
                    ? "1px solid rgba(251,191,36,0.25)"
                    : "1px solid rgba(248,113,113,0.25)",
            }}
          >
            {bannerMessage.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400 mt-0.5" />
            ) : (
              <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" />
            )}
            <span>{bannerMessage.text}</span>
          </div>
        )}

        {/* ── SHIFT TIMING GRID ─────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-2.5">
          {(
            [
              { label: "Shift Date", field: "shift_date", type: "date" },
              { label: "Start (24h)", field: "start_time", type: "time" },
              { label: "End (24h)", field: "end_time", type: "time" },
            ] as const
          ).map(({ label, field, type }) => (
            <div key={field}>
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                {label}
              </label>
              <input
                type={type}
                value={claim[field]}
                onChange={(e) => handleFieldChange(field, e.target.value)}
                className={inputCls}
              />
            </div>
          ))}
        </div>

        {/* ── 3-PART CLINICAL CASE NOTE ─────────────────────────── */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <FileText className="h-3.5 w-3.5 text-teal-400" />
            <h3 className="text-xs font-bold uppercase tracking-widest text-teal-400">
              NDIS Clinical Case Note (3-Part Format)
            </h3>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              1 · Activities & Supports Delivered
            </label>
            <textarea
              rows={3}
              value={claim.case_note_activities}
              onChange={(e) => handleFieldChange("case_note_activities", e.target.value)}
              className={textareaCls}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              2 · Participant Engagement & Choice/Control
            </label>
            <textarea
              rows={2}
              value={claim.case_note_engagement}
              onChange={(e) => handleFieldChange("case_note_engagement", e.target.value)}
              className={textareaCls}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              3 · Alignment with NDIS Plan Goals
            </label>
            <textarea
              rows={2}
              value={claim.case_note_goals}
              onChange={(e) => handleFieldChange("case_note_goals", e.target.value)}
              className={textareaCls}
            />
          </div>
        </div>

        {/* ── LINE ITEMS ────────────────────────────────────────── */}
        <div
          className="space-y-3 pt-4"
          style={{ borderTop: "1px solid rgba(148,163,184,0.10)" }}
        >
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-widest text-teal-400">
              GST-Free Line Items
            </h3>
            <button
              type="button"
              onClick={handleAddTravelLine}
              className="glass inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold text-teal-300 hover:brightness-110 transition-all"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Travel KMs
            </button>
          </div>

          <div className="space-y-2.5">
            {claim.line_items.map((item, idx) => (
              <div
                key={`${item.ndis_code}-${idx}`}
                className="rounded-2xl p-3.5 space-y-2.5"
                style={{
                  background: "rgba(2,6,23,0.50)",
                  border: "1px solid rgba(148,163,184,0.10)",
                }}
              >
                <div className="flex items-center gap-2">
                  {/* Custom select wrapper */}
                  <div className="relative flex-1">
                    <select
                      value={item.ndis_code}
                      onChange={(e) =>
                        handleLineItemCodeChange(idx, e.target.value as AllowedNdisCode)
                      }
                      className="w-full appearance-none rounded-xl glass-input px-3 py-2 pr-8 text-xs font-semibold text-white focus:outline-none"
                    >
                      {ALLOWED_NDIS_CODES.map((code) => {
                        const entry = NDIS_CATALOGUE[code];
                        return (
                          <option key={code} value={code}>
                            {code} — {entry.name} (Cap ${entry.priceCapAud.toFixed(2)}/{entry.unit})
                          </option>
                        );
                      })}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  </div>
                  {claim.line_items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveLineItem(idx)}
                      aria-label="Remove line item"
                      className="rounded-xl p-2 text-slate-500 hover:text-rose-400 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
                      Qty ({item.unit})
                    </label>
                    <input
                      type="number"
                      step="0.25"
                      min="0"
                      value={item.quantity}
                      onChange={(e) => handleLineItemQuantityChange(idx, e.target.value)}
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
                      Rate (Cap ${item.max_price_limit.toFixed(2)})
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max={item.max_price_limit}
                      value={item.unit_price}
                      onChange={(e) => handleLineItemRateChange(idx, e.target.value)}
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
                      Line Total
                    </label>
                    <div
                      className="flex h-[34px] items-center rounded-xl px-3 text-xs font-bold text-teal-300"
                      style={{
                        background: "rgba(13,148,136,0.10)",
                        border: "1px solid rgba(20,184,166,0.20)",
                      }}
                    >
                      ${item.line_total.toFixed(2)}
                    </div>
                  </div>
                </div>

                {/* OCR preview */}
                <div
                  className="rounded-xl px-3 py-2 font-mono text-[10px] text-slate-400"
                  style={{
                    background: "rgba(2,6,23,0.60)",
                    border: "1px solid rgba(148,163,184,0.07)",
                  }}
                >
                  <span className="text-teal-500 font-semibold">OCR: </span>
                  {item.description}
                </div>
              </div>
            ))}
          </div>

          {/* Total summary */}
          <div
            className="flex items-center justify-between rounded-2xl px-5 py-4"
            style={{
              background:
                "linear-gradient(135deg, rgba(13,148,136,0.10) 0%, rgba(2,6,23,0.60) 100%)",
              border: "1px solid rgba(20,184,166,0.20)",
            }}
          >
            <div>
              <p className="text-xs font-semibold text-slate-300">
                Total Claim (GST-Free · EXEMPTOUTPUT)
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {participant.plan_manager_name || "Self-Managed"} ·{" "}
                {participant.plan_manager_email || "No email"}
              </p>
            </div>
            <span
              className="text-2xl font-black tabular-nums drop-shadow-[0_0_12px_rgba(20,184,166,0.40)]"
              style={{
                background: "linear-gradient(135deg, #5eead4 0%, #14b8a6 60%, #0d9488 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              ${claim.total_amount.toFixed(2)}
            </span>
          </div>
        </div>

        {/* ── ACTION BUTTONS ────────────────────────────────────── */}
        <div className="grid grid-cols-1 gap-2.5 pt-1 sm:grid-cols-3">
          {/* Xero */}
          <button
            type="button"
            onClick={handlePushToXero}
            disabled={submittingXero}
            className="flex items-center justify-center gap-2 rounded-2xl px-4 py-3.5 text-xs font-bold text-white transition-all disabled:opacity-40 hover:brightness-110 active:scale-95"
            style={{
              background:
                "linear-gradient(135deg, rgba(13,148,136,0.85) 0%, rgba(5,150,105,0.90) 100%)",
              border: "1px solid rgba(20,184,166,0.30)",
              boxShadow: "0 4px 20px rgba(13,148,136,0.25)",
            }}
          >
            <Send className="h-4 w-4" />
            {submittingXero ? "Syncing…" : "One-Tap Xero Push"}
          </button>

          {/* Email */}
          <button
            type="button"
            onClick={handleEmailPlanManager}
            disabled={sendingEmail}
            className="flex items-center justify-center gap-2 rounded-2xl px-4 py-3.5 text-xs font-bold text-white transition-all disabled:opacity-40 hover:brightness-110 active:scale-95"
            style={{
              background:
                "linear-gradient(135deg, rgba(79,70,229,0.80) 0%, rgba(99,102,241,0.85) 100%)",
              border: "1px solid rgba(129,140,248,0.25)",
              boxShadow: "0 4px 20px rgba(79,70,229,0.22)",
            }}
          >
            <Mail className="h-4 w-4" />
            {sendingEmail ? "Emailing…" : "Email Plan Manager"}
          </button>

          {/* PDF */}
          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={downloadingPdf}
            className="glass flex items-center justify-center gap-2 rounded-2xl px-4 py-3.5 text-xs font-bold text-slate-200 transition-all disabled:opacity-40 hover:brightness-110 active:scale-95"
          >
            <Download className="h-4 w-4" />
            {downloadingPdf ? "Rendering…" : "Download Tax PDF"}
          </button>
        </div>
      </div>
    </section>
  );
}
