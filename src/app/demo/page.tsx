"use client";

// ============================================================================
// ShiftNote AU - Interactive Product Demo & Sales Showcase
// Purpose: Interactive shareable demo for prospective customers, investors,
// and commercial buyers to experience the complete voice-to-claim pipeline.
// ============================================================================

import React, { useState } from "react";
import Link from "next/link";
import {
  Mic,
  Play,
  CheckCircle2,
  FileText,
  Download,
  Calculator,
  ArrowRight,
  ShieldCheck,
  Zap,
  Sparkles,
  TrendingUp,
  Clock,
  DollarSign,
  Send,
  Building2,
  Check,
  ChevronRight,
  Volume2,
} from "lucide-react";
import { NDIS_CATALOGUE, formatInvoiceReference, formatPlanManagerLineDescription } from "@/lib/ndis-catalogue";
import { DEMO_PARTICIPANTS, DEMO_WORKER_PROFILE } from "@/lib/demo-data";
import { InstallPwaPrompt } from "@/components/InstallPwaPrompt";
import type { ShiftAndClaim } from "@/lib/types";

interface DemoScenario {
  id: string;
  badge: string;
  title: string;
  participantName: string;
  ndisNumber: string;
  planManager: string;
  category: "community_access" | "self_care";
  timeBracket: string;
  date: string;
  startTime: string;
  endTime: string;
  hours: number;
  kms: number;
  primaryCode: string;
  travelCode: string | null;
  hourlyRate: number;
  audioTranscript: string;
  clinicalNotes: {
    activities: string;
    engagement: string;
    goals: string;
  };
}

const DEMO_SCENARIOS: DemoScenario[] = [
  {
    id: "scenario-1",
    badge: "Most Common",
    title: "Weekday Community Access & Grocery Mobility",
    participantName: "Liam O'Connor",
    ndisNumber: "430918274",
    planManager: "MyIntegra Plan Management",
    category: "community_access",
    timeBracket: "Weekday Daytime",
    date: "2026-11-03",
    startTime: "09:00",
    endTime: "12:00",
    hours: 3.0,
    kms: 14,
    primaryCode: "04_104_0125_6_1",
    travelCode: "04_799_0125_6_1",
    hourlyRate: 67.56,
    audioTranscript:
      "Just wrapped up a three hour community access shift with Liam O'Connor from 9:00am to 12:00pm. Drove 14 kilometres to Sutherland Leisure Centre for hydrotherapy, then stopped by Woolworths Kirrawee where Liam used his visual shopping checklist to pick up groceries and pay independently at the checkout.",
    clinicalNotes: {
      activities:
        "Provided 3.0 hours of 1:1 community access support (09:00–12:00) with 14 km of provider travel. Accompanied Liam to Sutherland Leisure Centre for scheduled hydrotherapy mobility, followed by a structured grocery shopping routine at Woolworths Kirrawee.",
      engagement:
        "Liam engaged actively and comfortably throughout the session, exercising choice and control when selecting items from his visual grocery list and communicating clearly with the retail cashier.",
      goals:
        "Directly aligned with Goal 1 (independent shopping and budgeting skills) and Goal 2 (community social participation and hydrotherapy mobility).",
    },
  },
  {
    id: "scenario-2",
    badge: "Evening Rate Bracket",
    title: "Weekday Evening Personal Care & Medication Routine",
    participantName: "Chloe Nguyen",
    ndisNumber: "431059382",
    planManager: "NIB Thrive Plan Management",
    category: "self_care",
    timeBracket: "Weekday Evening",
    date: "2026-11-03",
    startTime: "18:30",
    endTime: "20:30",
    hours: 2.0,
    kms: 6,
    primaryCode: "01_015_0107_1_1",
    travelCode: "01_799_0107_1_1",
    hourlyRate: 74.44,
    audioTranscript:
      "Completed a two hour evening self-care shift with Chloe Nguyen tonight from 6:30pm to 8:30pm. Assisted Chloe with shower setup, personal hygiene routine, preparing a healthy dinner, kitchen tidy, and prompted her evening medication schedule. Drove 6 km.",
    clinicalNotes: {
      activities:
        "Delivered 2.0 hours of in-home self-care support during the evening bracket (18:30–20:30) with 6 km provider travel. Assisted with bathroom prep, shower safety supervision, meal preparation, and evening medication routine prompting.",
      engagement:
        "Chloe communicated preferences calmly and directed the sequence of dinner preparation, maintaining independence in setting the table and completing personal grooming with minimal verbal cues.",
      goals:
        "Directly advances Goal 1 (maintaining safe in-home personal care, showering, and evening routine stability) and Goal 2 (nutrition and daily living independence).",
    },
  },
  {
    id: "scenario-3",
    badge: "Weekend Penalty Rate",
    title: "Sunday Social Recreation & Coastal Outing",
    participantName: "Marcus Vance",
    ndisNumber: "430774190",
    planManager: "Self-Managed (Direct Invoice)",
    category: "community_access",
    timeBracket: "Sunday",
    date: "2026-11-01",
    startTime: "10:00",
    endTime: "14:00",
    hours: 4.0,
    kms: 22,
    primaryCode: "04_105_0125_6_1",
    travelCode: "04_799_0125_6_1",
    hourlyRate: 122.56,
    audioTranscript:
      "Finished a four hour Sunday social recreation shift with Marcus Vance from 10am to 2pm. Drove 22 kilometres to Cronulla for an ocean walk, social lunch, and community interaction. Marcus practised ordering lunch and engaging in public social spaces.",
    clinicalNotes: {
      activities:
        "Provided 4.0 hours of Sunday 1:1 community participation (10:00–14:00) including 22 km of provider travel. Supported Marcus during an outdoor mobility walk along Cronulla esplanade and supported an independent cafe dining experience.",
      engagement:
        "Marcus displayed high levels of social engagement and confidence, ordering food independently and navigating crowded public areas with relaxed posture and active participation.",
      goals:
        "Directly progresses Goal 1 (weekend community fitness and social recreation) and Goal 2 (social communication and independent community navigation).",
    },
  },
];

