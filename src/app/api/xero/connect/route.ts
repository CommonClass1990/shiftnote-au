// ============================================================================
// ShiftNote AU - Xero OAuth2 Initiation Route
// Redirects the support worker to Xero's OAuth2 authorization screen
// ============================================================================

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import crypto from "node:crypto";

export const runtime = "nodejs";

const XERO_AUTH_URL = "https://login.xero.com/identity/connect/authorize";
const XERO_SCOPES = [
  "openid",
  "profile",
  "email",
  "accounting.transactions",
  "accounting.contacts",
  "offline_access",
].join(" ");

export async function GET() {
  const clientId = process.env.XERO_CLIENT_ID;
  const redirectUri =
    process.env.XERO_REDIRECT_URI ||
    `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/xero/callback`;

  if (!clientId || clientId === "your-xero-oauth2-client-id") {
    return NextResponse.json(
      {
        error:
          "XERO_CLIENT_ID is not configured. Add XERO_CLIENT_ID and XERO_CLIENT_SECRET to .env.local or use Local Demo Mode.",
      },
      { status: 400 }
    );
  }

  const state = crypto.randomBytes(24).toString("hex");
  const cookieStore = await cookies();
  cookieStore.set("xero_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 600, // 10 minutes
  });

  const authorizeUrl = new URL(XERO_AUTH_URL);
  authorizeUrl.searchParams.set("response_type", "code");
  authorizeUrl.searchParams.set("client_id", clientId);
  authorizeUrl.searchParams.set("redirect_uri", redirectUri);
  authorizeUrl.searchParams.set("scope", XERO_SCOPES);
  authorizeUrl.searchParams.set("state", state);

  return NextResponse.redirect(authorizeUrl.toString());
}
