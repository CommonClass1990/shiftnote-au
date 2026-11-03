# ShiftNote AU

**Mobile-First Progressive Web App (PWA) & Invoicing Engine for Australian Independent NDIS Support Workers (Sole Traders)**

[![NDIS Pricing Arrangements 2026/2027](https://img.shields.io/badge/NDIS%20Pricing-2026%2F2027%20Compliant-0D9488?style=flat-square)](https://www.ndis.gov.au)
[![ATO GST-Free s38-38](https://img.shields.io/badge/ATO%20GST--Free-s38--38%20(EXEMPTOUTPUT)-1E293B?style=flat-square)](https://www.ato.gov.au)
[![Next.js 15.5](https://img.shields.io/badge/Next.js-15.5%20Standalone-black?style=flat-square&logo=next.js)](https://nextjs.org)
[![React 19](https://img.shields.io/badge/React-19.0-61DAFB?style=flat-square&logo=react)](https://react.dev)
[![Gemini 4 Argon](https://img.shields.io/badge/Gemini%204%20Argon-Multimodal%20Audio-4285F4?style=flat-square&logo=google)](https://aistudio.google.com)
[![Mobile Native Repo](https://img.shields.io/badge/Mobile%20Companion-shiftnote--au--mobile-teal?style=flat-square&logo=expo)](https://github.com/CommonClass1990/shiftnote-au-mobile)

Turns post-shift voice notes into **NDIS Quality and Safeguards Commission-compliant 3-part clinical case notes** and Australian **GST-Free Tax Invoices** (`EXEMPTOUTPUT` via Xero API + in-memory `pdf-lib` PDF generation & direct Plan Manager email dispatch).

---

## 📱 Ecosystem & Repositories

| Repository | Description | Primary Stack |
| :--- | :--- | :--- |
| **[`shiftnote-au`](https://github.com/CommonClass1990/shiftnote-au)** *(This Repo)* | Complete Next.js 15 PWA web app, deterministic NDIS engine, PDF generator, and Xero sync. | Next.js 15.5, React 19, Tailwind CSS, Supabase RLS |
| **[`shiftnote-au-mobile`](https://github.com/CommonClass1990/shiftnote-au-mobile)** | Native iOS & Android companion app for post-shift dictation in the car. | React Native 0.76, Expo SDK 52, `expo-av`, `expo-haptics` |

---

## ⚡ 1-Click Zero-Config Local Setup (Windows / Mac)

ShiftNote AU runs completely standalone without requiring any database or API keys to start testing.

### On Windows:
1. **First-Time Install**: Double-click **`setup.bat`** (installs dependencies, builds standalone app).
2. **Launch App**: Double-click **`run.bat`** (starts the server and opens your browser automatically).
3. **Interactive Demo Tour**: Double-click **`start-demo.bat`** (opens the interactive 3-scenario demo).

### On macOS / Linux:
```bash
chmod +x setup.sh run.sh
./setup.sh     # 1-Click setup
./run.sh       # 1-Click run
```

---

## 📖 Key Documentation & Commercial Guides

- **[`EASY_SETUP_GUIDE.md`](./EASY_SETUP_GUIDE.md)**: Visual, jargon-free guide on installing as a standalone desktop app or mobile home screen icon.
- **[`COMMERCIAL_PACKAGE.md`](./COMMERCIAL_PACKAGE.md)**: Investor & commercial buyer deck, $44B NDIS market sizing, unit economics, $29/mo SaaS subscription models, and outreach scripts.
- **[`DEPLOYMENT.md`](./DEPLOYMENT.md)**: Comprehensive guide for deploying to Vercel (Sydney `syd1`), configuring Supabase RLS migrations, Resend Plan Manager email dispatch, and Xero OAuth2.

---

## 🏛️ Architecture & Regulatory Compliance Highlights

- **Multimodal Gemini 4 Argon (`@google/genai`)**: Calls `gemini-4-argon` in `src/app/api/process-voice/route.ts` with `thinkingLevel: "medium"`, multimodal audio `inlineData`, and a strict `responseSchema` constrained to the deterministic NDIS Support Catalogue.
- **Deterministic NDIS Pricing Engine (`src/lib/ndis-catalogue.ts`)**:
  - Core Supports lookup table for Self-Care (`01_011_0107_1_1` through `01_015_0107_1_1`), Community Access (`04_102_0125_6_1` through `04_106_0125_6_1`), and Provider Travel KMs (`01_799_0107_1_1`, `04_799_0125_6_1`).
  - Automatic 5-bracket day/time resolution (`Weekday Daytime`, `Weekday Evening`, `Saturday`, `Sunday`, `Public Holiday`).
  - Strict NDIS Price Limit cap enforcement and Plan Manager OCR line formatting: `"{ndis_code} - {description} ({shift_date}, {start_time}-{end_time})"`.
  - Invoice `Reference` formatting: `"NDIS# {ndis_number} - {participant_full_name}"`.
- **Dual GST-Free Invoicing Pipeline**:
  - **Xero OAuth2 + Accounting API (`src/app/api/xero/*`)**: Pushes `Type: "ACCREC"` invoices with `TaxType: "EXEMPTOUTPUT"` (0% Australian GST-Free NDIS Supply).
  - **In-Memory PDF & Resend (`src/lib/pdf-invoice.ts`, `src/app/api/claims/email-pdf/route.ts`)**: Generates an ATO & NDIS-compliant Tax Invoice PDF in memory using `pdf-lib` and emails it directly to the Participant's Plan Manager.
- **Supabase PostgreSQL + Strict RLS (`supabase/migrations/001_init.sql`)**:
  - Tables: `profiles`, `participants`, and `shifts_and_claims` with Row-Level Security enforcing `auth.uid() = worker_id`.

---

## 🧪 Automated Testing & Verification

Run the full deterministic rate engine test suite:
```bash
npm test
```
```text
✔ 1. Catalogue completeness: Contains all 12 Core Support & Provider Travel codes
✔ 2. Day/Time Bracket Resolution: Weekday Daytime, Weekday Evening, Saturday, Sunday, Public Holiday
✔ 3. Rate-Cap Validation: Clamps rates above NDIS maximum and preserves lower negotiated rates
✔ 4. Plan Manager OCR Line Description & Reference Formatting
✔ 5. Full Shift Line Item Math Accuracy (Labour + Provider Travel KMs)
ℹ tests 5 | pass 5 | fail 0
```

---

## 🚀 1-Click Cloud Deployment to Vercel

```bash
# 1. Double click deploy-vercel.bat or run:
npx vercel --prod
```
Region is locked to **`syd1` (Sydney, Australia)** in `vercel.json` for optimal Australian edge latency.
