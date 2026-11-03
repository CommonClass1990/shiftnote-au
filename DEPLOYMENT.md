# ShiftNote AU — Production Deployment & Infrastructure Guide

Complete guide for deploying **ShiftNote AU** into production for Australian Independent NDIS Support Workers and micro-agencies.

---

## Architecture Overview

```
                               ┌──────────────────────────────────────────────────────────┐
                               │                    CLIENT LAYER                          │
                               │  Mobile PWA (iOS / Android / Desktop) - React 19 App     │
                               └─────────────────────────────┬────────────────────────────┘
                                                             │ HTTPS (syd1 Sydney Edge)
                                                             ▼
                               ┌──────────────────────────────────────────────────────────┐
                               │                   APPLICATION LAYER                      │
                               │  Next.js 15.5 App Router hosted on Vercel                │
                               │  - /dashboard, /participants, /history, /demo            │
                               │  - Multimodal API: /api/process-voice                    │
                               │  - In-memory PDF Engine: /api/claims/generate-pdf        │
                               └───────┬───────────────────┬───────────────────┬──────────┘
                                       │                   │                   │
                  ┌────────────────────┘                   │                   └────────────────────┐
                  ▼                                        ▼                                        ▼
   ┌─────────────────────────────┐        ┌─────────────────────────────┐        ┌─────────────────────────────┐
   │       AI INFERENCE          │        │     DATABASE & AUTH         │        │    ACCOUNTING & EMAIL       │
   │  Google Gemini 4 Argon      │        │  Supabase (PostgreSQL 15)   │        │  Xero API + Resend API      │
   │  - Multimodal audio parsing │        │  - Strict Row Level Security│        │  - ACCREC EXEMPTOUTPUT GST  │
   │  - thinkingLevel: medium    │        │  - Profiles, Participants,  │        │  - Plan Manager PDF email   │
   │  - Strict responseSchema    │        │    Shifts & Claims          │        │  - In-memory pdf-lib        │
   └─────────────────────────────┘        └─────────────────────────────┘        └─────────────────────────────┘
```

---

## 1. Prerequisites Checklist

