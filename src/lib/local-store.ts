"use client";

// ============================================================================
// ShiftNote AU - Local Demo Mode Persistence Store
// Keeps pre-seeded Worker Profile, Participants, and Shifts & Claims synced
// across /dashboard, /participants, and /history with zero external setup.
// ============================================================================

import {
  DEMO_INITIAL_SHIFTS,
  DEMO_PARTICIPANTS,
  DEMO_WORKER_PROFILE,
} from "./demo-data";
import type { Participant, ShiftAndClaim, WorkerProfile } from "./types";

const STORAGE_KEYS = {
  demoMode: "shiftnote_au_demo_mode_v1",
  worker: "shiftnote_au_worker_v1",
  participants: "shiftnote_au_participants_v1",
  shifts: "shiftnote_au_shifts_v1",
} as const;

export function getDemoModeEnabled(): boolean {
  if (typeof window === "undefined") return true;
  const raw = window.localStorage.getItem(STORAGE_KEYS.demoMode);
  return raw === null ? true : raw === "true";
}

export function setDemoModeEnabled(enabled: boolean): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEYS.demoMode, String(enabled));
}

export function getStoredWorkerProfile(): WorkerProfile {
  if (typeof window === "undefined") return DEMO_WORKER_PROFILE;
  const raw = window.localStorage.getItem(STORAGE_KEYS.worker);
  if (!raw) {
    window.localStorage.setItem(
      STORAGE_KEYS.worker,
      JSON.stringify(DEMO_WORKER_PROFILE)
    );
    return DEMO_WORKER_PROFILE;
  }
  try {
    return JSON.parse(raw) as WorkerProfile;
  } catch {
    return DEMO_WORKER_PROFILE;
  }
}

export function saveStoredWorkerProfile(profile: WorkerProfile): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEYS.worker, JSON.stringify(profile));
}

export function getStoredParticipants(): Participant[] {
  if (typeof window === "undefined") return DEMO_PARTICIPANTS;
  const raw = window.localStorage.getItem(STORAGE_KEYS.participants);
  if (!raw) {
    window.localStorage.setItem(
      STORAGE_KEYS.participants,
      JSON.stringify(DEMO_PARTICIPANTS)
    );
    return DEMO_PARTICIPANTS;
  }
  try {
    return JSON.parse(raw) as Participant[];
  } catch {
    return DEMO_PARTICIPANTS;
  }
}

export function saveStoredParticipants(participants: Participant[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    STORAGE_KEYS.participants,
    JSON.stringify(participants)
  );
}

export function getStoredShifts(): ShiftAndClaim[] {
  if (typeof window === "undefined") return DEMO_INITIAL_SHIFTS;
  const raw = window.localStorage.getItem(STORAGE_KEYS.shifts);
  if (!raw) {
    window.localStorage.setItem(
      STORAGE_KEYS.shifts,
      JSON.stringify(DEMO_INITIAL_SHIFTS)
    );
    return DEMO_INITIAL_SHIFTS;
  }
  try {
    return JSON.parse(raw) as ShiftAndClaim[];
  } catch {
    return DEMO_INITIAL_SHIFTS;
  }
}

export function saveStoredShifts(shifts: ShiftAndClaim[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEYS.shifts, JSON.stringify(shifts));
}

export function upsertStoredShift(shift: ShiftAndClaim): ShiftAndClaim[] {
  const existing = getStoredShifts();
  const idx = existing.findIndex((s) => s.id === shift.id);
  const updated =
    idx >= 0
      ? existing.map((item, i) => (i === idx ? shift : item))
      : [shift, ...existing];
  saveStoredShifts(updated);
  return updated;
}
