// ============================================================================
// ShiftNote AU - Xero Invoice Submission Route (POST /api.xro/2.0/Invoices)
// Strict Australian NDIS Compliance:
// - Type: "ACCREC"
// - TaxType: "EXEMPTOUTPUT" (0% GST-Free NDIS Supply)
// - Reference: "NDIS# {ndis_number} - {participant_full_name}"
// - Line Item Description: "{ndis_code} - {description} ({shift_date}, {start_time}-{end_time})"
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import {
  formatInvoiceReference,
  formatPlanManagerLineDescription,
} from "@/lib/ndis-catalogue";
import { DEMO_PARTICIPANTS } from "@/lib/demo-data";
import {
  createSupabaseServerClient,
  isSupabaseConfigured,
} from "@/lib/supabase/server";
import type {
  Participant,
  ShiftAndClaim,
  WorkerProfile,
  XeroTokenSet,
} from "@/lib/types";

export const runtime = "nodejs";

interface SubmitXeroInvoiceBody {
  claim: ShiftAndClaim;
  participant?: Participant;
  demoMode?: boolean;
}

/**
 * Refreshes an expired Xero OAuth2 token set before calling the Accounting API.
 */
async function ensureValidXeroToken(
  tokenSet: XeroTokenSet
): Promise<XeroTokenSet> {
  const nowSeconds = Math.floor(Date.now() / 1000);
  if (tokenSet.expires_at - 60 > nowSeconds) {
    return tokenSet;
  }

  const clientId = process.env.XERO_CLIENT_ID ?? "";
  const clientSecret = process.env.XERO_CLIENT_SECRET ?? "";
  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString(
    "base64"
  );

  const response = await fetch("https://identity.xero.com/connect/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${basicAuth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: tokenSet.refresh_token,
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to refresh Xero OAuth2 access token.");
  }

  const refreshed = (await response.json()) as {
    access_token: string;
    refresh_token: string;
    expires_in: number;
    token_type: string;
    scope?: string;
  };

  return {
    access_token: refreshed.access_token,
    refresh_token: refreshed.refresh_token,
    expires_at: nowSeconds + refreshed.expires_in,
    token_type: refreshed.token_type,
    scope: refreshed.scope,
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as SubmitXeroInvoiceBody;
    if (!body?.claim) {
      return NextResponse.json(
        { error: "Missing required claim payload." },
        { status: 400 }
      );
    }

    const { claim } = body;
    let participant: Participant | undefined =
      body.participant ??
      DEMO_PARTICIPANTS.find((p) => p.id === claim.participant_id);
    let workerProfile: WorkerProfile | null = null;

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
            .eq("id", claim.participant_id)
            .eq("worker_id", user.id)
            .single(),
        ]);

        if (dbProfile) workerProfile = dbProfile as WorkerProfile;
        if (dbParticipant) participant = dbParticipant as Participant;
      }
    }

    if (!participant) {
      return NextResponse.json(
        { error: "Participant not found for Xero invoice submission." },
        { status: 404 }
      );
    }

    // 1. Construct strict Australian NDIS GST-Free Xero ACCREC Payload
    const invoiceReference = formatInvoiceReference(
      participant.ndis_number,
      participant.full_name
    );

    const xeroLineItems = claim.line_items.map((item) => ({
      Description: formatPlanManagerLineDescription(
        item.ndis_code,
        item.support_name || item.description,
        claim.shift_date,
        claim.start_time,
        claim.end_time
      ),
      Quantity: item.quantity,
      UnitAmount: item.unit_price,
      AccountCode: "200", // Standard Xero Sales revenue account
      TaxType: "EXEMPTOUTPUT" as const, // Strict Australian GST-Free NDIS Output
    }));

    const dueDateObj = new Date(`${claim.shift_date}T00:00:00Z`);
    dueDateObj.setUTCDate(dueDateObj.getUTCDate() + 7); // 7-day NDIS Plan Manager payment terms
    const dueDateStr = dueDateObj.toISOString().slice(0, 10);

    const xeroPayload = {
      Invoices: [
        {
          Type: "ACCREC" as const,
          Contact: participant.xero_contact_id
            ? { ContactID: participant.xero_contact_id }
            : {
                Name: participant.plan_manager_name
                  ? `${participant.full_name} (c/o ${participant.plan_manager_name})`
                  : participant.full_name,
                EmailAddress: participant.plan_manager_email ?? undefined,
              },
          Date: claim.shift_date,
          DueDate: dueDateStr,
          InvoiceNumber: claim.invoice_number,
          Reference: invoiceReference,
          LineAmountTypes: "Exclusive" as const,
          Status: "AUTHORISED" as const,
          LineItems: xeroLineItems,
        },
      ],
    };

    // 2. Execute live Xero API call if worker has connected Xero OAuth2
    let xeroInvoiceId = `xero-demo-${Date.now()}`;
    let liveXeroPush = false;

    if (
      !body.demoMode &&
      workerProfile?.xero_tenant_id &&
      workerProfile?.xero_token_set
    ) {
      const validTokenSet = await ensureValidXeroToken(
        workerProfile.xero_token_set
      );

      const xeroResponse = await fetch(
        "https://api.xero.com/api.xro/2.0/Invoices",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${validTokenSet.access_token}`,
            "Xero-tenant-id": workerProfile.xero_tenant_id,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(xeroPayload),
        }
      );

      if (!xeroResponse.ok) {
        const errText = await xeroResponse.text();
        return NextResponse.json(
          { error: `Xero API Error: ${errText}` },
          { status: xeroResponse.status }
        );
      }

      const xeroData = (await xeroResponse.json()) as {
        Invoices?: Array<{ InvoiceID?: string }>;
      };
      xeroInvoiceId =
        xeroData.Invoices?.[0]?.InvoiceID ?? `xero-live-${Date.now()}`;
      liveXeroPush = true;

      // Persist updated token set and claim status in Supabase
      if (isSupabaseConfigured()) {
        const supabase = await createSupabaseServerClient();
        await Promise.all([
          supabase
            .from("profiles")
            .update({ xero_token_set: validTokenSet })
            .eq("id", workerProfile.id),
          supabase.from("shifts_and_claims").upsert({
            ...claim,
            worker_id: workerProfile.id,
            xero_invoice_id: xeroInvoiceId,
            status: "xero_synced",
          }),
        ]);
      }
    }

    return NextResponse.json({
      success: true,
      status: "xero_synced",
      xeroInvoiceId,
      liveXeroPush,
      xeroPayloadSent: xeroPayload,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to submit invoice to Xero.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
