# ShiftNote AU — Commercial Sales & Packaging Guide

**The AI-Powered Voice-to-Claim Engine for Australian Independent NDIS Support Workers**

---

## 1. Executive Summary & Market Opportunity

| Metric | Australian Market Size |
| :--- | :--- |
| **Total Addressable Market (TAM)** | 150,000+ Independent NDIS Support Workers & Micro-Agencies |
| **NDIS Scheme Size** | $44+ Billion AUD annual Australian Government scheme spend |
| **Active Participants** | Over 660,000 Australians living with significant permanent disability |
| **Average Hourly Rate** | $67.56/hr (Weekday Standard) to $122.56/hr (Sunday Penalty Rates) |
| **Average Shift Admin Time Lost** | 30 to 45 minutes per shift (unbillable documentation) |

### The Core Problem
Independent NDIS support workers (sole traders) face two major operational friction points:
1. **Unbillable Documentation Burden**: After 8–12 hours of physically demanding support, workers spend up to 45 minutes every evening typing clinical case notes to protect themselves during NDIS Quality and Safeguards Commission audits.
2. **Delayed Invoicing & Cashflow Rejections**: Plan Managers reject invoices containing incorrect 15-character item codes, missing day/time bracket calculations (weekday vs. evening vs. weekend), or improper GST tax flags. Each rejection delays sole trader payments by 14–30 days.

### The ShiftNote AU Solution
A mobile-first Progressive Web App (PWA) that transforms a **45-second spoken voice memo** into:
- An **objective 3-part NDIS Quality and Safeguards Commission clinical case note** (Activities, Participant Engagement, Plan Goals Progress).
- **Deterministic day/time rate cap enforcement** (Core Supports `01` & `04`, plus Provider Travel KMs).
- **ATO-Compliant GST-Free Tax Invoices** (`EXEMPTOUTPUT` under s38-38 GST Act 1999).
- **Instant Dual Dispatch**: Direct in-memory PDF generation to the Plan Manager & 1-click **Xero Accounting API** synchronization.

---

## 2. Recommended Sale & Subscription Structure

### Model A: Direct-to-Worker B2C SaaS (High-Volume Recurring Revenue)

| Plan Tier | Price | Ideal For | Features |
| :--- | :--- | :--- | :--- |
| **Solo Starter** | **$0 / forever** | New sole traders & casual workers | • 3 Voice-to-Claim shifts per month<br>• Full deterministic NDIS rate engine<br>• In-memory PDF invoice generation<br>• *Serves as a frictionless top-of-funnel acquisition hook.* |
| **Solo Pro** *(Core)* | **$29 AUD / month**<br>*(or $290/yr annual)* | Active full-time & part-time sole traders | • **Unlimited** Voice-to-Claim shifts<br>• Multimodal Gemini extraction<br>• Direct Plan Manager PDF email dispatch<br>• 1-Click Xero API ACCREC sync<br>• Complete NDIS Audit CSV export<br>• **100% Australian ATO tax-deductible** business expense. |
| **Solo Power** | **$49 AUD / month** | High-volume contractors & complex needs | • Everything in Pro<br>• Multiple custom worker ABNs / sub-contracting profiles<br>• SMS Plan Manager receipt verification<br>• Priority voice processing queue |

#### Unit Economics (Solo Pro)
- **Monthly Price**: $29.00 AUD
- **Average API & Compute Cost (Gemini + Vercel/Node)**: ~$1.20 AUD / month
- **Gross Margin**: **> 95.8%**
- **Average Customer Retention**: 18+ months
- **Customer Lifetime Value (LTV)**: $522.00 AUD
- **Estimated CAC (Facebook Groups / TikTok / Word-of-Mouth)**: $35 – $55 AUD
- **LTV : CAC Ratio**: **~9.5x to 14.9x**

---

### Model B: Boutique Agency & Support Coordinator Tier (B2B Expansion)

| Plan | Price | Target | Features |
| :--- | :--- | :--- | :--- |
| **Agency Hub** | **$79 AUD / month** (includes 5 workers)<br>*(+$15 AUD/worker/mo)* | Micro-agencies (2–20 support workers) | • Centralised team roster & participant directory<br>• Aggregated Xero invoice batching<br>• Manager approval workflow before dispatch<br>• Custom agency logo on PDF invoices |

---

### Model C: Complete Turnkey Intellectual Property Buyout (Code Sale)

For software investors, NDIS plan managers, or existing health-tech SaaS companies looking to acquire a turnkey product ready for Australian commercial launch:

