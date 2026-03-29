import { jsPDF } from "jspdf";

/**
 * @typedef {{
 *   packetId: string
 *   packetClass: string
 *   title: string
 *   projectName: string
 *   runId: string
 *   generatedAt: string
 *   evaluation: import("@/contracts/types").GateEvaluation
 *   manifest: import("@/contracts/types").VerificationManifest
 *   answers: Record<string, unknown>
 *   waiverSummary?: {
 *     transitionAttemptId?: string | null
 *     waiverAction?: "advance"|"waive"|"save_draft"|null
 *     waiverAllowed?: boolean
 *     waiverReason?: string | null
 *     waivedExceptionCodes: string[]
 *     waiverReasons: string[]
 *   }
 * }} PacketRenderModel
 */

/**
 * @param {PacketRenderModel} packet
 */
export function renderPacketPdfBlob(packet) {
  const pdf = new jsPDF();
  let y = 18;
  const write = (text, size = 11, bold = false) => {
    pdf.setFont("helvetica", bold ? "bold" : "normal");
    pdf.setFontSize(size);
    const lines = pdf.splitTextToSize(text, 170);
    pdf.text(lines, 20, y);
    y += lines.length * 7;
  };

  write("Inspection.OS Packet", 16, true);
  write(String(packet.title || "Untitled packet"), 12, true);
  write(`Project: ${packet.projectName || "Unknown"}`);
  write(`Run ID: ${packet.runId || "Unknown"}`);
  write(`Packet class: ${packet.packetClass || "inspection_packet"}`);
  write(`Rule snapshot: ${packet.manifest.ruleSnapshotId || "n/a"}`);
  write(`Stage status: ${packet.evaluation.status || "unknown"}`);

  y += 4;
  write("Official source records", 11, true);
  packet.manifest.sourceEntries.forEach((entry) => {
    write(`- ${entry.title} (${entry.verificationStatus} / ${entry.packetRole})`, 10);
  });

  y += 4;
  write("Evidence inventory", 11, true);
  packet.manifest.evidenceInventory.evidenceItems.forEach((item) => {
    write(`- #${item.order} ${item.kind} (${item.hash})`, 10);
  });

  if (packet.manifest.basisDisclosures.length) {
    y += 4;
    write("Basis disclosures", 11, true);
    packet.manifest.basisDisclosures.forEach((item) => {
      write(`- ${item.title}: ${item.verificationStatus}`, 10);
    });
  }

  if (packet.manifest.exceptions.length) {
    y += 4;
    write("Blockers / exceptions", 11, true);
    packet.manifest.exceptions.forEach((exceptionItem) => {
      const waivedText = exceptionItem.waived
        ? ` [WAIVED: ${exceptionItem.waiverReason || "reason not captured"}]`
        : "";
      write(`- ${exceptionItem.code}: ${exceptionItem.message}${waivedText}`, 10);
    });
  }

  if (packet.manifest.waiverSection) {
    y += 4;
    write("Waiver section", 11, true);
    write(`- Action: ${packet.manifest.waiverSection.action || "none"}`, 10);
    write(`- Allowed: ${packet.manifest.waiverSection.allowed ? "yes" : "no"}`, 10);
    if (packet.manifest.waiverSection.waiverReason) {
      write(`- Reason: ${packet.manifest.waiverSection.waiverReason}`, 10);
    }
    if ((packet.manifest.waiverSection.waivedBlockerCodes || []).length) {
      write(
        `- Waived blockers: ${packet.manifest.waiverSection.waivedBlockerCodes.join(", ")}`,
        10
      );
    }
  }

  if ((packet.waiverSummary?.waivedExceptionCodes || []).length) {
    y += 4;
    write("Waiver summary", 11, true);
    packet.waiverSummary.waivedExceptionCodes.forEach((code) => write(`- ${code}`, 10));
  }

  return pdf.output("blob");
}
