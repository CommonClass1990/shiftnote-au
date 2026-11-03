// ============================================================================
// ShiftNote AU - In-Memory ATO & NDIS Compliant GST-Free Tax Invoice Generator
// Powered by pdf-lib (Zero native binary dependencies, Edge/Serverless ready)
// ============================================================================

import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import { formatInvoiceReference, formatPlanManagerLineDescription } from "./ndis-catalogue";
import type { InvoiceLineItem, Participant, ShiftAndClaim, WorkerProfile } from "./types";

export interface GenerateInvoicePdfInput {
  worker: WorkerProfile;
  participant: Participant;
  claim: ShiftAndClaim;
  includeCaseNotesOnInvoice?: boolean;
}

/**
 * Helper to wrap text within a maximum pixel width in pdf-lib.
 */
function wrapText(
  text: string,
  font: PDFFont,
  fontSize: number,
  maxWidth: number
): string[] {
  const words = text.replace(/\r?\n/g, " ").split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    const candidate = currentLine ? `${currentLine} ${word}` : word;
    const width = font.widthOfTextAtSize(candidate, fontSize);
    if (width <= maxWidth) {
      currentLine = candidate;
    } else {
      if (currentLine) {
        lines.push(currentLine);
      }
      currentLine = word;
    }
  }
  if (currentLine) {
    lines.push(currentLine);
  }
  return lines.length > 0 ? lines : [""];
}

/**
 * Generates an Australian ATO & NDIS Plan Manager OCR-compliant GST-Free Tax Invoice
 * in memory and returns the raw PDF bytes as a Uint8Array.
 */
