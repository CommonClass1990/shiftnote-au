// ============================================================================
// ShiftNote AU - Xero OAuth2 Callback Route
// Exchanges authorization code for access/refresh tokens, resolves active
// Australian Xero Organisation tenantId, and stores token set in Supabase.
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  createSupabaseServerClient,
  isSupabaseConfigured,
} from "@/lib/supabase/server";
import type { XeroTokenSet } from "@/lib/types";

export const runtime = "nodejs";

interface XeroConnection {
  id: string;
  authEventId: string;
  tenantId: string;
  tenantType: string;
  tenantName: string;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const returnedState = searchParams.get("state");
    const oauthError = searchParams.get("error");

    const appBaseUrl =
      process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    if (oauthError) {
      return NextResponse.redirect(
        `${appBaseUrl}/dashboard?xero_error=${encodeURIComponent(oauthError)}`
      );
    }

    if (!code) {
      return NextResponse.redirect(
        `${appBaseUrl}/dashboard?xero_error=missing_code`
      );
    }

    const cookieStore = await cookies();
    const expectedState = cookieStore.get("xero_oauth_state")?.value;
    cookieStore.delete("xero_oauth_state");

    if (!expectedState || expectedState !== returnedState) {
      return NextResponse.redirect(
        `${appBaseUrl}/dashboard?xero_error=invalid_state`
      );
    }

    const clientId = process.env.XERO_CLIENT_ID ?? "";
    const clientSecret = process.env.XERO_CLIENT_SECRET ?? "";
    const redirectUri =
      process.env.XERO_REDIRECT_URI || `${appBaseUrl}/api/xero/callback`;

    const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString(
      "base64"
    );

    // 1. Exchange code for OAuth2 tokens
    const tokenRes = await fetch("https://identity.xero.com/connect/token", {
      method: "POST",
      headers: {
        Authorization: `Basic ${basicAuth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenRes.ok) {
      const errBody = await tokenRes.text();
      return NextResponse.redirect(
        `${appBaseUrl}/dashboard?xero_error=${encodeURIComponent(errBody.slice(0, 120))}`
      );
    }

    const rawTokens = (await tokenRes.json()) as {
      access_token: string;
      refresh_token: string;
      expires_in: number;
      token_type: string;
      scope?: string;
    };

    const tokenSet: XeroTokenSet = {
      access_token: rawTokens.access_token,
      refresh_token: rawTokens.refresh_token,
      expires_at: Math.floor(Date.now() / 1000) + rawTokens.expires_in,
      token_type: rawTokens.token_type,
      scope: rawTokens.scope,
    };

    // 2. Fetch authorized Xero Tenant ID
    const connectionsRes = await fetch("https://api.xero.com/connections", {
      headers: {
        Authorization: `Bearer ${tokenSet.access_token}`,
        Accept: "application/json",
      },
    });

    if (!connectionsRes.ok) {
      return NextResponse.redirect(
        `${appBaseUrl}/dashboard?xero_error=failed_to_fetch_connections`
      );
    }

    const connections = (await connectionsRes.json()) as XeroConnection[];
    const primaryTenant = connections[0];

    if (!primaryTenant?.tenantId) {
      return NextResponse.redirect(
        `${appBaseUrl}/dashboard?xero_error=no_xero_organisation_connected`
      );
    }

    // 3. Persist xero_tenant_id & xero_token_set to Worker's Supabase Profile
    if (isSupabaseConfigured()) {
      const supabase = await createSupabaseServerClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        await supabase
          .from("profiles")
          .update({
            xero_tenant_id: primaryTenant.tenantId,
            xero_token_set: tokenSet,
            updated_at: new Date().toISOString(),
          })
          .eq("id", user.id);
      }
    }

    return NextResponse.redirect(`${appBaseUrl}/dashboard?xero_connected=true`);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "xero_callback_failed";
    const appBaseUrl =
      process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    return NextResponse.redirect(
      `${appBaseUrl}/dashboard?xero_error=${encodeURIComponent(message)}`
    );
  }
}
