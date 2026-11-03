// ============================================================================
// ShiftNote AU - Core Domain & Database Types (Strict TypeScript)
// ============================================================================

export type FundingType = "plan_managed" | "self_managed" | "ndia_managed";

export type SubscriptionStatus =
  | "trialing"
  | "active"
  | "past_due"
  | "canceled"
  | "incomplete";

export type ClaimStatus =
  | "draft"
  | "approved"
  | "xero_synced"
  | "pdf_emailed"
  | "paid"
  | "voided";

export type SupportCategory = "self_care" | "community_access";

export type TimeBracket =
  | "weekday_daytime"
  | "weekday_evening"
  | "saturday"
  | "sunday"
  | "public_holiday";

export type AllowedNdisCode =
  | "01_011_0107_1_1"
  | "01_012_0107_1_1"
  | "01_013_0107_1_1"
  | "01_014_0107_1_1"
  | "01_015_0107_1_1"
  | "04_102_0125_6_1"
  | "04_103_0125_6_1"
  | "04_104_0125_6_1"
  | "04_105_0125_6_1"
  | "04_106_0125_6_1"
  | "01_799_0107_1_1"
  | "04_799_0125_6_1";

export interface XeroTokenSet {
  access_token: string;
  refresh_token: string;
  expires_at: number; // Unix timestamp in seconds
  token_type: string;
  scope?: string;
}

export interface WorkerProfile {
  id: string;
  business_name: string;
  abn: string;
  bsb: string;
  account_number: string;
  xero_tenant_id: string | null;
  xero_token_set: XeroTokenSet | null;
  default_hourly_rate_override: number | null;
  stripe_subscription_status: SubscriptionStatus;
}

export interface Participant {
  id: string;
  worker_id: string;
  full_name: string;
  ndis_number: string;
  funding_type: FundingType;
  plan_manager_name: string | null;
  plan_manager_email: string | null;
  xero_contact_id: string | null;
  ndis_goals_summary: string;
}

export interface NdisCaseNote {
  activities: string;
  engagement: string;
  goals_alignment: string;
}

export interface InvoiceLineItem {
  ndis_code: AllowedNdisCode;
  support_name: string;
  description: string; // Strictly "{ndis_code} - {description} ({shift_date}, {start_time}-{end_time})"
  unit: "H" | "KM";
  quantity: number;
  unit_price: number;
  max_price_limit: number;
  line_total: number;
  gst_code: "P2" | "EXEMPTOUTPUT";
}

export interface ShiftAndClaim {
  id: string;
  worker_id: string;
  participant_id: string;
  shift_date: string; // YYYY-MM-DD
  start_time: string; // HH:mm (24h)
  end_time: string; // HH:mm (24h)
  duration_hours: number;
  km_travelled: number;
  raw_transcript: string;
  case_note_activities: string;
  case_note_engagement: string;
  case_note_goals: string;
  line_items: InvoiceLineItem[];
  total_amount: number;
  invoice_number: string;
  xero_invoice_id: string | null;
  status: ClaimStatus;
  created_at: string;
}

export interface GeminiVoiceExtractionResult {
  raw_transcript: string;
  shift_date: string; // YYYY-MM-DD
  start_time: string; // HH:mm
  end_time: string; // HH:mm
  duration_hours: number;
  km_travelled: number;
  is_public_holiday: boolean;
  support_category: SupportCategory;
  primary_ndis_code: AllowedNdisCode;
  travel_ndis_code: AllowedNdisCode | null;
  requested_hourly_rate: number | null;
  case_note: NdisCaseNote;
}