export async function generateNdisInvoicePdf(
  input: GenerateInvoicePdfInput
): Promise<Uint8Array> {
  const { worker, participant, claim, includeCaseNotesOnInvoice = true } = input;

  const pdfDoc = await PDFDocument.create();
  pdfDoc.setTitle(`Tax Invoice ${claim.invoice_number} - ${participant.full_name}`);
  pdfDoc.setSubject(
    formatInvoiceReference(participant.ndis_number, participant.full_name)
  );
  pdfDoc.setCreator("ShiftNote AU — NDIS Clinical & Invoicing Engine");

  const page: PDFPage = pdfDoc.addPage([595.28, 841.89]); // A4 Portrait
  const { width, height } = page.getSize();

  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const navy = rgb(0.06, 0.09, 0.16);
  const teal = rgb(0.05, 0.58, 0.53);
  const slate = rgb(0.28, 0.33, 0.41);
  const lightBg = rgb(0.96, 0.97, 0.99);
  const borderGray = rgb(0.82, 0.85, 0.9);

  const margin = 42;
  let y = height - margin;

  // --------------------------------------------------------------------------
  // 1. Top Banner & ATO Tax Invoice Header
  // --------------------------------------------------------------------------
  page.drawRectangle({
    x: 0,
    y: height - 92,
    width,
    height: 92,
    color: navy,
  });

  page.drawText("TAX INVOICE", {
    x: margin,
    y: height - 42,
    size: 22,
    font: fontBold,
    color: rgb(1, 1, 1),
  });

  page.drawText("AUSTRALIAN NDIS CORE SUPPORTS — GST-FREE SUPPLY", {
    x: margin,
    y: height - 62,
    size: 9.5,
    font: fontBold,
    color: rgb(0.4, 0.92, 0.85),
  });

  const invoiceRef = formatInvoiceReference(
    participant.ndis_number,
    participant.full_name
  );

  const rightHeaderX = width - margin - 210;
  page.drawText(`Invoice #: ${claim.invoice_number}`, {
    x: rightHeaderX,
    y: height - 38,
    size: 11,
    font: fontBold,
    color: rgb(1, 1, 1),
  });
  page.drawText(`Service Date: ${claim.shift_date}`, {
    x: rightHeaderX,
    y: height - 54,
    size: 9.5,
    font: fontRegular,
    color: rgb(0.88, 0.91, 0.96),
  });
  page.drawText(`Shift Window: ${claim.start_time} - ${claim.end_time}`, {
    x: rightHeaderX,
    y: height - 69,
    size: 9.5,
    font: fontRegular,
    color: rgb(0.88, 0.91, 0.96),
  });

  y = height - 116;

  // --------------------------------------------------------------------------
  // 2. Reference Bar (Mandatory Plan Manager OCR String)
  // --------------------------------------------------------------------------
  page.drawRectangle({
    x: margin,
    y: y - 24,
    width: width - margin * 2,
    height: 28,
    color: lightBg,
    borderColor: teal,
    borderWidth: 1,
  });

  page.drawText(`Reference: ${invoiceRef}`, {
    x: margin + 10,
    y: y - 14,
    size: 10.5,
    font: fontBold,
    color: navy,
  });

  y -= 44;

  // --------------------------------------------------------------------------
  // 3. Two-Column Provider (Worker) & Participant / Plan Manager Details
  // --------------------------------------------------------------------------
  const colWidth = (width - margin * 2 - 20) / 2;
  const rightColX = margin + colWidth + 20;

  page.drawText("FROM (NDIS SUPPORT PROVIDER)", {
    x: margin,
    y,
    size: 8.5,
    font: fontBold,
    color: teal,
  });
  page.drawText("BILL TO (PARTICIPANT & PLAN MANAGER)", {
    x: rightColX,
    y,
    size: 8.5,
    font: fontBold,
    color: teal,
  });

  y -= 15;
  page.drawText(worker.business_name || "Independent NDIS Support Worker", {
    x: margin,
    y,
    size: 11,
    font: fontBold,
    color: navy,
  });
  page.drawText(participant.full_name, {
    x: rightColX,
    y,
    size: 11,
    font: fontBold,
    color: navy,
  });

  y -= 14;
  page.drawText(`ABN: ${worker.abn || "Provided on File"}`, {
    x: margin,
    y,
    size: 9.5,
    font: fontRegular,
    color: slate,
  });
  page.drawText(`NDIS Number: ${participant.ndis_number}`, {
    x: rightColX,
    y,
    size: 9.5,
    font: fontBold,
    color: navy,
  });

  y -= 14;
  page.drawText(
    `EFT Bank Details: BSB ${worker.bsb || "N/A"} | Acct ${worker.account_number || "N/A"}`,
    {
      x: margin,
      y,
      size: 9.5,
      font: fontRegular,
      color: slate,
    }
  );
  page.drawText(
    `Plan Manager: ${participant.plan_manager_name || "Self / Plan Managed"}`,
    {
      x: rightColX,
      y,
      size: 9.5,
      font: fontRegular,
      color: slate,
    }
  );

  y -= 14;
  page.drawText("Tax Status: GST-Free Supply (s38-38 GST Act 1999)", {
    x: margin,
    y,
    size: 9,
    font: fontRegular,
    color: slate,
  });
  page.drawText(`Claims Email: ${participant.plan_manager_email || "N/A"}`, {
    x: rightColX,
    y,
    size: 9,
    font: fontRegular,
    color: slate,
  });

  y -= 28;

  // --------------------------------------------------------------------------
  // 4. Itemized NDIS Support Line Items Table
  // --------------------------------------------------------------------------
  const tableWidth = width - margin * 2;
  const colCodeX = margin + 8;
  const colDescX = margin + 108;
  const colQtyX = margin + 340;
  const colRateX = margin + 390;
  const colGstX = margin + 442;
  const colTotalX = margin + tableWidth - 52;

  page.drawRectangle({
    x: margin,
    y: y - 20,
    width: tableWidth,
    height: 22,
    color: navy,
  });

  const headerY = y - 13;
  page.drawText("NDIS Item Code", {
    x: colCodeX,
    y: headerY,
    size: 8.5,
    font: fontBold,
    color: rgb(1, 1, 1),
  });
  page.drawText("Support Description (OCR Compliant)", {
    x: colDescX,
    y: headerY,
    size: 8.5,
    font: fontBold,
    color: rgb(1, 1, 1),
  });
  page.drawText("Qty", {
    x: colQtyX,
    y: headerY,
    size: 8.5,
    font: fontBold,
    color: rgb(1, 1, 1),
  });
  page.drawText("Rate", {
    x: colRateX,
    y: headerY,
    size: 8.5,
    font: fontBold,
    color: rgb(1, 1, 1),
  });
  page.drawText("GST", {
    x: colGstX,
    y: headerY,
    size: 8.5,
    font: fontBold,
    color: rgb(1, 1, 1),
  });
  page.drawText("Total", {
    x: colTotalX,
    y: headerY,
    size: 8.5,
    font: fontBold,
    color: rgb(1, 1, 1),
  });

  y -= 24;

  for (let i = 0; i < claim.line_items.length; i++) {
    const item: InvoiceLineItem = claim.line_items[i]!;
    const ocrDescription = formatPlanManagerLineDescription(
      item.ndis_code,
      item.support_name || item.description,
      claim.shift_date,
      claim.start_time,
      claim.end_time
    );

    const wrappedDesc = wrapText(ocrDescription, fontRegular, 8.5, 224);
    const rowHeight = Math.max(28, wrappedDesc.length * 12 + 10);

    if (i % 2 === 0) {
      page.drawRectangle({
        x: margin,
        y: y - rowHeight,
        width: tableWidth,
        height: rowHeight,
        color: lightBg,
      });
    }

    page.drawLine({
      start: { x: margin, y: y - rowHeight },
      end: { x: margin + tableWidth, y: y - rowHeight },
      thickness: 0.5,
      color: borderGray,
    });

    const textTopY = y - 13;
    page.drawText(item.ndis_code, {
      x: colCodeX,
      y: textTopY,
      size: 8.5,
      font: fontBold,
      color: navy,
    });

    wrappedDesc.forEach((line, idx) => {
      page.drawText(line, {
        x: colDescX,
        y: textTopY - idx * 11,
        size: 8.5,
        font: fontRegular,
        color: navy,
      });
    });

    page.drawText(`${item.quantity.toFixed(2)} ${item.unit}`, {
      x: colQtyX,
      y: textTopY,
      size: 8.5,
      font: fontRegular,
      color: navy,
    });

    page.drawText(`$${item.unit_price.toFixed(2)}`, {
      x: colRateX,
      y: textTopY,
      size: 8.5,
      font: fontRegular,
      color: navy,
    });

    page.drawText("$0.00", {
      x: colGstX,
      y: textTopY,
      size: 8.5,
      font: fontRegular,
      color: slate,
    });

    page.drawText(`$${item.line_total.toFixed(2)}`, {
      x: colTotalX,
      y: textTopY,
      size: 9,
      font: fontBold,
      color: navy,
    });

    y -= rowHeight;
  }

  // --------------------------------------------------------------------------
  // 5. Invoice Totals Box
  // --------------------------------------------------------------------------
  y -= 14;
  const totalsBoxX = width - margin - 210;

  page.drawText("Subtotal (Excl. GST):", {
    x: totalsBoxX,
    y,
    size: 9.5,
    font: fontRegular,
    color: slate,
  });
  page.drawText(`$${claim.total_amount.toFixed(2)} AUD`, {
    x: width - margin - 72,
    y,
    size: 9.5,
    font: fontBold,
    color: navy,
  });

  y -= 15;
  page.drawText("GST (0% EXEMPTOUTPUT):", {
    x: totalsBoxX,
    y,
    size: 9.5,
    font: fontRegular,
    color: slate,
  });
  page.drawText("$0.00 AUD", {
    x: width - margin - 72,
    y,
    size: 9.5,
    font: fontRegular,
    color: slate,
  });

  y -= 22;
  page.drawRectangle({
    x: totalsBoxX - 8,
    y: y - 6,
    width: 218,
    height: 24,
    color: navy,
  });

  page.drawText("TOTAL DUE (AUD):", {
    x: totalsBoxX,
    y: y + 2,
    size: 10.5,
    font: fontBold,
    color: rgb(1, 1, 1),
  });
  page.drawText(`$${claim.total_amount.toFixed(2)}`, {
    x: width - margin - 68,
    y: y + 2,
    size: 11.5,
    font: fontBold,
    color: rgb(0.4, 0.92, 0.85),
  });

  y -= 32;

  // --------------------------------------------------------------------------
  // 6. Objective NDIS Clinical Case Note Summary (Audit Trail)
  // --------------------------------------------------------------------------
  if (includeCaseNotesOnInvoice && y > 130) {
    page.drawLine({
      start: { x: margin, y },
      end: { x: width - margin, y },
      thickness: 0.75,
      color: borderGray,
    });

    y -= 16;
    page.drawText("NDIS CLINICAL SHIFT CASE NOTE SUMMARY (AUDIT RECORD)", {
      x: margin,
      y,
      size: 9.5,
      font: fontBold,
      color: teal,
    });

    const sections: Array<{ label: string; content: string }> = [
      { label: "1. Supports & Activities Delivered:", content: claim.case_note_activities },
      { label: "2. Participant Engagement & Observations:", content: claim.case_note_engagement },
      { label: "3. Alignment with NDIS Plan Goals:", content: claim.case_note_goals },
    ];

    for (const sec of sections) {
      y -= 14;
      if (y < 60) break;
      page.drawText(sec.label, {
        x: margin,
        y,
        size: 8.5,
        font: fontBold,
        color: navy,
      });
      const lines = wrapText(sec.content || "N/A", fontRegular, 8.5, tableWidth);
      for (const line of lines) {
        y -= 11;
        if (y < 50) break;
        page.drawText(line, {
          x: margin,
          y,
          size: 8.5,
          font: fontRegular,
          color: slate,
        });
      }
    }
  }

  // --------------------------------------------------------------------------
  // 7. Footer Compliance Statement
  // --------------------------------------------------------------------------
  page.drawLine({
    start: { x: margin, y: 42 },
    end: { x: width - margin, y: 42 },
    thickness: 0.5,
    color: borderGray,
  });

  page.drawText(
    `Generated by ShiftNote AU • Payment Reference: ${claim.invoice_number} • BSB: ${worker.bsb} Acct: ${worker.account_number}`,
    {
      x: margin,
      y: 28,
      size: 8,
      font: fontRegular,
      color: slate,
    }
  );

  return pdfDoc.save();
}
