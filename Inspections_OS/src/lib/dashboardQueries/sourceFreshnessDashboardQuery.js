import { localDb } from "@/lib/localDb";
import {
  buildDashboardEnvelope,
  dashboardContractIds,
} from "@/lib/dashboardContracts";

/**
 * @returns {import("@/contracts/types").SourceFreshnessQueryEnvelope}
 */
export function getSourceFreshnessDashboardQuery() {
  const rows = localDb.listSourceRecords().map((sourceRecord) => ({
    id: sourceRecord.id,
    title: sourceRecord.title,
    packetRole: sourceRecord.packetRole,
    verificationStatus: sourceRecord.verificationStatus,
    fingerprintHash: sourceRecord.fingerprintHash,
    verifiedAt: sourceRecord.verifiedAt,
    lastSeenAt: sourceRecord.lastSeenAt,
    stale: Boolean(sourceRecord.stale),
  }));

  const payload = {
    summary: {
      total: rows.length,
      stale: rows.filter((item) => item.stale).length,
    },
    rows,
  };

  return buildDashboardEnvelope(dashboardContractIds.sourceFreshness, payload);
}
