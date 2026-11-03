// ============================================================================
// ShiftNote AU - Plan Manager Direct Tax Invoice Email Route (Resend API)
// Generates GST-Free NDIS PDF in memory via pdf-lib and emails it to the
// participant's Plan Manager via Resend.
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { generateNdisInvoicePdf } from "@/lib/pdf-invoice";
import { formatInvoiceReference } from "@/lib/ndis-catalogue";
import { DEMO_PARTICIPANTS, DEMO_WORKER_PROFILE } from "@/lib/demo-data";
import {
  createSupabaseServerClient,
  isSupabaseConfigured,
} from "@/lib/supabase/server";
import type { Participant, ShiftAndClaim, WorkerProfile } from "@/lib/types";

export const runtime = "nodejs";

interface EmailPdfRequestBody {
  claim: ShiftAndClaim;
  participant?: Participant;
  worker?: WorkerProfile;
  recipientEmailOverride?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as EmailPdfRequestBody;
    if (!body?.claim) {
      return NextResponse.json(
        { error: "Missing required claim object in request body." },
        { status: 400 }
      );
    }

    let worker: WorkerProfile = body.worker ?? DEMO_WORKER_PROFILE;
    let participant: Participant | undefined =
      body.participant ??
      DEMO_PARTICIPANTS.find((p) => p.id === body.claim.participant_id);

    // Fetch live records from Supabase when authenticated
    if (isSupabaseConfigured()) {
      const supabase = await createSupabaseServerClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const [{ data: dbProfile }, { data: dbParticipant }] = await Promise.all([
          supabase.from("profiles").select("*").eq("id", user.id).single(),
          supabase
            .from("participants")
            .select("*")
            .eq("id", body.claim.participant_id)
            .eq("worker_id", user.id)
            .single(),
        ]);

        if (dbProfile) worker = dbProfile as WorkerProfile;
        if (dbParticipant) participant = dbParticipant as Participant;
      }
    }

    if (!participant) {
      return NextResponse.json(
        { error: "Participant record not found for invoice email." },
        { status: 404 }
      );
    }

    const toEmail =
      body.recipientEmailOverride?.trim() ||
      participant.plan_manager_email?.trim();

    if (!toEmail) {
      return NextResponse.json(
        {
          error:
            "No Plan Manager email address is configured for this participant.",
        },
        { status: 400 }
      );
    }

    // 1. Render GST-Free NDIS Tax Invoice PDF in memory
    const pdfBytes = await generateNdisInvoicePdf({
      worker,
      participant,
      claim: body.claim,
      includeCaseNotesOnInvoice: false, // Plan managers only require the tax invoice & line items
    });

    const pdfBase64 = Buffer.from(pdfBytes).toString("base64");
    const invoiceRef = formatInvoiceReference(
      participant.ndis_number,
      participant.full_name
    );

    const resendApiKey = process.env.RESEND_API_KEY;
    const fromAddress =
      process.env.RESEND_FROM_EMAIL ||
      "ShiftNote AU Claims <invoices@shiftnote.com.au>";

    let resendMessageId = `demo-resend-${Date.now()}`;
    let simulatedDemoSend = false;

    if (resendApiKey && !resendApiKey.includes("YourResendApiKey")) {
      const resend = new Resend(resendApiKey);
      const { data, error } = await resend.emails.send({
        from: fromAddress,
        to: [toEmail],
        subject: `Tax Invoice ${body.claim.invoice_number} — ${invoiceRef}`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #0f172a; line-height: 1.6;">
            <h2 style="color: #0d9488; margin-bottom: 4px;">NDIS GST-Free Tax Invoice: ${body.claim.invoice_number}</h2>
            <p style="margin-top: 0; color: #475569;"><strong>${invoiceRef}</strong></p>
            <p>Dear ${participant.plan_manager_name || "Plan Management Team"},</p>
            <p>Please find attached Tax Invoice <strong>${body.claim.invoice_number}</strong> for NDIS Core Supports delivered to <strong>${participant.full_name}</strong> (NDIS# ${participant.ndis_number}) on <strong>${body.claim.shift_date}</strong> (${body.claim.start_time}–${body.claim.end_time}).</p>
            <table style="border-collapse: collapse; width: 100%; max-width: 560px; margin: 16px 0; background: #f8fafc; border: 1px solid #cbd5e1;">
              <tr>
                <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0;"><strong>Provider:</strong></td>
                <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0;">${worker.business_name} (ABN: ${worker.abn})</td>
              </tr>
              <tr>
                <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0;"><strong>Reference:</strong></td>
                <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0;">${invoiceRef}</td>
              </tr>
              <tr>
                <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0;"><strong>Total Due (GST-Free):</strong></td>
                <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0;"><strong>$${body.claim.total_amount.toFixed(2)} AUD</strong></td>
              </tr>
              <tr>
                <td style="padding: 8px 12px;"><strong>EFT Remittance:</strong></td>
                <td style="padding: 8px 12px;">BSB ${worker.bsb} | Account ${worker.account_number}</td>
              </tr>
            </table>
            <p style="font-size: 12px; color: #64748b;">Supply is GST-Free under Subdivision 38-B (s38-38) of the A New Tax System (Goods and Services Tax) Act 1999.</p>
          </div>
        `,
        attachments: [
          {
            filename: `${body.claim.invoice_number}.pdf`,
            content: pdfBase64,
          },
        ],
      });

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 502 });
      }
      if (data?.id) {
        resendMessageId = data.id;
      }
    } else {
      simulatedDemoSend = true;
    }

    // 2. Persist status update to Supabase if configured
    if (isSupabaseConfigured()) {
      const supabase = await createSupabaseServerClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        await supabase
          .from("shifts_and_claims")
          .upsert({
            ...body.claim,
            worker_id: user.id,
            status: "pdf_emailed",
          });
      }
    }

    return NextResponse.json({
      success: true,
      status: "pdf_emailed",
      recipient: toEmail,
      invoiceNumber: body.claim.invoice_number,
      reference: invoiceRef,
      resendMessageId,
      simulatedDemoSend,
      pdfBase64,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to email PDF invoice.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
