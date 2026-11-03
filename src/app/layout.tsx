import type { Metadata, Viewport } from "next";
import "./globals.css";
import { BottomNav } from "@/components/BottomNav";

export const metadata: Metadata = {
  title: "ShiftNote AU — NDIS Clinical Case Notes & GST-Free Invoicing",
  description:
    "Mobile-first PWA for Australian Independent NDIS Support Workers turning post-shift voice notes into NDIS-compliant clinical case notes and GST-free Xero/PDF invoices.",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#0D9488",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-AU">
      <body className="min-h-screen text-slate-50 antialiased pb-24">
        <div className="mx-auto max-w-xl min-h-screen flex flex-col">
          <main className="flex-1 px-4 pt-4 pb-8">{children}</main>
          <BottomNav />
        </div>
      </body>
    </html>
  );
}