Before deploying, ensure you have access to:
- [GitHub](https://github.com) account (to host the repository).
- [Vercel](https://vercel.com) account (Free or Pro).
- [Supabase](https://supabase.com) account (PostgreSQL database + Auth).
- [Google AI Studio](https://aistudio.google.com/) (Gemini API Key).
- [Resend](https://resend.com) account (Plan Manager email delivery).
- [Xero Developer Portal](https://developer.xero.com/) (Optional: for direct accounting integration).

---

## 2. Production Environment Variables Reference

Configure these in your Vercel Project Settings under **Settings &rarr; Environment Variables**:

| Variable Name | Required | Description / Example |
| :--- | :---: | :--- |
| `GEMINI_API_KEY` | **Yes** | API key from Google AI Studio (`AIzaSy...`). Powers multimodal audio extraction. |
| `NEXT_PUBLIC_APP_URL` | **Yes** | Canonical public URL (e.g. `https://shiftnote.com.au` or `https://shiftnote-au.vercel.app`). |
| `NEXT_PUBLIC_SUPABASE_URL` | **Yes** | Project URL from Supabase Settings (`https://xyzcompany.supabase.co`). |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | **Yes** | Public anon JWT token from Supabase API settings. |
| `SUPABASE_SERVICE_ROLE_KEY` | **Yes** | Elevated service role key for backend operations. |
| `RESEND_API_KEY` | **Yes** | Resend API token (`re_...`) for emailing Plan Manager invoices. |
| `RESEND_FROM_EMAIL` | **Yes** | Verified sender address (e.g. `ShiftNote Invoicing <invoices@shiftnote.com.au>`). |
| `XERO_CLIENT_ID` | Optional | OAuth2 Client ID from Xero Developer Portal. |
| `XERO_CLIENT_SECRET` | Optional | OAuth2 Client Secret from Xero Developer Portal. |
| `XERO_REDIRECT_URI` | Optional | OAuth2 Callback: `https://your-domain.com/api/xero/callback`. |

---

## 3. Step-by-Step Vercel Deployment (Recommended)

### Step 1: Create a Private GitHub Repository
1. Initialize and push this codebase to your GitHub account:
   ```bash
   git remote add origin https://github.com/your-username/shiftnote-au.git
   git branch -M main
   git push -u origin main
   ```

### Step 2: Import into Vercel
1. Log in to [Vercel](https://vercel.com) and click **"Add New..." &rarr; "Project"**.
2. Select your `shiftnote-au` repository.
3. Vercel automatically detects Next.js:
   - **Framework Preset**: `Next.js`
   - **Root Directory**: `./`
   - **Build Command**: `next build`
   - **Output Directory**: `.next`
4. Expand **Environment Variables** and paste the keys from your `.env.local` or Section 2 above.
5. In `vercel.json`, the region is automatically locked to `syd1` (Sydney, Australia) for minimal latency.
6. Click **Deploy**.

---

## 4. Supabase Database Migration & Auth Setup

1. Open your project on [Supabase Dashboard](https://supabase.com).
2. Go to the **SQL Editor** tab.
3. Open [`supabase/migrations/001_init.sql`](./supabase/migrations/001_init.sql) and run the full migration script.
4. This sets up:
   - `profiles` table (worker ABN, bank details, default rate caps, Xero tokens).
   - `participants` table (NDIS number, funding type, Plan Manager email, NDIS goals).
   - `shifts_and_claims` table (hours, km, 3-part clinical notes, line items, status).
   - Automatic `auth.users` trigger linking to `profiles`.
   - Strict Row Level Security (`auth.uid() = worker_id`) ensuring multi-tenant data isolation.
5. Under **Authentication &rarr; URL Configuration**:
   - Set **Site URL** to `https://your-domain.com`.
   - Set **Redirect URLs** to `https://your-domain.com/**`.

---

## 5. Resend Email Domain Verification (Plan Manager Dispatch)

For emails to reach Plan Managers reliably without spam filtering:
1. Log in to [Resend](https://resend.com) &rarr; **Domains** &rarr; **Add Domain**.
2. Enter your domain (e.g. `shiftnote.com.au` or `mail.shiftnote.com.au`).
3. Add the provided DNS records (**SPF**, **DKIM**, and **DMARC**) in your domain registrar (GoDaddy, Cloudflare, Namecheap, etc.).
4. Once verified, update `RESEND_FROM_EMAIL="ShiftNote Claims <invoices@yourdomain.com>"`.

---

## 6. Xero Developer Portal Registration (OAuth2 Invoicing)

To enable Australian GST-free ACCREC invoice creation directly in Xero:
1. Visit [developer.xero.com/app/manage](https://developer.xero.com/app/manage).
2. Click **New App**:
   - **App Name**: `ShiftNote AU`
   - **Integration Type**: `Web app`
   - **Company URL**: `https://your-domain.com`
   - **Redirect URI**: `https://your-domain.com/api/xero/callback`
3. Under **Configuration**, generate a **Client Secret**.
4. Set scopes: `offline_access`, `accounting.transactions`, `accounting.contacts`, `accounting.settings.read`.
5. Copy `XERO_CLIENT_ID` and `XERO_CLIENT_SECRET` into your Vercel Environment Variables.

---

## 7. Alternative: Docker / Container Deployment

If deploying to **Railway**, **Render**, **AWS ECS / App Runner**, or **Google Cloud Run**:

```bash
# 1. Build the production image
docker build -t shiftnote-au .

# 2. Run the container locally or on a VPS
docker run -p 3000:3000 \
  -e GEMINI_API_KEY="AIzaSy..." \
  -e NEXT_PUBLIC_APP_URL="http://localhost:3000" \
  shiftnote-au
```

---

## 8. Post-Deployment Verification Health Check

After deployment, test the following endpoints to ensure all systems are live:

- [ ] **Home & Dashboard**: Visit `https://your-domain.com/dashboard` (Returns 200 OK).
- [ ] **Interactive Demo**: Visit `https://your-domain.com/demo` (Returns 200 OK, scenarios interactive).
- [ ] **Voice-to-Claim Extraction**: Test simulated note or microphone recording (Returns structured case notes).
- [ ] **Tax Invoice PDF**: Tap "Download Tax Invoice PDF" (Generates valid A4 PDF).
- [ ] **PWA Manifest & Icons**: Check `https://your-domain.com/manifest.json` and `/icon-192.png`.

