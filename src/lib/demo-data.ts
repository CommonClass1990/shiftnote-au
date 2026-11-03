// ============================================================================
// ShiftNote AU - Pre-Seeded Local Demo State
// Enables instant zero-DB testing of Voice -> Gemini 4 Argon -> PDF/Xero
// ============================================================================

import type { Participant, ShiftAndClaim, WorkerProfile } from "./types";

export const DEMO_WORKER_PROFILE: WorkerProfile = {
  id: "00000000-0000-4000-8000-000000000001",
  business_name: "Lachlan Reid Care Services (Sole Trader)",
  abn: "51 824 753 556",
  bsb: "062-000",
  account_number: "1094 8821",
  xero_tenant_id: null,
  xero_token_set: null,
  default_hourly_rate_override: null,
  stripe_subscription_status: "active",
};

export const DEMO_PARTICIPANTS: Participant[] = [
  {
    id: "11111111-1111-4111-8111-111111111101",
    worker_id: DEMO_WORKER_PROFILE.id,
    full_name: "Liam O'Connor",
    ndis_number: "430918274",
    funding_type: "plan_managed",
    plan_manager_name: "MyIntegra Plan Management",
    plan_manager_email: "claims@myintegra.com.au",
    xero_contact_id: "xero-contact-liam-001",
    ndis_goals_summary:
      "Goal 1: Build independence in weekly grocery shopping, meal preparation, and budgeting. Goal 2: Increase community social participation by attending local hydrotherapy and coastal walking groups twice a week.",
  },
  {
    id: "11111111-1111-4111-8111-111111111102",
    worker_id: DEMO_WORKER_PROFILE.id,
    full_name: "Chloe Nguyen",
    ndis_number: "431059382",
    funding_type: "plan_managed",
    plan_manager_name: "NIB Thrive Plan Management",
    plan_manager_email: "invoices@nibthrive.com.au",
    xero_contact_id: "xero-contact-chloe-002",
    ndis_goals_summary:
      "Goal 1: Maintain safe morning personal care, showering, and medication prompting routine at home. Goal 2: Develop confidence using public transport and visiting the local library.",
  },
  {
    id: "11111111-1111-4111-8111-111111111103",
    worker_id: DEMO_WORKER_PROFILE.id,
    full_name: "Marcus Vance",
    ndis_number: "430774190",
    funding_type: "self_managed",
    plan_manager_name: "Self-Managed (Direct to Participant)",
    plan_manager_email: "marcus.vance.ndis@example.com.au",
    xero_contact_id: "xero-contact-marcus-003",
    ndis_goals_summary:
      "Goal 1: Engage in weekend community fitness and social recreation at Cronulla Beach and local gym sessions. Goal 2: Maintain household organisation and independent living skills.",
  },
];