export default function DemoShowcasePage() {
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>("scenario-1");
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationStep, setSimulationStep] = useState<number>(0);
  const [hasExtracted, setHasExtracted] = useState<boolean>(true);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  // ROI Calculator states
  const [shiftsPerWeek, setShiftsPerWeek] = useState<number>(10);
  const [hourlyRate, setHourlyRate] = useState<number>(67.56);
  const [adminMinutesPerShift, setAdminMinutesPerShift] = useState<number>(30);

  const scenario = DEMO_SCENARIOS.find((s) => s.id === selectedScenarioId) ?? DEMO_SCENARIOS[0]!;

  const primaryEntry = NDIS_CATALOGUE[scenario.primaryCode as keyof typeof NDIS_CATALOGUE];
  const travelEntry = scenario.travelCode
    ? NDIS_CATALOGUE[scenario.travelCode as keyof typeof NDIS_CATALOGUE]
    : null;

  const labourTotal = Math.round(scenario.hours * scenario.hourlyRate * 100) / 100;
  const travelTotal = travelEntry
    ? Math.round(scenario.kms * travelEntry.priceCapAud * 100) / 100
    : 0;
  const grandTotal = Math.round((labourTotal + travelTotal) * 100) / 100;

  // Run interactive simulation
  const handleRunSimulation = () => {
    setIsSimulating(true);
    setHasExtracted(false);
    setSimulationStep(1);

    setTimeout(() => {
      setSimulationStep(2);
      setTimeout(() => {
        setSimulationStep(3);
        setTimeout(() => {
          setSimulationStep(4);
          setIsSimulating(false);
          setHasExtracted(true);
        }, 500);
      }, 500);
    }, 600);
  };

  // Live PDF generator
  const handleDownloadDemoPdf = async () => {
    setDownloadingPdf(true);
    try {
      const claimPayload: ShiftAndClaim = {
        id: `demo-${scenario.id}`,
        worker_id: DEMO_WORKER_PROFILE.id,
        participant_id: "demo-part",
        shift_date: scenario.date,
        start_time: scenario.startTime,
        end_time: scenario.endTime,
        duration_hours: scenario.hours,
        km_travelled: scenario.kms,
        raw_transcript: scenario.audioTranscript,
        case_note_activities: scenario.clinicalNotes.activities,
        case_note_engagement: scenario.clinicalNotes.engagement,
        case_note_goals: scenario.clinicalNotes.goals,
        invoice_number: `INV-${scenario.date.replace(/-/g, "")}-DEMO`,
        xero_invoice_id: null,
        status: "approved",
        created_at: new Date().toISOString(),
        line_items: [
          {
            ndis_code: scenario.primaryCode as any,
            support_name: primaryEntry.name,
            description: formatPlanManagerLineDescription(
              scenario.primaryCode as any,
              primaryEntry.name,
              scenario.date,
              scenario.startTime,
              scenario.endTime
            ),
            unit: primaryEntry.unit,
            quantity: scenario.hours,
            unit_price: scenario.hourlyRate,
            max_price_limit: primaryEntry.priceCapAud,
            line_total: labourTotal,
            gst_code: "EXEMPTOUTPUT",
          },
          ...(travelEntry
            ? [
                {
                  ndis_code: scenario.travelCode as any,
                  support_name: travelEntry.name,
                  description: formatPlanManagerLineDescription(
                    scenario.travelCode as any,
                    travelEntry.name,
                    scenario.date,
                    scenario.startTime,
                    scenario.endTime
                  ),
                  unit: travelEntry.unit,
                  quantity: scenario.kms,
                  unit_price: travelEntry.priceCapAud,
                  max_price_limit: travelEntry.priceCapAud,
                  line_total: travelTotal,
                  gst_code: "EXEMPTOUTPUT" as const,
                },
              ]
            : []),
        ],
        total_amount: grandTotal,
      };

      const participantPayload = {
        id: "demo-part",
        worker_id: DEMO_WORKER_PROFILE.id,
        full_name: scenario.participantName,
        ndis_number: scenario.ndisNumber,
        funding_type: "plan_managed" as const,
        plan_manager_name: scenario.planManager,
        plan_manager_email: "claims@planmanager.com.au",
        xero_contact_id: null,
        ndis_goals_summary: scenario.clinicalNotes.goals,
      };

      const res = await fetch("/api/claims/generate-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          claim: claimPayload,
          participant: participantPayload,
          worker: DEMO_WORKER_PROFILE,
        }),
      });

      if (!res.ok) throw new Error("Failed to generate PDF");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ShiftNote_AU_${scenario.participantName.replace(/\s+/g, "_")}_NDIS_Invoice.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert("PDF generation failed: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setDownloadingPdf(false);
    }
  };

  // ROI computations
  const weeklyAdminMinutes = shiftsPerWeek * adminMinutesPerShift;
  const monthlyAdminHours = Math.round((weeklyAdminMinutes * 4.333) / 60);
  const monthlyLostAud = Math.round(monthlyAdminHours * hourlyRate);
  const annualLostAud = monthlyLostAud * 12;
  const subscriptionCost = 29;
  const monthlyRoiPercent = Math.round(((monthlyLostAud - subscriptionCost) / subscriptionCost) * 100);

  return (
    <div className="space-y-8 pb-12">
      {/* ── HERO BANNER ────────────────────────────────────────────── */}
      <section className="glass-strong relative overflow-hidden rounded-3xl p-6 md:p-8 space-y-4">
        <div
          className="pointer-events-none absolute -top-16 -right-16 h-48 w-48 rounded-full opacity-30 blur-2xl"
          style={{ background: "radial-gradient(circle, rgba(13,148,136,0.6) 0%, transparent 70%)" }}
        />

        <div className="flex flex-wrap items-center gap-2">
          <span className="glass-pill rounded-full px-3 py-1 text-xs font-bold text-teal-300">
            Interactive Product Demo
          </span>
          <span className="rounded-full px-3 py-1 text-xs font-bold bg-amber-500/10 text-amber-300 border border-amber-500/20">
            Commercial Ready
          </span>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight leading-tight">
            ShiftNote AU: From 45-Second Voice Note to Audit-Proof NDIS Case Notes & GST-Free Tax Invoices
          </h1>
          <p className="text-sm md:text-base text-slate-300 max-w-2xl leading-relaxed">
            Designed specifically for Australia&apos;s 150,000+ independent NDIS support workers and sole traders.
            Zero complex agency software. Multimodal Gemini 4 Argon extracts exact day/time NDIS price-cap codes,
            crafts non-judgmental Quality and Safeguards Commission notes, and dispatches ATO-compliant GST-free invoices in seconds.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <InstallPwaPrompt />
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-2xl px-5 py-2.5 text-xs font-bold text-white shadow-lg transition-all hover:brightness-110 active:scale-95"
            style={{
              background: "linear-gradient(135deg, #0d9488 0%, #059669 100%)",
              boxShadow: "0 4px 16px rgba(13,148,136,0.3)",
            }}
          >
            Launch Live App Dashboard
            <ArrowRight className="h-4 w-4" />
          </Link>
          <a
            href="#pricing"
            className="glass rounded-2xl px-5 py-2.5 text-xs font-semibold text-slate-200 hover:text-white transition-all"
          >
            View Pricing &amp; Commercial Tiers
          </a>
        </div>
      </section>

      {/* ── INTERACTIVE WORKFLOW SANDBOX ──────────────────────────── */}
      <section className="glass rounded-3xl p-6 md:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-teal-400" />
              <h2 className="text-lg font-bold text-white">Interactive Feature Sandbox</h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Select an Australian NDIS support shift scenario below to test the instant extraction pipeline.
            </p>
          </div>
          <span className="glass-pill self-start sm:self-auto rounded-xl px-3 py-1 text-xs font-mono text-teal-300">
            3 Real Scenarios
          </span>
        </div>

        {/* Scenario Switcher Tabs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {DEMO_SCENARIOS.map((s) => {
            const isSelected = s.id === scenario.id;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  setSelectedScenarioId(s.id);
                  setHasExtracted(true);
                }}
                className={`text-left rounded-2xl p-4 transition-all duration-200 relative overflow-hidden ${
                  isSelected
                    ? "glass-teal border-teal-500/50 shadow-glass-teal"
                    : "glass hover:border-slate-600/40 opacity-80 hover:opacity-100"
                }`}
              >
                <div className="flex items-center justify-between text-[11px] font-bold mb-1.5">
                  <span className="text-teal-300">{s.participantName}</span>
                  <span className="rounded-full px-2 py-0.5 text-[9px] uppercase tracking-wider bg-slate-800 text-slate-300">
                    {s.badge}
                  </span>
                </div>
                <h3 className="text-xs font-semibold text-white line-clamp-1">{s.title}</h3>
                <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                  <span>{s.hours}h · {s.kms}km</span>
                  <span className="text-slate-300 font-semibold">{s.timeBracket}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Active Scenario Card */}
        <div className="glass-strong rounded-3xl p-5 md:p-6 space-y-5">
          {/* Audio voice memo simulation block */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-300 flex items-center gap-1.5">
                <Volume2 className="h-4 w-4 text-teal-400" />
                Raw Voice Recording Transcript ({scenario.participantName})
              </span>
              <span className="text-slate-500 font-mono">
                {scenario.startTime}–{scenario.endTime} ({scenario.date})
              </span>
            </div>
            <div
              className="rounded-2xl p-4 text-xs text-slate-200 leading-relaxed italic"
              style={{ background: "rgba(2, 6, 23, 0.65)", border: "1px solid rgba(148,163,184,0.12)" }}
            >
              &ldquo;{scenario.audioTranscript}&rdquo;
            </div>
          </div>

          {/* Action Trigger Button */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleRunSimulation}
              disabled={isSimulating}
              className="inline-flex items-center gap-2 rounded-2xl px-5 py-2.5 text-xs font-bold text-white transition-all hover:brightness-110 active:scale-95 disabled:opacity-50"
              style={{
                background: "linear-gradient(135deg, #0d9488 0%, #059669 100%)",
                boxShadow: "0 4px 16px rgba(13,148,136,0.3)",
              }}
            >
              <Zap className="h-4 w-4" />
              {isSimulating ? "Gemini 4 Argon Processing..." : "Re-Run Multimodal NDIS Extraction"}
            </button>

            <button
              type="button"
              onClick={handleDownloadDemoPdf}
              disabled={downloadingPdf}
              className="glass inline-flex items-center gap-2 rounded-2xl px-5 py-2.5 text-xs font-bold text-teal-300 hover:text-white transition-all disabled:opacity-50"
            >
              <Download className="h-4 w-4" />
              {downloadingPdf ? "Rendering PDF..." : "Download Sample Tax Invoice PDF"}
            </button>
          </div>

          {/* Simulation Progress Stepper */}
          {isSimulating && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
              <div
                className={`rounded-xl p-2.5 text-[11px] transition-all ${
                  simulationStep >= 1 ? "glass-teal text-teal-200" : "glass text-slate-500"
                }`}
              >
                1. Voice &amp; Timing
              </div>
              <div
                className={`rounded-xl p-2.5 text-[11px] transition-all ${
                  simulationStep >= 2 ? "glass-teal text-teal-200" : "glass text-slate-500"
                }`}
              >
                2. NDIS Rate Bracket
              </div>
              <div
                className={`rounded-xl p-2.5 text-[11px] transition-all ${
                  simulationStep >= 3 ? "glass-teal text-teal-200" : "glass text-slate-500"
                }`}
              >
                3. Clinical Case Notes
              </div>
              <div
                className={`rounded-xl p-2.5 text-[11px] transition-all ${
                  simulationStep >= 4 ? "glass-teal text-teal-200" : "glass text-slate-500"
                }`}
              >
                4. GST-Free Invoicing
              </div>
            </div>
          )}

          {/* Results: Clinical Case Notes & Line Items */}
          {hasExtracted && !isSimulating && (
            <div className="space-y-5 pt-2">
              {/* 3-Part Clinical Notes */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-teal-400" />
                    NDIS Quality &amp; Safeguards Commission 3-Part Clinical Case Note
                  </h4>
                  <span className="glass-pill rounded-full px-2 py-0.5 text-[10px] text-teal-300 font-bold uppercase">
                    Audit Compliant
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div
                    className="rounded-2xl p-4 space-y-1.5"
                    style={{ background: "rgba(2, 6, 23, 0.5)", border: "1px solid rgba(148,163,184,0.1)" }}
                  >
                    <span className="text-[11px] font-bold text-teal-400 uppercase tracking-wider">
                      1. Activities Delivered
                    </span>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {scenario.clinicalNotes.activities}
                    </p>
                  </div>

                  <div
                    className="rounded-2xl p-4 space-y-1.5"
                    style={{ background: "rgba(2, 6, 23, 0.5)", border: "1px solid rgba(148,163,184,0.1)" }}
                  >
                    <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider">
                      2. Participant Engagement
                    </span>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {scenario.clinicalNotes.engagement}
                    </p>
                  </div>

                  <div
                    className="rounded-2xl p-4 space-y-1.5"
                    style={{ background: "rgba(2, 6, 23, 0.5)", border: "1px solid rgba(148,163,184,0.1)" }}
                  >
                    <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">
                      3. NDIS Plan Goals Progress
                    </span>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {scenario.clinicalNotes.goals}
                    </p>
                  </div>
                </div>
              </div>

              {/* NDIS Line Items Table */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                    <FileText className="h-4 w-4 text-teal-400" />
                    NDIS Core Supports Line Items &amp; Rate Cap Validation
                  </h4>
                  <span className="text-xs font-bold text-teal-300">
                    Total: ${grandTotal.toFixed(2)} AUD (GST-Free)
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-700/60 text-slate-400 font-medium">
                        <th className="pb-2">NDIS Code</th>
                        <th className="pb-2">Description</th>
                        <th className="pb-2 text-right">Qty</th>
                        <th className="pb-2 text-right">Cap / Rate</th>
                        <th className="pb-2 text-right">Total</th>
                        <th className="pb-2 text-center">GST Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      <tr>
                        <td className="py-2.5 font-mono text-teal-300 font-semibold">{scenario.primaryCode}</td>
                        <td className="py-2.5 text-slate-200">{primaryEntry.name}</td>
                        <td className="py-2.5 text-right font-mono">{scenario.hours}h</td>
                        <td className="py-2.5 text-right font-mono">${scenario.hourlyRate.toFixed(2)}</td>
                        <td className="py-2.5 text-right font-mono font-bold text-white">${labourTotal.toFixed(2)}</td>
                        <td className="py-2.5 text-center">
                          <span className="rounded px-1.5 py-0.5 text-[10px] font-mono bg-teal-500/10 text-teal-300 font-bold border border-teal-500/20">
                            EXEMPTOUTPUT
                          </span>
                        </td>
                      </tr>
                      {travelEntry && (
                        <tr>
                          <td className="py-2.5 font-mono text-teal-300 font-semibold">{scenario.travelCode}</td>
                          <td className="py-2.5 text-slate-200">{travelEntry.name}</td>
                          <td className="py-2.5 text-right font-mono">{scenario.kms}km</td>
                          <td className="py-2.5 text-right font-mono">${travelEntry.priceCapAud.toFixed(2)}</td>
                          <td className="py-2.5 text-right font-mono font-bold text-white">${travelTotal.toFixed(2)}</td>
                          <td className="py-2.5 text-center">
                            <span className="rounded px-1.5 py-0.5 text-[10px] font-mono bg-teal-500/10 text-teal-300 font-bold border border-teal-500/20">
                              EXEMPTOUTPUT
                            </span>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 text-[11px] text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-teal-400" />
                    <span>Plan Manager Reference: <strong>{formatInvoiceReference(scenario.ndisNumber, scenario.participantName)}</strong></span>
                  </div>
                  <span>Payment Terms: 7 Days Remittance to BSB {DEMO_WORKER_PROFILE.bsb}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── INTERACTIVE ROI CALCULATOR ────────────────────────────── */}
      <section className="glass rounded-3xl p-6 md:p-8 space-y-6">
        <div className="flex items-center gap-2.5">
          <Calculator className="h-5 w-5 text-teal-400" />
          <h2 className="text-lg font-bold text-white">Interactive Support Worker ROI Calculator</h2>
        </div>
        <p className="text-xs text-slate-400 -mt-3 max-w-2xl">
          Independent NDIS support workers lose 30 to 45 minutes of unbillable personal time per shift writing case notes and formatting invoices. Calculate how much money ShiftNote AU recovers for your practice.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Controls */}
          <div className="space-y-4 md:col-span-2">
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <label className="font-semibold text-slate-300">Shifts Completed Per Week</label>
                <span className="font-mono text-teal-300 font-bold">{shiftsPerWeek} shifts / wk</span>
              </div>
              <input
                type="range"
                min="1"
                max="25"
                value={shiftsPerWeek}
                onChange={(e) => setShiftsPerWeek(Number(e.target.value))}
                className="w-full accent-teal-500 h-2 bg-slate-800 rounded-lg cursor-pointer"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <label className="font-semibold text-slate-300">Your Average Hourly Rate (AUD)</label>
                <span className="font-mono text-teal-300 font-bold">${hourlyRate.toFixed(2)}/hr</span>
              </div>
              <input
                type="range"
                min="50"
                max="120"
                step="1"
                value={hourlyRate}
                onChange={(e) => setHourlyRate(Number(e.target.value))}
                className="w-full accent-teal-500 h-2 bg-slate-800 rounded-lg cursor-pointer"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <label className="font-semibold text-slate-300">Minutes Spent on Admin Per Shift</label>
                <span className="font-mono text-teal-300 font-bold">{adminMinutesPerShift} mins</span>
              </div>
              <input
                type="range"
                min="15"
                max="60"
                step="5"
                value={adminMinutesPerShift}
                onChange={(e) => setAdminMinutesPerShift(Number(e.target.value))}
                className="w-full accent-teal-500 h-2 bg-slate-800 rounded-lg cursor-pointer"
              />
            </div>
          </div>

          {/* Results Card */}
          <div
            className="rounded-3xl p-5 space-y-4 flex flex-col justify-between"
            style={{
              background: "linear-gradient(145deg, rgba(13,148,136,0.15) 0%, rgba(2,6,23,0.8) 100%)",
              border: "1px solid rgba(20,184,166,0.25)",
            }}
          >
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-teal-300">
                Monthly Unbilled Time Recovered
              </span>
              <div className="text-3xl font-black text-white mt-1">
                {monthlyAdminHours} <span className="text-sm font-normal text-slate-400">hours/month</span>
              </div>
            </div>

            <div className="border-t border-slate-700/60 pt-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-teal-300">
                Annual Time Value Saved
              </span>
              <div className="text-2xl font-black text-emerald-400 mt-1">
                ${annualLostAud.toLocaleString()} <span className="text-xs font-normal text-slate-400">AUD</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Against a $29/mo ($348/yr) ShiftNote Pro plan: <strong className="text-teal-300">{monthlyRoiPercent}% ROI</strong>
              </p>
            </div>

            <Link
              href="/dashboard"
              className="w-full text-center rounded-2xl py-2.5 text-xs font-bold text-white transition-all hover:brightness-110"
              style={{ background: "linear-gradient(135deg, #0d9488 0%, #059669 100%)" }}
            >
              Start Free Trial Now
            </Link>
          </div>
        </div>
      </section>

      {/* ── COMMERCIAL SALE & SUBSCRIPTION DYNAMIC ───────────────── */}
      <section id="pricing" className="glass rounded-3xl p-6 md:p-8 space-y-6">
        <div className="text-center space-y-2 max-w-xl mx-auto">
          <span className="glass-pill rounded-full px-3 py-1 text-xs font-bold text-teal-300 uppercase tracking-wider">
            Monetization Architecture
          </span>
          <h2 className="text-xl md:text-2xl font-black text-white">
            Subscription Pricing &amp; Commercial Sale Structure
          </h2>
          <p className="text-xs text-slate-400">
            Engineered for high SaaS margins, near-zero churn among Australian NDIS sole traders, and scalable agency enterprise expansion.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
          {/* Tier 1: Free Starter */}
          <div className="glass rounded-3xl p-6 space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Solo Starter
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-black text-white">$0</span>
                <span className="text-xs text-slate-400">/ forever</span>
              </div>
              <p className="text-xs text-slate-400">
                Perfect for newly registering sole traders or low-volume casual support workers.
              </p>
              <ul className="space-y-2 text-xs text-slate-300 pt-2">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-teal-400 shrink-0" />
                  3 Voice-to-Claim shifts per month
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-teal-400 shrink-0" />
                  Deterministic NDIS rate-cap engine
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-teal-400 shrink-0" />
                  3-Part Quality &amp; Safeguards case notes
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-teal-400 shrink-0" />
                  In-memory PDF invoice generation
                </li>
              </ul>
            </div>
            <Link
              href="/dashboard"
              className="glass w-full text-center rounded-2xl py-2.5 text-xs font-bold text-slate-200 hover:text-white transition-all"
            >
              Get Started Free
            </Link>
          </div>

          {/* Tier 2: Solo Pro (Core Revenue Engine) */}
          <div
            className="rounded-3xl p-6 space-y-4 flex flex-col justify-between relative overflow-hidden"
            style={{
              background: "linear-gradient(145deg, rgba(13,148,136,0.2) 0%, rgba(2,6,23,0.85) 100%)",
              border: "2px solid rgba(20,184,166,0.4)",
              boxShadow: "0 8px 32px rgba(13,148,136,0.25)",
            }}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-teal-300">
                  Solo Pro (Sole Trader)
                </span>
                <span className="rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase bg-teal-500 text-slate-950">
                  Recommended
                </span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-black text-white">$29</span>
                <span className="text-xs text-slate-400">AUD / month</span>
              </div>
              <p className="text-xs text-teal-200/80">
                100% Australian ATO tax-deductible sole trader business software expense.
              </p>
              <ul className="space-y-2 text-xs text-slate-200 pt-2">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-teal-400 shrink-0" />
                  <strong>Unlimited</strong> Voice-to-Claim shifts
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-teal-400 shrink-0" />
                  Multimodal Gemini 4 Argon extraction
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-teal-400 shrink-0" />
                  Direct Plan Manager PDF invoice emailing
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-teal-400 shrink-0" />
                  1-Click Xero API ACCREC synchronization
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-teal-400 shrink-0" />
                  Full NDIS Audit History CSV export
                </li>
              </ul>
            </div>
            <Link
              href="/dashboard"
              className="w-full text-center rounded-2xl py-2.5 text-xs font-bold text-white transition-all hover:brightness-110 shadow-lg"
              style={{ background: "linear-gradient(135deg, #0d9488 0%, #059669 100%)" }}
            >
              Start 14-Day Free Trial
            </Link>
          </div>

          {/* Tier 3: Agency & Asset Sale */}
          <div className="glass rounded-3xl p-6 space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Agency Hub / Source Buyout
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-black text-white">$79</span>
                <span className="text-xs text-slate-400">AUD / mo (or $4,999 IP buyout)</span>
              </div>
              <p className="text-xs text-slate-400">
                For boutique support provider agencies (up to 5 workers) or turnkey software acquisition.
              </p>
              <ul className="space-y-2 text-xs text-slate-300 pt-2">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-teal-400 shrink-0" />
                  Multi-worker roster &amp; consolidated billing
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-teal-400 shrink-0" />
                  Centralised Plan Manager dispatch
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-teal-400 shrink-0" />
                  White-label branding on PDF invoices
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-teal-400 shrink-0" />
                  Full Intellectual Property buyout available
                </li>
              </ul>
            </div>
            <a
              href="mailto:contact@shiftnote.com.au?subject=Commercial%20Agency%20Inquiry"
              className="glass w-full text-center rounded-2xl py-2.5 text-xs font-bold text-slate-200 hover:text-white transition-all"
            >
              Contact Sales / Acquire Code
            </a>
          </div>
        </div>
      </section>

      {/* ── FOOTER CALLOUT ────────────────────────────────────────── */}
      <div className="glass rounded-3xl p-6 text-center space-y-3">
        <h3 className="text-sm font-bold text-white">
          Ready to experience the live voice recording in action?
        </h3>
        <p className="text-xs text-slate-400 max-w-lg mx-auto">
          Open the ShiftNote AU Dashboard in Demo Mode to record your own microphone audio or simulate immediate post-shift case notes.
        </p>
        <div className="pt-1">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-2xl px-6 py-2.5 text-xs font-bold text-white shadow-lg transition-all hover:brightness-110"
            style={{ background: "linear-gradient(135deg, #0d9488 0%, #059669 100%)" }}
          >
            Launch Mobile Dashboard
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}

