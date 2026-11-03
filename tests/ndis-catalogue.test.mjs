// ============================================================================
// ShiftNote AU - Deterministic NDIS Engine Unit Tests
// Verifies rate-cap enforcement, 5-bracket day/time resolution, OCR line item
// formatting, Reference string formatting, and math accuracy.
// ============================================================================

import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Transpile TypeScript module on the fly so Node 18 can execute src/lib/ndis-catalogue.ts directly
const tsSource = fs.readFileSync(
  path.join(__dirname, "../src/lib/ndis-catalogue.ts"),
  "utf8"
);

// Strip TypeScript type annotations/imports to create an executable ES module for Node 18 test runner
const jsExecutable = tsSource
  .replace(/import type \{[\s\S]*?\} from "\.\/types";/g, "")
  .replace(/export interface NdisCatalogueItem \{[\s\S]*?\}/g, "")
  .replace(/:\s*readonly\s+AllowedNdisCode\[\]/g, "")
  .replace(/as const/g, "")
  .replace(/:\s*Record<AllowedNdisCode,\s*NdisCatalogueItem>/g, "")
  .replace(/:\s*ReadonlySet<string>/g, "")
  .replace(/\(code:\s*string\):\s*code is AllowedNdisCode/g, "(code)")
  .replace(/\(hhmm:\s*string\):\s*number/g, "(hhmm)")
  .replace(/\(startTime:\s*string,\s*endTime:\s*string\):\s*number/g, "(startTime, endTime)")
  .replace(
    /\(\s*shiftDate:\s*string,\s*startTime:\s*string,\s*endTime:\s*string,\s*isPublicHolidayOverride\s*=\s*false\s*\):\s*TimeBracket/g,
    "(shiftDate, startTime, endTime, isPublicHolidayOverride = false)"
  )
  .replace(
    /\(\s*category:\s*SupportCategory,\s*bracket:\s*TimeBracket\s*\):\s*AllowedNdisCode/g,
    "(category, bracket)"
  )
  .replace(/\(category:\s*SupportCategory\):\s*AllowedNdisCode/g, "(category)")
  .replace(
    /\(\s*code:\s*AllowedNdisCode,\s*requestedRate\?:\s*number\s*\|\s*null\s*\):\s*\{\s*appliedRate:\s*number;\s*priceCap:\s*number;\s*wasCapped:\s*boolean\s*\}/g,
    "(code, requestedRate)"
  )
  .replace(
    /\(\s*ndisCode:\s*AllowedNdisCode,\s*description:\s*string,\s*shiftDate:\s*string,\s*startTime:\s*string,\s*endTime:\s*string\s*\):\s*string/g,
    "(ndisCode, description, shiftDate, startTime, endTime)"
  )
  .replace(
    /\(\s*ndisNumber:\s*string,\s*participantFullName:\s*string\s*\):\s*string/g,
    "(ndisNumber, participantFullName)"
  )
  .replace(
    /export function buildValidatedShiftLineItems\(params:\s*\{[\s\S]*?\}\):\s*\{[\s\S]*?\}\s*\{/g,
    "export function buildValidatedShiftLineItems(params) {"
  )
  .replace(/const lineItems:\s*InvoiceLineItem\[\]\s*=/g, "const lineItems =");

const dataUri = `data:text/javascript;base64,${Buffer.from(jsExecutable, "utf8").toString("base64")}`;
const ndis = await import(dataUri);

test("1. Catalogue completeness: Contains all 12 Core Support & Provider Travel codes", () => {
  const expectedCodes = [
    "01_011_0107_1_1",
    "01_012_0107_1_1",
    "01_013_0107_1_1",
    "01_014_0107_1_1",
    "01_015_0107_1_1",
    "04_102_0125_6_1",
    "04_103_0125_6_1",
    "04_104_0125_6_1",
    "04_105_0125_6_1",
    "04_106_0125_6_1",
    "01_799_0107_1_1",
    "04_799_0125_6_1",
  ];
  for (const code of expectedCodes) {
    assert.equal(ndis.isValidNdisCode(code), true, `Expected ${code} to be valid`);
  }
  assert.equal(ndis.isValidNdisCode("99_999_9999_9_9"), false);
});

test("2. Day/Time Bracket Resolution: Weekday Daytime, Weekday Evening, Saturday, Sunday, Public Holiday", () => {
  // Monday 2026-11-02 09:00-12:00 -> weekday_daytime
  assert.equal(
    ndis.resolveTimeBracket("2026-11-02", "09:00", "12:00", false),
    "weekday_daytime"
  );

  // Monday 2026-11-02 18:30-21:00 -> weekday_evening
  assert.equal(
    ndis.resolveTimeBracket("2026-11-02", "18:30", "21:00", false),
    "weekday_evening"
  );

  // Saturday 2026-11-07 10:00-14:00 -> saturday
  assert.equal(
    ndis.resolveTimeBracket("2026-11-07", "10:00", "14:00", false),
    "saturday"
  );

  // Sunday 2026-11-08 10:00-14:00 -> sunday
  assert.equal(
    ndis.resolveTimeBracket("2026-11-08", "10:00", "14:00", false),
    "sunday"
  );

  // Public Holiday via statutory date (Christmas 2026-12-25) -> public_holiday
  assert.equal(
    ndis.resolveTimeBracket("2026-12-25", "09:00", "12:00", false),
    "public_holiday"
  );

  // Public Holiday via explicit flag -> public_holiday
  assert.equal(
    ndis.resolveTimeBracket("2026-11-02", "09:00", "12:00", true),
    "public_holiday"
  );
});

test("3. Rate-Cap Validation: Clamps rates above NDIS maximum and preserves lower negotiated rates", () => {
  // Above cap ($85.00 > $67.56 cap for Weekday Daytime Self-Care)
  const capped = ndis.enforceNdisPriceCap("01_011_0107_1_1", 85.0);
  assert.equal(capped.appliedRate, 67.56);
  assert.equal(capped.wasCapped, true);

  // Below cap ($62.50 <= $67.56 cap)
  const negotiated = ndis.enforceNdisPriceCap("01_011_0107_1_1", 62.5);
  assert.equal(negotiated.appliedRate, 62.5);
  assert.equal(negotiated.wasCapped, false);

  // Null/default rate uses exact NDIS cap
  const defaulted = ndis.enforceNdisPriceCap("04_106_0125_6_1", null);
  assert.equal(defaulted.appliedRate, 122.59);
  assert.equal(defaulted.wasCapped, false);
});

test("4. Plan Manager OCR Line Description & Reference Formatting", () => {
  const lineDesc = ndis.formatPlanManagerLineDescription(
    "04_104_0125_6_1",
    "Access Community Social and Rec Activ - Standard - Weekday Daytime",
    "2026-11-02",
    "09:00",
    "12:00"
  );
  assert.equal(
    lineDesc,
    "04_104_0125_6_1 - Access Community Social and Rec Activ - Standard - Weekday Daytime (2026-11-02, 09:00-12:00)"
  );

  const ref = ndis.formatInvoiceReference("430 918 274", "Liam O'Connor");
  assert.equal(ref, "NDIS# 430918274 - Liam O'Connor");
});

test("5. Full Shift Line Item Math Accuracy (Labour + Provider Travel KMs)", () => {
  const result = ndis.buildValidatedShiftLineItems({
    supportCategory: "community_access",
    shiftDate: "2026-11-02", // Monday
    startTime: "09:00",
    endTime: "12:00", // 3.0 hours
    kmTravelled: 14, // 14 km @ $0.99 = $13.86
    isPublicHoliday: false,
    hourlyRateOverride: null, // $67.56 * 3 = $202.68
  });

  assert.equal(result.bracket, "weekday_daytime");
  assert.equal(result.durationHours, 3);
  assert.equal(result.lineItems.length, 2);
  assert.equal(result.lineItems[0].ndis_code, "04_104_0125_6_1");
  assert.equal(result.lineItems[0].line_total, 202.68);
  assert.equal(result.lineItems[0].gst_code, "EXEMPTOUTPUT");
  assert.equal(result.lineItems[1].ndis_code, "04_799_0125_6_1");
  assert.equal(result.lineItems[1].line_total, 13.86);
  assert.equal(result.totalAmount, 216.54);
});