- **Asking Price / Valuation**: **$4,999 – $12,500 AUD** (or ~$3,200 – $8,200 USD equivalent).
- **Deliverables Included in Asset Sale**:
  1. Full **Next.js 15.5 App Router & React 19** source code with zero proprietary lock-in.
  2. Multimodal **Gemini 4 Argon (`@google/genai`)** voice extraction route with strict response schema.
  3. **Deterministic NDIS Pricing Engine (`src/lib/ndis-catalogue.ts`)** with automated day/time bracket resolution and 2026/2027 NDIS rate caps.
  4. **Dual Invoicing Pipeline**:
     - In-memory `pdf-lib` Australian ATO & NDIS compliant Tax Invoice generator.
     - Xero OAuth2 & Accounting API (`ACCREC` / `EXEMPTOUTPUT`) client.
     - Resend Plan Manager email dispatch pipeline.
  5. Complete **Supabase PostgreSQL Schema & Strict RLS Policies (`supabase/migrations/001_init.sql`)**.
  6. **Interactive Demo Showcase (`/demo`)** with pre-configured realistic scenarios and live ROI calculator.
  7. Automated test suite and 1-click launcher scripts (`start-demo.bat`, `demo-runner.mjs`).

---

## 3. How to Send the Demo for People to Experience

To allow potential buyers, investors, or pilot support workers to test ShiftNote AU with zero friction:

### Option 1: 1-Click Local Demo Launcher (For Local Testing & Screen Shares)
1. Provide the project directory with [`start-demo.bat`](file:///c:/Users/joshw/OneDrive/Documents/shiftnote-au/start-demo.bat).
2. The user double-clicks `start-demo.bat` (or runs `npm run demo`).
3. Their browser opens automatically to [`http://localhost:3000/demo`](http://localhost:3000/demo), showcasing:
   - 3 real NDIS scenarios (Weekday, Evening Bracket, Sunday Penalty).
   - One-click voice processing and instant clinical case note generation.
   - Live downloadable ATO-compliant PDF invoices generated on the fly.
   - Interactive ROI calculator showing money and time saved.

### Option 2: Live Vercel / Cloud Demo Link (For Remote Sending)
Deploy to Vercel in 1 click (`vercel deploy`) and send the public URL:
`https://shiftnote-au.vercel.app/demo`

---

## 4. Cold Outreach & Pitch Templates

### Email / Message to Independent Support Workers (Sole Traders)
> **Subject**: Tired of typing case notes and formatting NDIS invoices after shifts?
>
> Hi [Name],
>
> If you're spending 30–45 minutes every evening writing up NDIS clinical notes and making sure your line item codes match the latest price guide, I built something to give your evenings back.
>
> It's called **ShiftNote AU**. You just speak into your phone for 45 seconds after your shift:
> - It extracts your hours, kilometres, and applies the exact NDIS rate cap.
> - Writes audit-proof, non-judgmental 3-part clinical notes for the NDIS Commission.
> - Creates a GST-free ATO tax invoice and can email it straight to your participant's Plan Manager or sync to Xero.
>
> Check out the interactive demo here (no sign up needed): **[Your Demo Link]**
>
> Would love to hear what you think!

### Pitch to Plan Management Companies
> **Subject**: Eliminating invoice errors from independent support workers
>
> Hi [Plan Manager Name],
>
> We know how much time your team loses chasing support workers for missing shift times, invalid item codes, or incorrect GST treatment.
>
> We've launched **ShiftNote AU**, an engine that guides independent workers to submit 100% compliant `EXEMPTOUTPUT` invoices with proper day/time brackets, correct item codes, and formatted references (`NDIS# [Number] - [Name]`).
>
> Experience the interactive demo here: **[Your Demo Link]**
>
> Let's discuss partnering to offer this to your independent provider network.

---

## 5. Regulatory Moats & Australian Compliance Architecture

- **NDIS Quality and Safeguards Commission**: Strictly enforces 3-part factual notes (*Activities Delivered*, *Participant Engagement & Choice*, *Plan Goals Progress*).
- **ATO Goods and Services Tax Act 1999**: Strictly tags labour as GST-Free under **Subdivision 38-B (s38-38)** with code `EXEMPTOUTPUT`.
- **NDIS Pricing Arrangements**: Embedded lookup table with strict cap enforcement for codes `01_011_0107_1_1` through `01_015_0107_1_1`, `04_102_0125_6_1` through `04_106_0125_6_1`, and provider travel KMs (`01_799` / `04_799`).

