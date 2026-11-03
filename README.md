# ShiftNote AU

**Mobile-First Progressive Web App (PWA) for Australian Independent NDIS Support Workers (Sole Traders)**

Turns post-shift voice notes into NDIS Quality and Safeguards Commission-compliant 3-part clinical case notes and Australian GST-Free Tax Invoices (`EXEMPTOUTPUT` via Xero API + in-memory `pdf-lib` PDF generation & Resend Plan Manager dispatch).

## Architecture & Compliance Highlights

- **Multimodal Gemini 4 Argon (`@google/genai`)**: Calls `gemini-4-argon` in `src/app/api/process-voice/route.ts` with `thinkingLevel: "medium"`, multimodal audio `inlineData`, and a strict `responseSchema` constrained to the deterministic NDIS Support Catalogue.
- **Deterministic NDIS Engine (`src/lib/ndis-catalogue.ts`)**:
  - Core Supports lookup table for Self-Care (`01_011_0107_1_1` through `01_015_0107_1_1`), Community Access (`04_102_0125_6_1` through `04_106_0125_6_1`), and Provider Travel KMs (`01_799_0107_1_1`, `04_799_0125_6_1`).
  - Automatic 5-bracket day/time resolution (`Weekday Daytime`, `Weekday Evening`, `Saturday`, `Sunday`, `Public Holiday`).
  - Strict NDIS Price Limit cap enforcement and Plan Manager OCR line formatting: `"{ndis_code} - {description} ({shift_date}, {start_time}-{end_time})"`.
  - Invoice `Reference` formatting: `"NDIS# {ndis_number} - {participant_full_name}"`.
- **Dual GST-Free Invoicing Pipeline**:
  - **Xero OAuth2 + Accounting API (`src/app/api/xero/*`)**: Pushes `Type: "ACCREC"` invoices with `TaxType: "EXEMPTOUTPUT"` (0% Australian GST-Free NDIS Supply).
  - **In-Memory PDF & Resend (`src/lib/pdf-invoice.ts`, `src/app/api/claims/email-pdf/route.ts`)**: Generates an ATO & NDIS-compliant Tax Invoice PDF in memory using `pdf-lib` and emails it directly to the Participant's Plan Manager.
- **Supabase PostgreSQL + Strict RLS (`supabase/migrations/001_init.sql`)**:
  - Tables: `profiles`, `participants`, and `shifts_and_claims` with Row-Level Security enforcing `auth.uid() = worker_id`.

## 5-Step Quickstart Checklist

1. **Install Dependencies**: Run `npm install` in the project root (`Node.js >= 18.18+`).
2. **Configure Environment Variables**: Copy `.env.example` to `.env.local` and set `GEMINI_API_KEY` (Local Demo Mode works immediately with only `GEMINI_API_KEY`!).
3. **Apply Supabase Database Migration (Optional for Production Mode)**: Run `supabase/migrations/001_init.sql` in the Supabase SQL Editor and add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` to `.env.local`.
4. **Verify Deterministic NDIS Engine**: Run `npm test` to execute the unit test suite (`tests/ndis-catalogue.test.mjs`) verifying rate caps, day/time brackets, and Plan Manager OCR strings.
5. **Start Development Server**: Run `npm run dev`, open `http://localhost:3000/dashboard`, keep **Demo Mode: ON**, and hold the microphone button (or tap **Simulate Post-Shift Voice Note**) to test voice-to-case-note extraction and instant GST-free PDF / Xero invoicing.
