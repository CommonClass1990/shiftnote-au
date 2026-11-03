"use client";

// ============================================================================
// ShiftNote AU - Mobile-First Voice-to-Claim Dashboard (Glass UI Redesign)
// ============================================================================

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { InstallPwaPrompt } from "@/components/InstallPwaPrompt";
import {
  Mic,
  Square,
  Sparkles,
  CheckCircle2,
  Link2,
  Shield,
  Volume2,
  Loader2,
  Zap,
} from "lucide-react";
import { ShiftReviewCard } from "@/components/ShiftReviewCard";
import {
  DEMO_PARTICIPANTS,
  DEMO_WORKER_PROFILE,
  SAMPLE_VOICE_TRANSCRIPTS,
} from "@/lib/demo-data";
import {
  getDemoModeEnabled,
  getStoredParticipants,
  getStoredWorkerProfile,
  setDemoModeEnabled,
  upsertStoredShift,
} from "@/lib/local-store";
import type { Participant, ShiftAndClaim, WorkerProfile } from "@/lib/types";

export default function DashboardPage() {
  const [demoMode, setDemoMode] = useState<boolean>(true);
  const [worker, setWorker] = useState<WorkerProfile>(DEMO_WORKER_PROFILE);
  const [participants, setParticipants] =
    useState<Participant[]>(DEMO_PARTICIPANTS);
  const [selectedParticipantId, setSelectedParticipantId] = useState<string>(
    DEMO_PARTICIPANTS[0]!.id
  );

  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingSeconds, setRecordingSeconds] = useState<number>(0);
  const [waveformBars, setWaveformBars] = useState<number[]>([
    24, 40, 65, 35, 80, 50, 30, 70, 45, 60, 35, 55, 28, 72, 48,
  ]);
  const [isProcessingVoice, setIsProcessingVoice] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activeClaimDraft, setActiveClaimDraft] =
    useState<ShiftAndClaim | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setDemoMode(getDemoModeEnabled());
    setWorker(getStoredWorkerProfile());
    const storedParticipants = getStoredParticipants();
    setParticipants(storedParticipants);
    if (storedParticipants[0]) {
      setSelectedParticipantId(storedParticipants[0].id);
    }
  }, []);

  const selectedParticipant =
    participants.find((p) => p.id === selectedParticipantId) ??
    participants[0] ??
    DEMO_PARTICIPANTS[0]!;

  const handleToggleDemoMode = () => {
    const next = !demoMode;
    setDemoMode(next);
    setDemoModeEnabled(next);
  };

  const startRecording = async () => {
    setErrorMsg(null);
    if (isRecording || isProcessingVoice) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];

      recorder.ondataavailable = (event: BlobEvent) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        const audioBlob = new Blob(audioChunksRef.current, {
          type: recorder.mimeType || "audio/webm",
        });
        await submitVoiceBlob(audioBlob);
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);

      timerIntervalRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
        setWaveformBars((prev) =>
          prev.map(() => Math.floor(15 + Math.random() * 85))
        );
      }, 150);
    } catch {
      const syntheticBlob = new Blob(["demo-audio-payload"], {
        type: "audio/webm",
      });
      const sampleText =
        SAMPLE_VOICE_TRANSCRIPTS[selectedParticipant.id] ??
        SAMPLE_VOICE_TRANSCRIPTS["11111111-1111-4111-8111-111111111101"]!;
      await submitVoiceBlob(syntheticBlob, sampleText);
    }
  };

  const stopRecording = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  const submitVoiceBlob = async (
    audioBlob: Blob,
    transcriptOverride?: string
  ) => {
    setIsProcessingVoice(true);
    setErrorMsg(null);

    try {
      const formData = new FormData();
      formData.append("audioBlob", audioBlob, "shift-note.webm");
      formData.append("participantId", selectedParticipant.id);
      formData.append("participantName", selectedParticipant.full_name);
      formData.append("ndisNumber", selectedParticipant.ndis_number);
      formData.append(
        "participantGoals",
        selectedParticipant.ndis_goals_summary
      );
      formData.append("referenceDate", "2026-11-02");

      if (transcriptOverride) {
        formData.append("transcriptOverride", transcriptOverride);
      } else if (demoMode && audioBlob.size < 256) {
        formData.append(
          "transcriptOverride",
          SAMPLE_VOICE_TRANSCRIPTS[selectedParticipant.id] ?? ""
        );
      }

      const response = await fetch("/api/process-voice", {
        method: "POST",
        body: formData,
      });

      const data = (await response.json()) as {
        error?: string;
        claimDraft?: {
          participant_id: string;
          invoice_number: string;
          shift_date: string;
          start_time: string;
          end_time: string;
          duration_hours: number;
          km_travelled: number;
          raw_transcript: string;
          case_note_activities: string;
          case_note_engagement: string;
          case_note_goals: string;
          line_items: ShiftAndClaim["line_items"];
          total_amount: number;
        };
      };

      if (!response.ok || !data.claimDraft) {
        throw new Error(data.error || "Voice processing failed.");
      }

      const newClaim: ShiftAndClaim = {
        id:
          typeof crypto !== "undefined" && "randomUUID" in crypto
            ? crypto.randomUUID()
            : `shift-${Date.now()}`,
        worker_id: worker.id,
        participant_id: selectedParticipant.id,
        shift_date: data.claimDraft.shift_date,
        start_time: data.claimDraft.start_time,
        end_time: data.claimDraft.end_time,
        duration_hours: data.claimDraft.duration_hours,
        km_travelled: data.claimDraft.km_travelled,
        raw_transcript: data.claimDraft.raw_transcript,
        case_note_activities: data.claimDraft.case_note_activities,
        case_note_engagement: data.claimDraft.case_note_engagement,
        case_note_goals: data.claimDraft.case_note_goals,
        line_items: data.claimDraft.line_items,
        total_amount: data.claimDraft.total_amount,
        invoice_number: data.claimDraft.invoice_number,
        xero_invoice_id: null,
        status: "draft",
        created_at: new Date().toISOString(),
      };

      upsertStoredShift(newClaim);
      setActiveClaimDraft(newClaim);
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : "Failed to process voice note."
      );
    } finally {
      setIsProcessingVoice(false);
    }
  };

  const handleSimulateDemoVoiceNote = async () => {
    const sampleBlob = new Blob(["simulated-post-shift-voice-audio"], {
      type: "audio/webm",
    });
    const transcript =
      SAMPLE_VOICE_TRANSCRIPTS[selectedParticipant.id] ??
      SAMPLE_VOICE_TRANSCRIPTS["11111111-1111-4111-8111-111111111101"]!;
    await submitVoiceBlob(sampleBlob, transcript);
  };

  const formatTimer = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  return (
    <div className="space-y-4">

      {/* ── TOP APP BAR ──────────────────────────────────────────── */}
      <header className="glass relative overflow-hidden rounded-3xl px-5 py-4">
        {/* Subtle teal gradient accent top-left */}
        <div
          className="pointer-events-none absolute -top-10 -left-10 h-32 w-48 rounded-full opacity-30"
          style={{ background: "radial-gradient(circle, rgba(13,148,136,0.45) 0%, transparent 70%)" }}
        />
        <div className="relative flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal-400 opacity-60" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-teal-400" />
              </span>
              <h1 className="text-base font-black tracking-tight text-white drop-shadow-sm">
                ShiftNote AU
              </h1>
              <span className="glass-pill rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wider text-teal-300 uppercase">
                NDIS GST-Free
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-400 pl-5">
              {worker.business_name} · ABN {worker.abn}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <InstallPwaPrompt />
            <Link
              href="/demo"
              className="glass rounded-full px-3 py-1.5 text-xs font-semibold text-teal-300 hover:text-white transition-all inline-flex items-center gap-1.5"
            >
              <Sparkles className="h-3.5 w-3.5 text-teal-400" />
              <span>Demo Tour</span>
            </Link>
            <button
              type="button"
              onClick={handleToggleDemoMode}
              className={`relative inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold transition-all duration-300 ${
                demoMode ? "glass-amber text-amber-300" : "glass text-slate-400"
              }`}
            >
              {demoMode ? "Demo ON" : "Demo OFF"}
            </button>
          </div>
        </div>
      </header>

      {/* ── ENGINE / XERO STATUS STRIP ───────────────────────────── */}
      <div className="glass rounded-2xl px-4 py-2.5 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 text-slate-400">
          <Zap className="h-3.5 w-3.5 text-teal-400 shrink-0" />
          <span>
            <span className="font-semibold text-slate-200">gemini-4-argon</span>
            {" "}· thinking: medium ·{" "}
            <span className="font-semibold text-teal-300">EXEMPTOUTPUT</span>
          </span>
        </div>
        <a
          href="/api/xero/connect"
          className="glass-pill inline-flex items-center gap-1 rounded-xl px-3 py-1 text-[11px] font-semibold text-teal-300 hover:border-teal-400/40 transition-all"
        >
          <Link2 className="h-3 w-3" />
          Connect Xero
        </a>
      </div>

      {/* ── STEP 1: PARTICIPANT PILL SELECTOR ───────────────────── */}
      <section className="glass rounded-3xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-5 w-1 rounded-full bg-gradient-to-b from-teal-400 to-teal-600" />
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-300">
              Participant
            </h2>
          </div>
          <span className="glass-pill rounded-lg px-2 py-0.5 text-[11px] font-mono font-semibold text-teal-300">
            NDIS# {selectedParticipant.ndis_number}
          </span>
        </div>

        {/* Participant pills */}
        <div className="flex flex-wrap gap-2">
          {participants.map((p) => {
            const isSelected = p.id === selectedParticipant.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setSelectedParticipantId(p.id)}
                className={`rounded-2xl px-4 py-1.5 text-xs font-semibold transition-all duration-200 ${
                  isSelected
                    ? "glass-pill-active text-teal-200 shadow-lg"
                    : "glass text-slate-300 hover:text-slate-100"
                }`}
              >
                {p.full_name}
              </button>
            );
          })}
        </div>

        {/* Participant details */}
        <div
          className="relative rounded-2xl p-3.5 space-y-2 overflow-hidden"
          style={{
            background: "rgba(2, 6, 23, 0.50)",
            border: "1px solid rgba(148,163,184,0.09)",
          }}
        >
          <div
            className="pointer-events-none absolute -bottom-4 -right-4 h-20 w-20 rounded-full opacity-20"
            style={{ background: "radial-gradient(circle, rgba(13,148,136,0.6) 0%, transparent 70%)" }}
          />
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">
              Plan Manager:{" "}
              <strong className="text-slate-200">
                {selectedParticipant.plan_manager_name || "Self-Managed"}
              </strong>
            </span>
            <span
              className="rounded-lg px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-teal-300"
              style={{ background: "rgba(20,184,166,0.10)", border: "1px solid rgba(20,184,166,0.20)" }}
            >
              {selectedParticipant.funding_type.replace(/_/g, " ")}
            </span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            <span className="font-semibold text-teal-400">Goals: </span>
            {selectedParticipant.ndis_goals_summary}
          </p>
        </div>
      </section>

      {/* ── STEP 2: VOICE RECORDER ──────────────────────────────── */}
      <section className="glass-strong relative rounded-3xl overflow-hidden p-6 text-center space-y-5">
        {/* Background orb decoration */}
        <div
          className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 h-48 w-48 rounded-full opacity-20 blur-3xl"
          style={{
            background: isRecording
              ? "radial-gradient(circle, rgba(239,68,68,0.7) 0%, transparent 70%)"
              : "radial-gradient(circle, rgba(13,148,136,0.7) 0%, transparent 70%)",
            transition: "background 0.6s ease",
          }}
        />

        <div className="relative space-y-0.5">
          <h2 className="text-sm font-bold text-white">
            2. Record Post-Shift Voice Note
          </h2>
          <p className="text-xs text-slate-500">
            Hold button · dictate hours, activities, travel KMs
          </p>
        </div>

        {/* Animated waveform */}
        <div className="relative flex flex-col items-center justify-center gap-2">
          <div className="flex h-14 items-end justify-center gap-1">
            {waveformBars.map((barHeight, idx) => (
              <span
                key={idx}
                style={{
                  height: isRecording ? `${barHeight}%` : "18%",
                  transition: `height ${100 + idx * 10}ms ease`,
                }}
                className={`w-1 rounded-full ${
                  isRecording ? "waveform-bar-live" : "waveform-bar-idle"
                }`}
              />
            ))}
          </div>
          <div
            className={`font-mono text-sm font-bold tracking-widest ${
              isRecording
                ? "text-rose-400"
                : isProcessingVoice
                  ? "text-amber-300"
                  : "text-slate-500"
            }`}
          >
            {isRecording
              ? `● REC ${formatTimer(recordingSeconds)}`
              : isProcessingVoice
                ? "◌ gemini-4-argon extracting…"
                : "○ 00:00 READY"}
          </div>
        </div>

        {/* Hold-to-speak button */}
        <div className="relative flex flex-col items-center gap-4">
          <button
            type="button"
            onMouseDown={startRecording}
            onMouseUp={stopRecording}
            onTouchStart={(e) => { e.preventDefault(); startRecording(); }}
            onTouchEnd={(e) => { e.preventDefault(); stopRecording(); }}
            disabled={isProcessingVoice}
            className={`relative flex h-28 w-28 items-center justify-center rounded-full border-2 select-none transition-all duration-300 disabled:opacity-40 ${
              isRecording
                ? "border-rose-400/60 bg-rose-600/80 text-white scale-110 btn-record-active"
                : "border-teal-400/40 text-white btn-record-idle"
            }`}
            style={
              isRecording
                ? {}
                : {
                    background:
                      "radial-gradient(circle at 35% 35%, rgba(13,148,136,0.70) 0%, rgba(15,118,110,0.90) 60%, rgba(5,150,105,0.95) 100%)",
                  }
            }
          >
            {/* Inner highlight ring */}
            <div
              className="absolute inset-1 rounded-full pointer-events-none"
              style={{
                background:
                  "radial-gradient(circle at 30% 25%, rgba(255,255,255,0.18) 0%, transparent 60%)",
              }}
            />
            {isProcessingVoice ? (
              <Loader2 className="h-10 w-10 animate-spin drop-shadow-lg" />
            ) : isRecording ? (
              <Square className="h-9 w-9 fill-current drop-shadow-lg" />
            ) : (
              <Mic className="h-10 w-10 drop-shadow-lg" />
            )}
          </button>

          <span className="text-xs font-medium text-slate-400">
            {isRecording
              ? "Release to extract case note & invoice"
              : "Hold to speak"}
          </span>

          {demoMode && (
            <button
              type="button"
              onClick={handleSimulateDemoVoiceNote}
              disabled={isProcessingVoice || isRecording}
              className="glass-amber inline-flex items-center gap-2 rounded-2xl px-5 py-2.5 text-xs font-bold text-amber-200 hover:brightness-110 disabled:opacity-40 transition-all"
            >
              <Volume2 className="h-4 w-4 text-amber-300" />
              Simulate Post-Shift Voice Note ({selectedParticipant.full_name})
            </button>
          )}
        </div>

        {errorMsg && (
          <div
            className="rounded-2xl px-4 py-3 text-xs text-rose-200"
            style={{
              background: "rgba(127, 29, 29, 0.35)",
              border: "1px solid rgba(239,68,68,0.30)",
              backdropFilter: "blur(8px)",
            }}
          >
            {errorMsg}
          </div>
        )}
      </section>

      {/* ── STEP 3: SHIFT REVIEW CARD ────────────────────────────── */}
      {activeClaimDraft && (
        <ShiftReviewCard
          key={activeClaimDraft.id}
          initialClaim={activeClaimDraft}
          participant={selectedParticipant}
          worker={worker}
          demoMode={demoMode}
          onClaimUpdated={(updated) => {
            setActiveClaimDraft(updated);
            upsertStoredShift(updated);
          }}
        />
      )}

      {!activeClaimDraft && (
        <div className="glass rounded-3xl px-5 py-4 flex items-center gap-3.5 text-xs text-slate-400">
          <CheckCircle2 className="h-5 w-5 text-teal-400 shrink-0 opacity-70" />
          <span>
            Hold the microphone or tap{" "}
            <strong className="text-amber-300">Simulate Post-Shift Voice Note</strong>{" "}
            to generate a 3-part NDIS clinical case note and GST-free invoice.
          </span>
        </div>
      )}
    </div>
  );
}
