// ============================================================================
// ShiftNote AU - Direct PDF Invoice Download/Preview Route
// Renders the ATO/NDIS-compliant GST-free PDF in memory via pdf-lib
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import { generateNdisInvoicePdf } from "@/lib/pdf-invoice";
import { DEMO_PARTICIPANTS, DEMO_WORKER_PROFILE } from "@/lib/demo-data";
import type { Participant, ShiftAndClaim, WorkerProfile } from "@/lib/types";

export const runtime = "nodejs";

interface GeneratePdfRequestBody {
  claim: ShiftAndClaim;
  participant?: Participant;
  worker?: WorkerProfile;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as GeneratePdfRequestBody;
    if (!body?.claim) {
      return NextResponse.json(
        { error: "Missing claim payload for PDF generation." },
        { status: 400 }
      );
    }

    const participant: Participant =
      body.participant ??
      DEMO_PARTICIPANTS.find((p) => p.id === body.claim.participant_id) ??
      DEMO_PARTICIPANTS[0]!;

    const worker: WorkerProfile = body.worker ?? DEMO_WORKER_PROFILE;

    const pdfBytes = await generateNdisInvoicePdf({
      worker,
      participant,
      claim: body.claim,
      includeCaseNotesOnInvoice: true,
    });

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${body.claim.invoice_number}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to generate PDF invoice.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