export const DEMO_INITIAL_SHIFTS: ShiftAndClaim[] = [
  {
    id: "22222222-2222-4222-8222-222222222201",
    worker_id: DEMO_WORKER_PROFILE.id,
    participant_id: DEMO_PARTICIPANTS[0]!.id,
    shift_date: "2026-11-02",
    start_time: "09:00",
    end_time: "12:00",
    duration_hours: 3,
    km_travelled: 14,
    raw_transcript:
      "Finished a three hour community access shift with Liam O'Connor today from 9am to 12pm. We drove 14 kilometres to Sutherland Leisure Centre for his hydrotherapy session and afterwards went to Woolworths Kirrawee where Liam used his visual checklist to select ingredients and pay at the checkout.",
    case_note_activities:
      "Provided 3.0 hours of 1:1 community access support for Liam from 09:00 to 12:00, including 14 km of provider transport. Accompanied Liam to Sutherland Leisure Centre to complete his scheduled 45-minute hydrotherapy mobility routine, followed by a structured grocery shopping session at Woolworths Kirrawee.",
    case_note_engagement:
      "Liam demonstrated positive engagement throughout the morning, independently following his laminated visual grocery list and initiating conversation with the cashier during checkout with minimal verbal prompting.",
    case_note_goals:
      "Directly aligned with Goal 1 (independent grocery shopping and budgeting) by practising list-based item selection and point-of-sale payment, and Goal 2 (community social participation) through consistent attendance at community hydrotherapy.",
    line_items: [
      {
        ndis_code: "04_104_0125_6_1",
        support_name:
          "Access Community Social and Rec Activ - Standard - Weekday Daytime",
        description:
          "04_104_0125_6_1 - Access Community Social and Rec Activ - Standard - Weekday Daytime (2026-11-02, 09:00-12:00)",
        unit: "H",
        quantity: 3,
        unit_price: 67.56,
        max_price_limit: 67.56,
        line_total: 202.68,
        gst_code: "EXEMPTOUTPUT",
      },
      {
        ndis_code: "04_799_0125_6_1",
        support_name: "Provider travel - non-labour costs (Community Access)",
        description:
          "04_799_0125_6_1 - Provider travel - non-labour costs (Community Access) (2026-11-02, 09:00-12:00)",
        unit: "KM",
        quantity: 14,
        unit_price: 0.99,
        max_price_limit: 0.99,
        line_total: 13.86,
        gst_code: "EXEMPTOUTPUT",
      },
    ],
    total_amount: 216.54,
    invoice_number: "INV-20261102-001",
    xero_invoice_id: "xero-inv-982341",
    status: "xero_synced",
    created_at: "2026-11-02T12:15:00.000Z",
  },
  {
    id: "22222222-2222-4222-8222-222222222202",
    worker_id: DEMO_WORKER_PROFILE.id,
    participant_id: DEMO_PARTICIPANTS[1]!.id,
    shift_date: "2026-11-01",
    start_time: "08:00",
    end_time: "10:30",
    duration_hours: 2.5,
    km_travelled: 0,
    raw_transcript:
      "Completed a two and a half hour Saturday morning personal care shift with Chloe Nguyen from 8am to 10:30am. Assisted with safe showering, dressing, breakfast preparation, and prompted her morning medication check.",
    case_note_activities:
      "Delivered 2.5 hours of in-home personal care support for Chloe on Saturday from 08:00 to 10:30. Assisted with bathroom setup, standby safety support during showering, dressing selection, nutritious breakfast preparation, and verbal prompting for morning medication administration.",
    case_note_engagement:
      "Chloe communicated her preferences clearly regarding clothing and breakfast options, completing upper-body dressing independently and confirming her medication checklist without distress.",
    case_note_goals:
      "Directly supported Goal 1 (maintaining a safe morning personal care, showering, and medication routine at home) by reinforcing independent self-care steps within a predictable morning structure.",
    line_items: [
      {
        ndis_code: "01_013_0107_1_1",
        support_name:
          "Assistance With Self-Care Activities - Standard - Saturday",
        description:
          "01_013_0107_1_1 - Assistance With Self-Care Activities - Standard - Saturday (2026-11-01, 08:00-10:30)",
        unit: "H",
        quantity: 2.5,
        unit_price: 95.07,
        max_price_limit: 95.07,
        line_total: 237.68,
        gst_code: "EXEMPTOUTPUT",
      },
    ],
    total_amount: 237.68,
    invoice_number: "INV-20261101-002",
    xero_invoice_id: null,
    status: "pdf_emailed",
    created_at: "2026-11-01T10:45:00.000Z",
  },
];

export const SAMPLE_VOICE_TRANSCRIPTS: Record<string, string> = {
  "11111111-1111-4111-8111-111111111101":
    "Just wrapped up a 3 hour community access shift with Liam O'Connor today, 2nd of November 2026, from 1:30pm to 4:30pm. We travelled 18 kilometres round trip to Miranda Library and then Woolworths where Liam practised comparing unit prices on his shopping list and paid independently.",
  "11111111-1111-4111-8111-111111111102":
    "Completed a 2 hour evening self-care support shift with Chloe Nguyen today, 2nd of November 2026, from 6:30pm to 8:30pm. Assisted Chloe with evening meal preparation, kitchen tidy-up, personal hygiene routine, and evening medication prompting. Travelled 6 kilometres.",
  "11111111-1111-4111-8111-111111111103":
    "Finished a 4 hour Sunday community access shift with Marcus Vance on 1st of November 2026 from 10:00am to 2:00pm. Drove 22 kilometres to Cronulla esplanade for coastal mobility walk and social cafe lunch.",
};
