"use client";

// ============================================================================
// ShiftNote AU - 1-Click PWA Installation Component
// Allows users to install ShiftNote AU as a standalone desktop or mobile app
// with a native app icon and independent window.
// ============================================================================

import React, { useEffect, useState } from "react";
import { Download, Smartphone, Monitor, CheckCircle2, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallPwaPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState<boolean>(false);
  const [showInstructions, setShowInstructions] = useState<boolean>(false);
  const [isIos, setIsIos] = useState<boolean>(false);

  useEffect(() => {
    // Check if already running as installed standalone app
    const isStandaloneMode =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    setIsStandalone(isStandaloneMode);

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIos(isIosDevice);

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
    };
  }, []);

  if (isStandalone) {
    return null; // Already running as installed standalone app
  }

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === "accepted") {
        setIsStandalone(true);
      }
      setDeferredPrompt(null);
    } else {
      setShowInstructions(true);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleInstallClick}
        title="Install ShiftNote AU as a standalone desktop or mobile app"
        className="glass-pill inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold text-teal-300 hover:text-white transition-all shadow-sm"
      >
        <Download className="h-3.5 w-3.5 text-teal-400" />
        <span>Install App</span>
      </button>

      {showInstructions && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div
            className="glass-strong relative max-w-sm w-full rounded-3xl p-6 space-y-4 shadow-2xl"
            style={{ border: "1px solid rgba(20,184,166,0.3)" }}
          >
            <button
              type="button"
              onClick={() => setShowInstructions(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-2xl bg-teal-500/20 flex items-center justify-center text-teal-300">
                <Smartphone className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Install ShiftNote AU</h3>
                <p className="text-[11px] text-slate-400">Standalone App Setup</p>
              </div>
            </div>

            <div className="space-y-3 text-xs text-slate-300">
              {isIos ? (
                <div className="space-y-2 rounded-2xl p-3.5 bg-slate-900/60 border border-slate-700/50">
                  <p className="font-semibold text-teal-300">Apple iOS (Safari):</p>
                  <ol className="list-decimal list-inside space-y-1 text-slate-300">
                    <li>Tap the <strong>Share</strong> button (box with upward arrow) at the bottom.</li>
                    <li>Scroll down and tap <strong>&ldquo;Add to Home Screen&rdquo;</strong>.</li>
                    <li>Tap <strong>Add</strong> in the top-right corner.</li>
                  </ol>
                </div>
              ) : (
                <div className="space-y-2 rounded-2xl p-3.5 bg-slate-900/60 border border-slate-700/50">
                  <p className="font-semibold text-teal-300">Desktop (Chrome / Edge):</p>
                  <ol className="list-decimal list-inside space-y-1 text-slate-300">
                    <li>Look at the right side of your address bar for the <strong>Install</strong> icon ⊞.</li>
                    <li>Click <strong>Install &ldquo;ShiftNote AU&rdquo;</strong>.</li>
                    <li>The app will launch in its own standalone window with a desktop icon.</li>
                  </ol>
                </div>
              )}

              <div className="flex items-center gap-2 text-[11px] text-slate-400 pt-1">
                <CheckCircle2 className="h-4 w-4 text-teal-400 shrink-0" />
                <span>Runs completely offline with instantaneous loading.</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowInstructions(false)}
              className="w-full rounded-2xl py-2.5 text-xs font-bold text-white transition-all"
              style={{ background: "linear-gradient(135deg, #0d9488 0%, #059669 100%)" }}
            >
              Got It
            </button>
          </div>
        </div>
      )}
    </>
  );
}
