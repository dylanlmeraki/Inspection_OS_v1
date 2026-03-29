import { localDb } from "@/lib/localDb";
import {
  buildDashboardEnvelope,
  dashboardContractIds,
} from "@/lib/dashboardContracts";

/**
 * @returns {import("@/contracts/types").ExportCenterQueryEnvelope}
 */
export function getExportCenterDashboardQuery() {
  const exports = localDb.listExports();
  const manifests = localDb.listManifests();

  const manifestRows = manifests.map((manifest) => {
    const sourceEntries =
      manifest.sourceEntries || localDb.listManifestSourceEntries(manifest.id);
    return {
      id: manifest.id,
      stageCode: manifest.stageCode,
      jurisdictionKey: manifest.jurisdictionKey,
      inspectionTypeCode: manifest.inspectionTypeCode,
      sourceTitles: sourceEntries.map((entry) => entry.title),
      basisStatuses: (manifest.basisDisclosures || []).map((item) => item.verificationStatus),
      waiverAction: manifest.waiverSection?.action || null,
      waiverAllowed: Boolean(manifest.waiverSection?.allowed),
      waiverReason: manifest.waiverSection?.waiverReason || null,
      waivedExceptions: (manifest.exceptions || [])
        .filter((item) => item.waived)
        .map((item) => ({
          code: item.code,
          waiverReason: item.waiverReason || null,
        })),
    };
  });

  const payload = {
    exports,
    manifests: manifestRows,
  };

  return buildDashboardEnvelope(dashboardContractIds.exportCenter, payload);
}
